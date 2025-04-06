import { createFileRoute } from '@tanstack/react-router'
import { PriceChart } from './-components/price-chart'

const DashboardPage = () => {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <p className="text-muted-foreground">Dashboard</p>
      <PriceChart companyId="AAPL" />
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/_app/dashboard/')({
  component: DashboardPage,
})
