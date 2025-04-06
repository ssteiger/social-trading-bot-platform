import { Badge } from '~/lib/components/ui/badge'
import { Button } from '~/lib/components/ui/button'
import { Input } from '~/lib/components/ui/input'
import { Label } from '~/lib/components/ui/label'
import { postgres_db, schema } from '@social-trading-bot-platform/db-drizzle'
import type { Order } from '@social-trading-bot-platform/db-drizzle'
import { count, sql } from '@social-trading-bot-platform/db-drizzle/src/drizzle-kit'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/lib/components/ui/select'
import { Separator } from '~/lib/components/ui/separator'
import {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '~/lib/components/ui/sheet'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef, Table, Column } from '@tanstack/react-table'
import { CheckCircle2Icon, LoaderIcon, X, Check, PlusCircle } from 'lucide-react'
import { createServerFn } from '@tanstack/react-start'
import { createFileRoute } from '@tanstack/react-router'
import { DataTable } from './-components/data-table'
import { useState } from 'react'
import { z } from 'zod'
import { DataTableViewOptions } from "./-components/data-table-view-options"
import { cn } from "~/lib/utils/cn"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/lib/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/lib/components/ui/popover"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import type { SQL } from '@social-trading-bot-platform/db-drizzle/src/drizzle-kit'

/*
CREATE TABLE IF NOT EXISTS "order" (
	"order_id" serial PRIMARY KEY NOT NULL,
	"bot_id" integer NOT NULL,
	"company_id" varchar(10) NOT NULL,
	"order_type" text NOT NULL,
	"is_buy" boolean NOT NULL,
	"price_in_cents" bigint NOT NULL,
	"quantity" bigint NOT NULL,
	"quantity_filled" bigint DEFAULT 0 NOT NULL,
	"quantity_open" bigint GENERATED ALWAYS AS ((quantity - quantity_filled)) STORED,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"last_updated_at" timestamp DEFAULT now() NOT NULL
);
*/

// DataTableFacetedFilter component moved from the separate file
interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options: {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
  onSelect?: (value: string) => void
}

function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  onSelect,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues?.();
  const selectedValues = new Set(column?.getFilterValue() as string[]);

  // Use options count if facets are not available
  const getCount = (value: string) => {
    if (facets?.get(value)) {
      return facets.get(value);
    }
    // Find the option and return its count if available
    const option = options.find(opt => opt.value === value);
    return option && 'count' in option ? (option as { count: number }).count : 0;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value);
                      } else {
                        selectedValues.add(option.value);
                      }
                      const filterValues = Array.from(selectedValues);
                      column?.setFilterValue(
                        filterValues.length ? filterValues : undefined
                      );

                      if (onSelect) {
                        onSelect(option.value);
                      }
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check />
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                    <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                      {getCount(option.value)}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// DataTablePagination component moved from the separate file
interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={`${table.getState().pagination.pageSize}`} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50, 100, 200, 500].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Fix the PaginationParamsSchema type definition
// Remove the type that's defined but never used
type PaginationParams = {
  pageIndex: number;
  pageSize: number;
};

// Update the server function to fix SQL type compatibility issues and add sorting
const serverFn = createServerFn({ method: 'GET' })
  .validator(z.object({
    pageIndex: z.number().default(0),
    pageSize: z.number().default(10),
    order_id: z.string().optional(),
    status: z.string().optional(),
    sortBy: z.string().optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
  }))
  .handler(async ({ data }) => {
    console.log(' -------------------- in server fn -------------------- ')
    const { pageIndex, pageSize, order_id, status, sortBy, sortDirection } = data
    console.log({ data })
    
    // Start building the query
    const query = postgres_db.select().from(schema.order);
    const countQuery = postgres_db.select({ count: count() }).from(schema.order);
    
    // Create a conditions array to store filter conditions
    const conditions: SQL<unknown>[] = [];
    
    // Apply filters if they exist
    if (order_id) {
      // Use sql`` template to ensure SQL type compatibility
      conditions.push(sql`${schema.order.order_id}::text LIKE ${`%${order_id}%`}`);
    }
    
    if (status) {
      // Use sql`` template to ensure SQL type compatibility
      conditions.push(sql`${schema.order.status} = ${status}`);
    }
    
    // Apply conditions to the query if any exist
    let filteredQuery = query;
    let filteredCountQuery = countQuery;
    
    if (conditions.length > 0) {
      conditions.forEach(condition => {
        filteredQuery = filteredQuery.where(condition);
        filteredCountQuery = filteredCountQuery.where(condition);
      });
    }
    
    // Apply sorting if specified
    if (sortBy) {
      const orderColumn = schema.order[sortBy as keyof typeof schema.order];
      if (orderColumn) {
        if (sortDirection === 'asc') {
          filteredQuery = filteredQuery.orderBy(sql`${orderColumn} ASC`);
        } else {
          filteredQuery = filteredQuery.orderBy(sql`${orderColumn} DESC`);
        }
      }
    } else {
      // Default sorting by created_at desc
      filteredQuery = filteredQuery.orderBy(sql`${schema.order.created_at} DESC`);
    }
    
    const countResult = await filteredCountQuery;
    const totalCount = countResult[0].count;
    
    // Get paginated and filtered orders
    const orders = await filteredQuery
      .limit(pageSize)
      .offset(pageIndex * pageSize);
    
    // Get status counts for faceted filter
    const statusCounts = await postgres_db
      .select({
        status: schema.order.status,
        count: count(),
      })
      .from(schema.order)
      .groupBy(schema.order.status);
    
    // Convert to a Map for easier lookup in the component
    const statusCountMap = new Map(
      statusCounts.map(item => [item.status, item.count])
    );

    const pageCount = Math.ceil(totalCount / pageSize);
      
    console.log({ totalCount, pageCount, statusCounts: Object.fromEntries(statusCountMap) });
    return {
      orders,
      pageCount,
      statusCounts: Object.fromEntries(statusCountMap)
    }
  })

const statuses = [
  {
    value: "active",
    label: "Active",
    icon: LoaderIcon,
  },
  {
    value: "cancelled",
    label: "Cancelled",
    icon: CheckCircle2Icon,
  },
  {
    value: "expired",
    label: "Expired",
    icon: LoaderIcon,
  },
  {
    value: "filled",
    label: "Filled",
    icon: CheckCircle2Icon,
  },
  {
    value: "partially_filled",
    label: "Partially Filled",
    icon: CheckCircle2Icon,
  },
  {
    value: "pending",
    label: "Pending",
    icon: LoaderIcon,
  },
]

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: 'order_id',
    header: 'Order ID',
    enableSorting: true,
  },
  {
    accessorKey: 'company_id',
    header: 'Company Ticker',
    filterFn: "includesString",
    enableSorting: true,
  },
  {
    accessorKey: 'order_type',
    header: 'Order Type',
    filterFn: "equalsString",
    enableSorting: true,
  },
  {
    accessorKey: 'is_buy',
    header: 'Direction',
    cell: ({ row }) => (row.getValue('is_buy') ? 'Buy' : 'Sell'),
    filterFn: "equals",
    enableSorting: true,
  },
  {
    accessorKey: 'price_in_cents',
    header: 'Price',
    cell: ({ row }) => {
      const priceInCents = row.getValue('price_in_cents') as number
      return `$${(priceInCents / 100).toFixed(2)}`
    },
    enableSorting: true,
  },
  {
    accessorKey: 'quantity',
    header: 'Quantity',
    enableSorting: true,
  },
  {
    accessorKey: 'quantity_filled',
    header: 'Filled',
    enableSorting: true,
  },
  {
    accessorKey: 'quantity_open',
    header: 'Open',
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: "equalsString",
    enableSorting: true,
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge variant="outline" className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3">
          {status === 'filled' ? (
            <CheckCircle2Icon className="text-green-500 dark:text-green-400" />
          ) : (
            <LoaderIcon />
          )}
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at') as string)
      return date.toLocaleString()
    },
    enableSorting: true,
  },
  {
    accessorKey: 'expires_at',
    header: 'Expires',
    cell: ({ row }) => {
      const date = row.getValue('expires_at') as string
      return date ? new Date(date).toLocaleString() : 'N/A'
    },
    enableSorting: true,
  },
]
interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onFilterChange: (column: string, value: string) => void
  statusCounts?: Record<string, number>
}

function DataTableToolbar<TData>({
  table,
  onFilterChange,
  statusCounts = {},
}: DataTableToolbarProps<TData>) {
  console.log('in DataTableToolbar', { statusCounts });
  const isFiltered = table.getState().columnFilters.length > 0;

  // Update statuses with counts
  const statusesWithCounts = statuses.map(status => ({
    ...status,
    count: statusCounts[status.value] || 0
  }));

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter by order ID..."
          value={(table.getColumn("order_id")?.getFilterValue() as string) ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            table.getColumn("order_id")?.setFilterValue(value);
            onFilterChange("order_id", value);
          }}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statusesWithCounts}
            onSelect={(value) => onFilterChange("status", value)}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              // Reset server-side filters
              onFilterChange("reset", "");
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}

const OrderBookPage = () => {
  // Add state for pagination
  const [pagination, setPagination] = useState<PaginationParams>({
    pageIndex: 0,
    pageSize: 10,
  })
  
  // Add state for filters
  const [filters, setFilters] = useState({
    order_id: "",
    status: "",
  });
  
  // Add state for sorting
  const [sorting, setSorting] = useState<{
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }>({
    sortBy: 'created_at',
    sortDirection: 'desc',
  });
  
  // Create a function to handle filter changes
  const handleFilterChange = (column: string, value: string) => {
    if (column === "reset") {
      setFilters({
        order_id: "",
        status: "",
      });
    } else {
      setFilters(prev => ({
        ...prev,
        [column]: value
      }));
    }
  };
  
  // Update the query to use pagination, filters, and sorting
  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['orders', pagination, filters, sorting],
    queryFn: () => serverFn({data: {...pagination, ...filters, ...sorting}}),
  })
  
  // Extract orders, pageCount, and statusCounts from the response
  const orders = data?.orders || []
  const pageCount = data?.pageCount || 0
  const statusCounts = data?.statusCounts || {}

  const renderToolbar = (table: Table<Order>) => (
    <DataTableToolbar 
      table={table} 
      onFilterChange={handleFilterChange} 
      statusCounts={statusCounts}
    />
  )

  const rowViewerContent = (item: Order) => (
    <SheetContent side="right" className="flex flex-col">
      <SheetHeader className="gap-1">
        <SheetTitle>Order #{item.order_id}</SheetTitle>
        <SheetDescription>
          {item.is_buy ? 'Buy' : 'Sell'} order for {item.company_id}
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm">
        <div className="grid gap-2 px-4">
          <div className="flex gap-2 font-medium leading-none">
            Order Status: {item.status}
            {item.status === 'filled' ? (
              <CheckCircle2Icon className="size-4 text-green-500" />
            ) : (
              <LoaderIcon className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            {item.quantity_filled} of {item.quantity} shares filled (
            {((item.quantity_filled / item.quantity) * 100).toFixed(1)}%)
          </div>
        </div>
        <Separator />
        <form className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="company_id">Company Ticker</Label>
            <Input id="company_id" defaultValue={item.company_id} readOnly />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="order_type">Order Type</Label>
              <Select defaultValue={item.order_type}>
                <SelectTrigger id="order_type" className="w-full">
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                  <SelectItem value="stop">Stop</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="direction">Direction</Label>
              <Select defaultValue={item.is_buy ? 'buy' : 'sell'}>
                <SelectTrigger id="direction" className="w-full">
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="price">Price</Label>
              <Input id="price" defaultValue={(item.price_in_cents / 100).toFixed(2)} />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" defaultValue={item.quantity} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="status">Status</Label>
            <Select defaultValue={item.status}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
      </div>
      <SheetFooter className="mt-auto flex gap-2 sm:flex-col sm:space-x-0">
        <Button className="w-full">Update Order</Button>
        <SheetClose asChild>
          <Button variant="outline" className="w-full">
            Close
          </Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  )

  // Remove the unused tableRef state
  const renderPagination = (table: Table<Order>) => (
    <DataTablePagination table={table} />
  )

  return (
    <div className="flex-1">
      <p className="text-muted-foreground">Order Book</p>
      <DataTable<Order, unknown>
        data={orders}
        columns={columns}
        isLoading={isLoading}
        refetch={refetch}
        rowViewerContent={rowViewerContent}
        renderToolbar={renderToolbar}
        renderPagination={renderPagination}
        pagination={pagination}
        setPagination={setPagination}
        pageCount={pageCount}
      />
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/_app/order-book/')({
  component: OrderBookPage,
})
