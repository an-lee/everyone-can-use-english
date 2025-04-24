import { SpeechesList, SpeechForm } from "@renderer/components/speeches";
import { useTranslation } from "react-i18next";

export function SpeechesPage() {
  const { t } = useTranslation("components/speeches");

  return (
    <div className="p-4 bg-muted/50 min-h-content">
      <div className="max-w-screen-md mx-auto">
        <div className="mb-4">
          <SpeechForm />
        </div>
        <div className="mb-4">
          <SpeechesList />
        </div>
      </div>
    </div>
  );
}
