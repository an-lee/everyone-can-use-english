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
  FormLabel,
  FormControl,
  FormMessage,
} from "@renderer/components/ui";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

export function SpeechForm() {
  const { t } = useTranslation("components/speeches");
  const {
    ttsConfig,
    ttsProviders,
    openai: openaiSettings,
  } = useSettingsStore();

  const ttsFormSchema = z.object({
    text: z.string().min(1),
    engine: z.enum(["enjoyai", "openai"]),
    model: z.string(),
    voice: z.string(),
  });

  const form = useForm<z.infer<typeof ttsFormSchema>>({
    resolver: zodResolver(ttsFormSchema),
    defaultValues: {
      text: "",
      engine: (ttsConfig.engine as "enjoyai" | "openai") || "enjoyai",
      model: ttsConfig.model || "azure/speech",
      voice: ttsConfig.voice || "en-US-AvaNeural",
    },
  });

  const handleSubmit = (data: z.infer<typeof ttsFormSchema>) => {
    console.log(data);
  };

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
                  className="min-h-32"
                  placeholder={t("speechFormPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FormField
              control={form.control}
              name="engine"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ttsProviders[form.watch("engine")].models.map(
                          (model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          )
                        )}
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ttsProviders[form.watch("engine")].voices.map(
                          (voice) => (
                            <SelectItem key={voice.value} value={voice.value}>
                              {voice.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" className="size-8 rounded-full">
              <Icon icon="tabler:play" />
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
