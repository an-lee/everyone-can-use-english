import { useSettingsStore } from "@/renderer/store";
import { Icon } from "@iconify/react";
import {
  Button,
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
  Textarea,
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@renderer/components/ui";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LEARNING_LANGUAGES } from "@/shared/constants";
import { useCreateSpeechMutation } from "@/renderer/hooks";
import { useEffect } from "react";
import { toast } from "sonner";

export function SpeechForm() {
  const { t } = useTranslation("components/speeches");
  const {
    ttsConfig,
    ttsProviders,
    openai: openaiSettings,
  } = useSettingsStore();
  const {
    mutate: createSpeech,
    isPending,
    error,
    data,
  } = useCreateSpeechMutation();

  const ttsFormSchema = z.object({
    text: z.string().min(1, { message: t("youHaveNotInputTextYet") }),
    engine: z.enum(["enjoyai", "openai"]),
    model: z.string(),
    language: z.string(),
    voice: z.string(),
  });

  const form = useForm<z.infer<typeof ttsFormSchema>>({
    resolver: zodResolver(ttsFormSchema),
    defaultValues: {
      text: "",
      engine: (ttsConfig.engine as "enjoyai" | "openai") || "enjoyai",
      model: ttsConfig.model || "azure/speech",
      language: ttsConfig.language || "en-US",
      voice: ttsConfig.voice || "en-US-AvaNeural",
    },
  });

  const modelOptions = ttsProviders[form.watch("engine")].models;
  const voiceOptions = ttsProviders[form.watch("engine")].voices.filter(
    (voice) =>
      (voice.language === form.watch("language") || !voice.language) &&
      (voice.provider === form.watch("engine") ||
        form.watch("model").startsWith(voice.provider))
  );

  const validate = (data: z.infer<typeof ttsFormSchema>) => {
    if (!Object.keys(ttsProviders).includes(data.engine)) {
      form.setError("engine", {
        message: t("invalidTtsEngine"),
      });
      return false;
    }
    if (!modelOptions.includes(data.model)) {
      form.setError("model", {
        message: t("invalidTtsModel"),
      });
      return false;
    }
    if (!voiceOptions.some((voice) => voice.value === data.voice)) {
      form.setError("voice", {
        message: t("invalidTtsVoice"),
      });
      return false;
    }
    return true;
  };

  const handleSubmit = (data: z.infer<typeof ttsFormSchema>) => {
    if (!validate(data)) {
      return;
    }
    const { text, ...configuration } = data;
    createSpeech({
      text,
      configuration,
    });
  };

  useEffect(() => {
    if (data) {
      form.reset();
      toast.success(t("speechCreatedSuccessfully"));
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-2"
      >
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  className="min-h-32 focus-visible:bg-background"
                  placeholder={t("speechFormPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-start gap-2">
            <FormField
              control={form.control}
              name="engine"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectTtsEngine")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enjoyai">Enjoy AI</SelectItem>
                        <SelectItem
                          disabled={!openaiSettings.key}
                          value="openai"
                        >
                          Open AI
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectTtsModel")} />
                      </SelectTrigger>
                      <SelectContent>
                        {modelOptions.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectTtsLanguage")} />
                      </SelectTrigger>
                      <SelectContent>
                        {LEARNING_LANGUAGES.map((language) => (
                          <SelectItem key={language.code} value={language.code}>
                            {language.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="voice"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectTtsVoice")} />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {voiceOptions.map((voice) => (
                          <SelectItem key={voice.value} value={voice.value}>
                            {voice.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              className="size-8 rounded-full"
              disabled={isPending}
            >
              {isPending ? (
                <Icon icon="tabler:loader" className="animate-spin" />
              ) : (
                <Icon icon="tabler:play" />
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
