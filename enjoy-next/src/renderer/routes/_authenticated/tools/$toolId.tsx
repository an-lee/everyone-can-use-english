import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/tools/$toolId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/tools/$toolId"!</div>
}
