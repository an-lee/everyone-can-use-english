import OpenAI from "openai";
import { useSettingsStore } from "@renderer/store/use-settings-store";
import { useAuthStore } from "@renderer/store/use-auth-store";
import { useAppStore } from "@renderer/store/use-app-store";
import { Client } from "@renderer/api";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export const ttsCommand = async (
  text: string,
  options?: TTSConfig
): Promise<ArrayBuffer | undefined> => {
  const { ttsConfig } = useSettingsStore.getState();
  options = { ...ttsConfig, ...options };

  if (options.engine === "enjoyai" && options.model === "azure/speech") {
    return azureTTS(text, options);
  } else if (
    options.engine === "openai" ||
    options.model.startsWith("openai/")
  ) {
    return openaiTTS(text, options);
  } else {
    console.error("Invalid TTS engine or model", options);
    throw new Error("Invalid TTS engine or model");
  }
};

export const openaiTTS = async (
  text: string,
  options?: TTSConfig
): Promise<ArrayBuffer> => {
  const { config: appConfig } = useAppStore.getState();
  const {
    ttsConfig,
    openai: openaiSettings,
    ttsProviders,
  } = useSettingsStore.getState();
  const { currentUser } = useAuthStore.getState();
  const {
    engine,
    model = ttsProviders["openai"].models[0],
    voice = ttsProviders["openai"].voices.find(
      (voice) => voice.provider === "openai"
    )?.value,
  } = {
    ...ttsConfig,
    ...options,
  };

  let client: OpenAI;

  if (engine === "openai" && openaiSettings.key) {
    client = new OpenAI({
      apiKey: openaiSettings.key,
      baseURL: openaiSettings.baseUrl,
      dangerouslyAllowBrowser: true,
      maxRetries: 1,
    });
  } else {
    client = new OpenAI({
      apiKey: currentUser!.accessToken,
      baseURL: `${appConfig.webApiUrl}/api/ai`,
      dangerouslyAllowBrowser: true,
      maxRetries: 1,
    });
  }

  const file = await client.audio.speech.create({
    input: text,
    model: model.replace("openai/", ""),
    voice,
  });

  return file.arrayBuffer();
};

export const azureTTS = async (
  text: string,
  options: TTSConfig
): Promise<ArrayBuffer | undefined> => {
  if (!text) return;
  const { learningLanguage, ttsProviders } = useSettingsStore.getState();
  const {
    model = "azure/speech",
    voice = ttsProviders["enjoyai"].voices.find(
      (voice) =>
        voice.provider === "azure" && voice.language === learningLanguage
    )?.value,
    language = learningLanguage,
  } = options;

  if (model !== "azure/speech") return;

  const webApi = new Client();
  const { id, token, region } = await webApi.speech.generateToken({
    purpose: "tts",
    input: text,
  });
  const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region);
  speechConfig.speechRecognitionLanguage = language;
  speechConfig.speechSynthesisVoiceName = voice;

  // const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, sdk.AudioConfig.fromDefaultSpeakerOutput());
  // Do not playback audio when transcribed
  const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

  return new Promise((resolve, reject) => {
    speechSynthesizer.speakTextAsync(
      text,
      (result) => {
        speechSynthesizer.close();

        if (result && result.audioData) {
          webApi.speech.consumeToken(id);
          resolve(result.audioData);
        } else {
          webApi.speech.revokeToken(id);
          reject(result);
        }
      },
      (error) => {
        speechSynthesizer.close();
        webApi.speech.revokeToken(id);
        reject(error);
      }
    );
  });
};
