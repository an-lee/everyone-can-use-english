import { Speeches } from "../speeches";
import { TextToSpeechForm } from "./text-to-speech-form";
import { useTranslation } from "react-i18next";

export function TTSPage() {
  const { t } = useTranslation("components/tools");

  return (
    <div className="max-w-screen-md mx-auto p-4">
      <div className="mb-4">
        <TextToSpeechForm />
      </div>
      <div className="mb-4">
        <Speeches />
      </div>
    </div>
  );
}
