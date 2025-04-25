import { ChatOpenAI } from "@langchain/openai";

export const textCommand = async (
  prompt: string,
  options: {
    key: string;
    model?: string;
    temperature?: number;
    baseUrl?: string;
    systemPrompt?: string;
  }
): Promise<string> => {
  const { key, temperature = 0, baseUrl } = options;
  let { model = "gpt-4o" } = options;

  const chatModel = new ChatOpenAI({
    openAIApiKey: key,
    modelName: model,
    temperature,
    configuration: {
      baseURL: baseUrl,
    },
    cache: false,
    verbose: true,
    maxRetries: 1,
  });

  const response = await chatModel.invoke(prompt);

  return response.text;
};
