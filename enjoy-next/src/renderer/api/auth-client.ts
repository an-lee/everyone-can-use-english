import { BaseClient } from "./base";
import { UserType } from "./types";

export class AuthClient extends BaseClient {
  me(): Promise<UserType> {
    return this.makeRequest<UserType>("get", "/api/me");
  }

  auth(params: {
    provider: "mixin" | "github" | "bandu" | "email";
    code?: string;
    deviceCode?: string;
    phoneNumber?: string;
    email?: string;
    mixinId?: string;
  }): Promise<UserType> {
    return this.makeRequest<UserType>("post", "/api/sessions", params);
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
    return this.makeRequest("post", "/api/sessions/device_code", { provider });
  }

  loginCode(params: {
    phoneNumber?: string;
    email?: string;
    mixinId?: string;
  }): Promise<void> {
    return this.makeRequest<void>("post", "/api/sessions/login_code", params);
  }

  usages(): Promise<{ label: string; data: number[] }[]> {
    return this.makeRequest("get", "/api/mine/usages");
  }
}
