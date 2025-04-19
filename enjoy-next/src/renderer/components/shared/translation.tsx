import { useTranslation } from "react-i18next";
import { cn } from "@renderer/lib/utils";

export function Translation(props: { content: string; className?: string }) {
  const { t } = useTranslation();
  const { content, className } = props;
  return (
    <div className={cn("pl-3 border-l-4 border-primary/30 text-sm", className)}>
      <div className="font-medium">{content}</div>
    </div>
  );
}
