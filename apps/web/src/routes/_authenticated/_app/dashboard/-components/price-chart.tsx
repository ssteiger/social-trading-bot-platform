import { ArrowDownIcon, ArrowUpIcon } from '@radix-ui/react-icons'
import type { PriceHistory } from '@social-trading-bot-platform/db-drizzle'
import { useQuery } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { format } from 'date-fns'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Skeleton } from '~/lib/components/ui/skeleton'
import { postgres_db, schema } from '@social-trading-bot-platform/db-drizzle'

/*
CREATE TABLE IF NOT EXISTS "price_history" (
	"history_id" serial PRIMARY KEY NOT NULL,
	"company_id" varchar(10) NOT NULL,
	"exchange_id" varchar(10) NOT NULL,
	"open_price_in_cents" bigint NOT NULL,
	"close_price_in_cents" bigint NOT NULL,
	"high_price_in_cents" bigint NOT NULL,
	"low_price_in_cents" bigint NOT NULL,
	"volume" bigint NOT NULL,
	"timestamp" timestamp NOT NULL,
	"period_length" varchar(20) NOT NULL,
	CONSTRAINT "price_history_company_id_timestamp_period_length_key" UNIQUE("company_id","timestamp","period_length")
);
*/

const serverFn = createServerFn({ method: 'GET' })
  //.validator()
  .handler(async () => {
    const priceHistory = await postgres_db.select().from(schema.price_history)

    return priceHistory
  })

export function PriceChart({ companyId }: { companyId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['price-history'],
    queryFn: () => serverFn(),
  })

  const generateChartData = (data: PriceHistory[]) => {
    if (!data || data.length === 0) return []

    return data.map((item) => ({
      time: format(new Date(item.timestamp), 'MMM dd HH:mm'),
      price: item.close_price_in_cents / 100, // Convert cents to dollars/main currency unit
      open: item.open_price_in_cents / 100,
      high: item.high_price_in_cents / 100,
      low: item.low_price_in_cents / 100,
      volume: item.volume,
    }))
  }

  const chartData = data ? generateChartData(data) : []

  // Calculate price change and percentage
  const calculatePriceChange = () => {
    if (!chartData || chartData.length < 2) return { change: 0, percentage: 0 }

    const firstPrice = chartData[0].price
    const lastPrice = chartData[chartData.length - 1].price
    const change = lastPrice - firstPrice
    const percentage = (change / firstPrice) * 100

    return { change, percentage }
  }

  const { change, percentage } = calculatePriceChange()
  const isPositive = change >= 0

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="pb-2">
          <div />
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <div>
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="pb-2">
        <div className="flex justify-between items-center">
          <div />
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              ${chartData.length ? chartData[chartData.length - 1].price.toFixed(2) : '0.00'}
            </span>
            <div className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? <ArrowUpIcon className="mr-1" /> : <ArrowDownIcon className="mr-1" />}
              <span className="font-medium">
                {change.toFixed(2)} ({percentage.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
      <div>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isPositive ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgba(99, 102, 241, 0.8)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="rgba(99, 102, 241, 0.1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
              domain={['auto', 'auto']}
              tickFormatter={(value) => `${value}`}
            />
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-border)"
              opacity={0.4}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                padding: '10px',
              }}
              itemStyle={{
                color: 'var(--color-foreground)',
                padding: '4px 0',
              }}
              labelStyle={{
                color: 'var(--color-muted-foreground)',
                fontWeight: 'bold',
                marginBottom: '8px',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '5px',
              }}
              formatter={(value: any, name: any) => {
                if (name === 'price' || name === 'open' || name === 'high' || name === 'low') {
                  return [
                    `$${typeof value === 'number' ? value.toFixed(2) : value}`,
                    typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : name,
                  ]
                }
                return [
                  value,
                  typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : name,
                ]
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value: any) =>
                typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : value
              }
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="price"
              stroke={isPositive ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrice)"
              name="Price"
            />
            <Bar
              yAxisId="right"
              dataKey="volume"
              fill="url(#colorVolume)"
              name="Volume"
              barSize={20}
              opacity={0.8}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
