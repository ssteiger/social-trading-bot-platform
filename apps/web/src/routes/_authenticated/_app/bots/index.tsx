import { DataTable } from '~/lib/components/ui/data-table'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { and, eq, postgres_db, schema, count } from '@social-trading-bot-platform/db-drizzle'
import type { PaginationState, SortingState } from '@tanstack/react-table'
import { useState } from 'react'
import { asc, desc, ilike, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod'

export function getOrderByClause<T>(
  table: any,
  orderBy: Array<{ id: string; desc: boolean }>,
  nullsLast = true,
) {
  return orderBy.map((o) =>
    o.desc
      ? sql`${desc(table[o.id as keyof T])} ${nullsLast ? sql.raw('nulls last') : ''}`
      : sql`${asc(table[o.id as keyof T])} ${nullsLast ? sql.raw('nulls last') : ''}`,
  )
}

export const tableQuerySchema = z.object({
  limit: z.number(),
  offset: z.number(),
  order_by: z.array(z.object({ id: z.string(), desc: z.boolean() })),
  search: z.string(),
})

/*
CREATE TABLE bot (
  bot_id SERIAL PRIMARY KEY,
  bot_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMP NOT NULL DEFAULT NOW(),
  background_story TEXT,
  bot_character_description TEXT,
  money_balance_in_cents BIGINT NOT NULL DEFAULT 1000000000 -- Default 10 million dollars (1 billion cents)
);
*/

const getBots = createServerFn({ method: 'GET' })
  .validator(tableQuerySchema)
  .handler(async ({ data }) => {
    const { limit, offset, order_by, search } = data
    const filters: SQL[] = []

    if (search) {
      filters.push(ilike(schema.bot.bot_name, `%${search}%`))
    }

    const bots = await postgres_db
      .select()
      .from(schema.bot)
      .where(and(...filters))
      .limit(limit)
      .offset(offset)
      .orderBy(...getOrderByClause(schema.bot, order_by))

    return bots
  })

const getBotsCount = createServerFn({ method: 'GET' })
  .validator(z.object({ search: z.string() }))
  .handler(async ({ data }) => {
    const { search } = data
    const filters: SQL[] = []

    if (search) {
      filters.push(ilike(schema.bot.bot_name, `%${search}%`))
    }

    const bots = await postgres_db.select({ count: count() }).from(schema.bot)

    console.log({ bots })

    return { count: bots[0].count }
  })

const BotsPage = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })
  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bots', pagination, search, sorting],
    queryFn: () =>
      getBots({
        data: {
          limit: pagination.pageSize,
          offset: pagination.pageIndex * pagination.pageSize,
          search,
          order_by: sorting,
        },
      }),
    placeholderData: keepPreviousData,
  })

  const { data: countData } = useQuery({
    queryKey: ['bots', 'count', search],
    queryFn: () =>
      getBotsCount({
        data: {
          search,
        },
      }),
  })

  console.log({ countData })

  return (
    <div className="flex-1">
      <p className="text-muted-foreground">Registered Bots</p>
      <DataTable
        data={data ? [...data] : []}
        isLoading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        search={search}
        onSearch={setSearch}
        sorting={sorting}
        onSortingChange={setSorting}
        rowCount={countData?.count || 0}
        columns={[
          {
            accessorKey: 'bot_id',
            header: 'Bot ID',
          },
          {
            accessorKey: 'bot_name',
            header: 'Bot Name',
          },
          {
            accessorKey: 'created_at',
            header: 'Created At',
            cell: ({ row }) => {
              const date = new Date(row.getValue('created_at'))
              return date.toLocaleDateString()
            },
          },
          {
            accessorKey: 'last_active_at',
            header: 'Last Active',
            cell: ({ row }) => {
              const date = new Date(row.getValue('last_active_at'))
              return date.toLocaleDateString()
            },
          },
          {
            accessorKey: 'money_balance_in_cents',
            header: 'Balance ($)',
            cell: ({ row }) => {
              // Convert cents to dollars and format as currency
              const balanceInCents = row.getValue('money_balance_in_cents') as number
              const balanceInDollars = balanceInCents / 100
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(balanceInDollars)
            },
          },
        ]}
        refetch={refetch}
        emptyState={{
          title: 'No bots found',
          subtitle: 'Create a new bot to get started',
        }}
      />
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/_app/bots/')({
  component: BotsPage,
})
