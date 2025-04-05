import { createFileRoute } from '@tanstack/react-router'

const StocksPage = () => {
  return <div>Hello "/_authenticated/_app/stocks/"!</div>
}

export const Route = createFileRoute('/_authenticated/_app/stocks/')({
  component: StocksPage,
})