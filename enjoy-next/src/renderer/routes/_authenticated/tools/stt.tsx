import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/tools/stt')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/tools/stt"!</div>
}
