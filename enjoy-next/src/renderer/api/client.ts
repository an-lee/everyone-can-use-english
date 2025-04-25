import { BaseClient, ClientOptions } from "./base";
import { AuthClient } from "./auth-client";
import { UserClient } from "./user-client";
import { PostClient } from "./post-client";
import { MediaClient } from "./media-client";
import { SpeechClient } from "./speech-client";
// Import other client modules as needed

export class Client extends BaseClient {
  auth: AuthClient;
  user: UserClient;
  post: PostClient;
  media: MediaClient;
  speech: SpeechClient;
  // Declare other client modules

  constructor(options?: ClientOptions) {
    super(options);

    // Initialize all resource clients with the same options
    this.auth = new AuthClient(options);
    this.user = new UserClient(options);
    this.post = new PostClient(options);
    this.media = new MediaClient(options);
    this.speech = new SpeechClient(options);
    // Initialize other clients
  }

  // System/miscellaneous methods
  up() {
    return this.makeRequest("get", "/up");
  }

  config(key: string): Promise<any> {
    return this.makeRequest("get", `/api/config/${key}`);
  }
}
