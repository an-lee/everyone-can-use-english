import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/tools/lookup')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/tools/lookup"!</div>
}
