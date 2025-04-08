import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/documents/$documentId")({
  component: DocumentComponent,
});

function DocumentComponent() {
  const { documentId } = Route.useParams();

  return <div>Hello "/documents/{documentId}"!</div>;
}
