import { ChatOpenAI } from "@langchain/openai";
import { BaseMessageLike } from "@langchain/core/messages";

export const textCommand = async (
  prompt: string | BaseMessageLike[],
  options: {
    key: string;
    model?: string;
    temperature?: number;
    baseUrl?: string;
    cache?: boolean;
    maxRetries?: number;
  }
): Promise<string> => {
  const {
    key,
    temperature = 0,
    baseUrl,
    cache = false,
    maxRetries = 1,
    model = "gpt-4o",
  } = options;

  const chatModel = new ChatOpenAI({
    openAIApiKey: key,
    model,
    temperature,
    configuration: {
      baseURL: baseUrl,
    },
    cache,
    verbose: true,
    maxRetries,
  });

  const response = await chatModel.invoke(prompt);

  return response.text;
};
