import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/tools/tts')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/tools/tts"!</div>
}
