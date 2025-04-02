import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-2 bg-red-500">
      <h3>Welcome Home!</h3>
    </div>
  );
}
