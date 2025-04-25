import { BaseClient } from "./base";

export class SpeechClient extends BaseClient {
  generateToken(data: {
    purpose: "tts" | "stt";
    input: string;
    targetType?: string;
    targetId?: string;
  }): Promise<{ id: string; token: string; region: string }> {
    return this.makeRequest<{ id: string; token: string; region: string }>(
      "post",
      "/api/speech/tokens",
      data
    );
  }

  consumeToken(id: string): Promise<void> {
    return this.makeRequest<void>("put", `/api/speech/tokens/${id}`, {
      state: "consumed",
    });
  }

  revokeToken(id: string): Promise<void> {
    return this.makeRequest<void>("put", `/api/speech/tokens/${id}`, {
      state: "revoked",
    });
  }
}
