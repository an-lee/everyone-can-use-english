import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/tools/translate')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/tools/translate"!</div>
}
