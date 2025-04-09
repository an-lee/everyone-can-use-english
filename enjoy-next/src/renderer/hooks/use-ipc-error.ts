import { useEffect } from "react";
import { toast } from "sonner";

export const useIpcError = () => {
  const handleError = (error: any) => {
    console.error("IPC error:", error);
    toast.error(error.message);
  };

  useEffect(() => {
    window.EnjoyAPI.events.on("ipc:onError", handleError);

    return () => {
      window.EnjoyAPI.events.off("ipc:onError", handleError);
    };
  }, []);
};
