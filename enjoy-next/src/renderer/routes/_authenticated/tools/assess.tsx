import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/tools/assess')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/tools/assess"!</div>
}
