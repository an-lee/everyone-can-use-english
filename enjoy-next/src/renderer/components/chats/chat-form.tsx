import { Textarea } from "@renderer/components/ui/textarea";
import { Button } from "../ui/button";
import { Icon } from "@iconify/react";

export function ChatForm() {
  return (
    <div className="px-4 py-2 rounded-lg border bg-background shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <textarea
          className="w-full border-0 shadow-none focus-visible:ring-0 focus-visible:outline-0 px-2 py-1"
          rows={2}
          placeholder="Message"
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button variant="default" size="icon" className="rounded-full">
          <Icon icon="tabler:send" className="size-5" />
        </Button>
      </div>
    </div>
  );
}
