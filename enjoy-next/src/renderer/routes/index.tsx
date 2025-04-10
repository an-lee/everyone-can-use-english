import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "../store";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const { isAuthenticated } = context as {
      isAuthenticated: boolean;
    };
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: Index,
});
function Index() {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate({ to: "/dashboard" });
    } else {
      navigate({ to: "/login" });
    }
  }, [currentUser]);

  return (
    <div className="flex h-[100svh] w-screen flex-col items-center justify-center gap-4">
      <img src="./assets/icon.png" alt="Enjoy" className="size-16" />
      <h3>Welcome Home!</h3>
    </div>
  );
}
