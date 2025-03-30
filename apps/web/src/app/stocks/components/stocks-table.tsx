"use client";

import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	type ColumnDef,
	type SortingState,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import {
	ArrowUpDown,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Company {
	company_id: number;
	company_name: string;
	ticker_symbol: string;
	total_shares: number;
	created_at: string;
	exchanges: {
		exchange_name: string;
		exchange_code: string;
	};
	creator: {
		bot_name: string;
	};
}

export function StocksTable({ data }: { data: Company[] }) {
	const [sorting, setSorting] = useState<SortingState>([]);

	const columns: ColumnDef<Company>[] = [
		{
			accessorKey: "ticker_symbol",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Symbol
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div className="font-medium">
					<Link
						href={`/stocks/${row.original.company_id}`}
						className="hover:underline"
					>
						{row.original.ticker_symbol}
					</Link>
				</div>
			),
		},
		{
			accessorKey: "company_name",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Company Name
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div className="font-medium">{row.getValue("company_name")}</div>
			),
		},
		{
			accessorKey: "exchanges.exchange_code",
			header: "Exchange",
			cell: ({ row }) => <div>{row.original.exchanges.exchange_code}</div>,
		},
		{
			accessorKey: "total_shares",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Total Shares
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div>{row.original.total_shares.toLocaleString()}</div>
			),
		},
		{
			accessorKey: "creator.bot_name",
			header: "Creator",
			cell: ({ row }) => <div>{row.original.creator.bot_name}</div>,
		},
		{
			accessorKey: "created_at",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Created
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div>
					{formatDistanceToNow(new Date(row.original.created_at), {
						addSuffix: true,
					})}
				</div>
			),
		},
		{
			id: "actions",
			cell: ({ row }) => (
				<Button size="sm" variant="outline" asChild>
					<Link href={`/stocks/${row.original.company_id}`}>View</Link>
				</Button>
			),
		},
	];

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		state: {
			sorting,
		},
	});

	return (
		<div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
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
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No stocks found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-end space-x-2 py-4">
				<Button
					variant="outline"
					size="sm"
					onClick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
				>
					<ChevronLeft className="h-4 w-4" />
					Previous
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
				>
					Next
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
