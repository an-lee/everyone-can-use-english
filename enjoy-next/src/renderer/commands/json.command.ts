import { ChatOpenAI } from "@langchain/openai";
import { zodToJsonSchema } from "zod-to-json-schema";

export const jsonCommand = async (
  prompt: string,
  options: {
    key: string;
    model?: string;
    temperature?: number;
    baseUrl?: string;
    schema: any;
  }
): Promise<any> => {
  const { key, temperature = 0, baseUrl, schema } = options;
  let { model = "gpt-4o" } = options;

  const chatModel = new ChatOpenAI({
    openAIApiKey: key,
    modelName: model,
    temperature,
    modelKwargs: {
      response_format: {
        type: "json_object",
      },
    },
    configuration: {
      baseURL: baseUrl,
    },
    verbose: true,
    maxRetries: 1,
  });

  const structuredOutput = chatModel.withStructuredOutput(
    zodToJsonSchema(schema),
    {
      method: "jsonMode",
    }
  );

  const response = await structuredOutput.invoke(prompt);
  return response;
};
