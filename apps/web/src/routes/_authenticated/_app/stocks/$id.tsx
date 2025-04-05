import { createFileRoute } from '@tanstack/react-router'

const StockPage = () => {
  return <div>Hello "/_authenticated/_app/stocks/$id"!</div>
}

export const Route = createFileRoute('/_authenticated/_app/stocks/$id')({
  component: StockPage,
})
