import { BaseClient } from "./base";

export class AuthClient extends BaseClient {
  me(): Promise<UserType> {
    return this.makeRequest<UserType>("get", "/api/me");
  }

  auth(data: {
    provider: "mixin" | "github" | "bandu" | "email";
    code?: string;
    deviceCode?: string;
    phoneNumber?: string;
    email?: string;
    mixinId?: string;
  }): Promise<UserType> {
    return this.makeRequest<UserType>("post", "/api/sessions", data);
  }

  oauthState(state: string): Promise<UserType> {
    return this.makeRequest<UserType>("post", "/api/sessions/oauth_state", {
      state,
    });
  }

  deviceCode(provider = "github"): Promise<{
    deviceCode: string;
    userCode: string;
    verificationUri: string;
    expiresIn: number;
    interval: number;
  }> {
    return this.makeRequest("post", "/api/sessions/device_code", {
      provider,
    });
  }

  loginCode(data: {
    phoneNumber?: string;
    email?: string;
    mixinId?: string;
  }): Promise<void> {
    return this.makeRequest<void>("post", "/api/sessions/login_code", data);
  }

  usages(): Promise<{ label: string; data: number[] }[]> {
    return this.makeRequest("get", "/api/mine/usages");
  }
}
