

import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	ArrowUpDown,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	MoreHorizontal,
	Search,
} from "lucide-react";
import * as React from "react";

import { Button } from "~/lib/components/ui/button";
import { Checkbox } from "~/lib/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/lib/components/ui/dropdown-menu";
import { Input } from "~/lib/components/ui/input";
import { Label } from "~/lib/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/lib/components/ui/select";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "~/lib/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/lib/components/ui/table";

export interface DataTableProps<TData> {
	data: TData[];
	columns: ColumnDef<TData>[];
	showSelectColumn?: boolean;
	searchableColumns?: Array<keyof TData & string>;
	rowViewerContent?: React.ComponentType<{ item: TData }>;
	pageSize?: number;
	// Maybe add additional customization props later
}

export function DataTable<TData>({
	data,
	columns: userColumns,
	showSelectColumn = false,
	searchableColumns = [],
	rowViewerContent: CellViewerContent,
	pageSize = 50,
}: DataTableProps<TData>) {
	// Create the select column
	const selectColumn: ColumnDef<TData> = {
		id: "select",
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && "indeterminate")
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
			/>
		),
		enableSorting: false,
		enableHiding: false,
	};

	// Create the actions column
	const actionsColumn: ColumnDef<TData> = {
		id: "actions",
		//header: "Actions",
		enableHiding: false,
		cell: ({ row }) => {
			const item = row.original;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="w-8 h-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuItem
							// We'll need to adapt this to be more generic
							onClick={() => {
								const itemId =
									typeof item === "object" && item !== null && "id" in item
										? String(item.id)
										: "";
								navigator.clipboard.writeText(itemId);
							}}
						>
							Copy ID
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>View details</DropdownMenuItem>
						<DropdownMenuItem>Edit</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	};

	// Combine the columns
	const allColumns = [
		...(showSelectColumn ? [selectColumn] : []),
		...userColumns,
		actionsColumn,
	];

	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});
	const [searchColumn, setSearchColumn] = React.useState<string>(
		searchableColumns.length > 0 ? String(searchableColumns[0]) : "",
	);
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: pageSize,
	});

	// Validate that searchableColumns only contains valid column IDs
	React.useEffect(() => {
		const columnIds = userColumns.map((col) =>
			String(col.id || ("accessorKey" in col ? col.accessorKey : undefined)),
		);
		const invalidColumns = searchableColumns.filter(
			(col) => !columnIds.includes(String(col)),
		);

		if (invalidColumns.length > 0) {
			console.warn(
				`Warning: The following searchableColumns do not match any column IDs: ${invalidColumns.join(", ")}`,
			);
		}
	}, [searchableColumns, userColumns]);

	const table = useReactTable({
		data,
		columns: allColumns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		onPaginationChange: setPagination,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			pagination,
		},
	});

	// Add state for the selected row
	const [selectedRow, setSelectedRow] = React.useState<TData | null>(null);

	return (
		<div className="w-full">
			<div className="flex items-center py-4">
				{searchableColumns.length > 0 && (
					<div className="flex items-center gap-2 max-w-sm">
						{searchableColumns.length > 1 && (
							<Select value={searchColumn} onValueChange={setSearchColumn}>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Select column" />
								</SelectTrigger>
								<SelectContent>
									{searchableColumns.map((column) => (
										<SelectItem key={String(column)} value={String(column)}>
											{String(column)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
						<div className="relative w-full">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder={`Search ${searchColumn}...`}
								value={
									(table.getColumn(searchColumn)?.getFilterValue() as string) ??
									""
								}
								onChange={(event) =>
									table
										.getColumn(searchColumn)
										?.setFilterValue(event.target.value)
								}
								className="pl-8 max-w-sm"
							/>
						</div>
					</div>
				)}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="ml-auto">
							Columns <ChevronDown />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{table
							.getAllColumns()
							.filter((column) => column.getCanHide())
							.map((column) => {
								return (
									<DropdownMenuCheckboxItem
										key={column.id}
										className="capitalize"
										checked={column.getIsVisible()}
										onCheckedChange={(value) =>
											column.toggleVisibility(!!value)
										}
									>
										{column.id}
									</DropdownMenuCheckboxItem>
								);
							})}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="overflow-hidden rounded-lg border">
				<Table>
					<TableHeader className="sticky top-0 z-10 bg-muted">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									className={
										CellViewerContent ? "cursor-pointer hover:bg-muted/50" : ""
									}
									onClick={
										CellViewerContent
											? () => setSelectedRow(row.original)
											: undefined
									}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={allColumns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-between py-4 space-x-2">
				<div className="flex-1 text-sm text-muted-foreground">
					{table.getFilteredSelectedRowModel().rows.length} of{" "}
					{table.getFilteredRowModel().rows.length} row(s) selected.
				</div>
				<div className="flex w-full items-center gap-8 lg:w-fit">
					<div className="hidden items-center gap-2 lg:flex">
						<Label htmlFor="rows-per-page" className="text-sm font-medium">
							Rows per page
						</Label>
						<Select
							value={`${table.getState().pagination.pageSize}`}
							onValueChange={(value) => {
								table.setPageSize(Number(value));
							}}
						>
							<SelectTrigger className="w-20" id="rows-per-page">
								<SelectValue
									placeholder={table.getState().pagination.pageSize}
								/>
							</SelectTrigger>
							<SelectContent side="top">
								{[10, 20, 30, 40, 50].map((pageSize) => (
									<SelectItem key={pageSize} value={`${pageSize}`}>
										{pageSize}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex w-fit items-center justify-center text-sm font-medium">
						Page {table.getState().pagination.pageIndex + 1} of{" "}
						{table.getPageCount()}
					</div>
					<div className="ml-auto flex items-center gap-2 lg:ml-0">
						<Button
							variant="outline"
							className="hidden h-8 w-8 p-0 lg:flex"
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}
						>
							<span className="sr-only">Go to first page</span>
							<ChevronsLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							className="h-8 w-8 p-0"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							<span className="sr-only">Go to previous page</span>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							className="h-8 w-8 p-0"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							<span className="sr-only">Go to next page</span>
							<ChevronRight className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							className="hidden h-8 w-8 p-0 lg:flex"
							onClick={() => table.setPageIndex(table.getPageCount() - 1)}
							disabled={!table.getCanNextPage()}
						>
							<span className="sr-only">Go to last page</span>
							<ChevronsRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>

			{/* Add the RowDetailSheet outside the table */}
			{CellViewerContent && selectedRow && (
				<Sheet
					open={!!selectedRow}
					onOpenChange={(open) => !open && setSelectedRow(null)}
				>
					<SheetContent side="right" className="flex flex-col">
						<CellViewerContent item={selectedRow} />
					</SheetContent>
				</Sheet>
			)}
		</div>
	);
}

interface RowDetailSheetProps<TData> {
	item: TData;
	content: React.ComponentType<{ item: TData }>;
}

function RowDetailSheet<TData>({
	item,
	content: Content,
}: RowDetailSheetProps<TData>) {
	return (
		<Sheet>
			<SheetContent side="right" className="flex flex-col">
				<Content item={item} />
			</SheetContent>
		</Sheet>
	);
}
