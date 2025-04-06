import { Badge } from '~/lib/components/ui/badge'
import { postgres_db, schema } from '@social-trading-bot-platform/db-drizzle'
import { DataTable } from '~/lib/components/ui/data-table'
import type { Exchange } from '@social-trading-bot-platform/db-drizzle'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

/*
CREATE TABLE IF NOT EXISTS "exchange" (
	"exchange_id" varchar(10) PRIMARY KEY NOT NULL,
	"exchange_name" varchar(100) NOT NULL,
	"exchange_code" varchar(10) NOT NULL,
	"trading_fee_percent" numeric(5, 2) DEFAULT '0.1' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exchange_exchange_code_key" UNIQUE("exchange_code"),
	CONSTRAINT "exchange_id_equals_code" CHECK ((exchange_id)::text = (exchange_code)::text)
);
*/

const serverFn = createServerFn({ method: 'GET' })
  //.validator()
  .handler(async () => {
    const exchanges = await postgres_db.select().from(schema.exchange)

    console.log({ exchanges })

    return exchanges
  })

// Define the columns with proper typing
const columns: ColumnDef<Exchange>[] = [
  {
    accessorKey: 'exchange_name',
    header: 'Exchange Name',
  },
  {
    accessorKey: 'exchange_code',
    header: 'Code',
  },
  {
    accessorKey: 'trading_fee_percent',
    header: 'Trading Fee (%)',
    cell: ({ row }) => {
      const fee = Number.parseFloat(row.getValue('trading_fee_percent'))
      return <div>{fee.toFixed(2)}%</div>
    },
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('is_active')
      return (
        <Badge variant={isActive ? 'default' : 'destructive'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created At',
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'))
      return <div>{format(date, 'PPP')}</div>
    },
  },
]

const ExchangePage = () => {
  const {
    data: exchanges = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['exchanges'],
    queryFn: () => serverFn(),
  })

  console.log({ exchanges })

  return (
    <div className="flex-1">
      <p className="text-muted-foreground">Available Exchanges</p>
      <DataTable data={exchanges} columns={columns} isLoading={isLoading} refetch={refetch} />
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/_app/exchanges/')({
  component: ExchangePage,
})
