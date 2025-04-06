import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type Table,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/lib/components/ui/table"
import { Skeleton } from "~/lib/components/ui/skeleton"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  refetch?: () => void
  rowViewerContent?: (item: TData) => React.ReactNode
  renderToolbar?: (table: Table<TData>) => React.ReactNode
  renderPagination?: (table: Table<TData>) => React.ReactNode
  pagination?: {
    pageIndex: number
    pageSize: number
  }
  setPagination?: (pagination: { pageIndex: number; pageSize: number }) => void
  pageCount?: number
  onTableCreated?: (table: Table<TData>) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  refetch,
  rowViewerContent,
  renderToolbar,
  renderPagination,
  pagination,
  setPagination,
  pageCount = 0,
  onTableCreated,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  
  // Use local state if external pagination is not provided
  const [localPagination, setLocalPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  
  // Determine if we're using controlled pagination
  const isPaginationControlled = !!setPagination
  
  // Use either controlled or uncontrolled pagination
  const paginationState = isPaginationControlled 
    ? pagination 
    : localPagination
  
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: paginationState,
    },
    pageCount: isPaginationControlled ? pageCount : undefined,
    enableRowSelection: true,
    manualPagination: isPaginationControlled,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: isPaginationControlled 
      ? (updaterOrValue) => {
          // Fix type compatibility issue by handling both function and direct value
          if (typeof updaterOrValue === 'function') {
            const updater = updaterOrValue;
            setPagination?.(updater(paginationState));
          } else {
            setPagination?.(updaterOrValue);
          }
        }
      : setLocalPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  React.useEffect(() => {
    if (onTableCreated && table) {
      onTableCreated(table);
    }
  }, [table, onTableCreated]);

  return (
    <div className="space-y-4">
      {renderToolbar?.(table)}
      <div className="rounded-md border">
        <UITable>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Using unique keys instead of array indices
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`loading-row-${i}`}>
                  {Array.from({ length: columns.length }).map((_, j) => (
                    <TableCell key={`loading-cell-${i}-${j}`}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => rowViewerContent?.(row.original)}
                  className={rowViewerContent ? "cursor-pointer" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </UITable>
      </div>
      {renderPagination?.(table)}
    </div>
  )
}
