import { textCommand } from "./text.command";

export const summarizeTopicCommand = async (
  text: string,
  options: {
    key: string;
    model?: string;
    temperature?: number;
    baseUrl?: string;
  }
): Promise<string> => {
  if (!text) throw new Error("Text is required");

  const formattedText = text.replace(/\{/g, "{{").replace(/\}/g, "}}");

  return textCommand(
    [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: formattedText,
      },
    ],
    options
  );
};

const SYSTEM_PROMPT =
  "Please generate a four to five words title summarizing our conversation without any lead-in, punctuation, quotation marks, periods, symbols, bold text, or additional text. Remove enclosing quotation marks. Please use the main language of the text.";
