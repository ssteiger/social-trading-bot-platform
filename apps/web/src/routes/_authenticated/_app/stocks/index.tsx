import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/_app/stocks/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/_app/stocks/"!</div>
}
