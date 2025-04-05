import { BaseClient } from "./base";
import { PagyResponseType, PostType } from "./types";

export class PostClient extends BaseClient {
  posts(params?: {
    page?: number;
    items?: number;
    userId?: string;
    type?:
      | "all"
      | "recording"
      | "medium"
      | "story"
      | "prompt"
      | "text"
      | "gpt"
      | "note";
    by?: "following" | "all";
  }): Promise<
    {
      posts: PostType[];
    } & PagyResponseType
  > {
    return this.makeRequest("get", "/api/posts", null, params || {});
  }

  post(id: string): Promise<PostType> {
    return this.makeRequest<PostType>("get", `/api/posts/${id}`);
  }

  createPost(params: {
    metadata?: PostType["metadata"];
    targetType?: string;
    targetId?: string;
  }): Promise<PostType> {
    return this.makeRequest<PostType>("post", "/api/posts", params);
  }

  updatePost(id: string, params: { content: string }): Promise<PostType> {
    return this.makeRequest<PostType>("put", `/api/posts/${id}`, params);
  }

  deletePost(id: string): Promise<void> {
    return this.makeRequest<void>("delete", `/api/posts/${id}`);
  }

  likePost(id: string): Promise<PostType> {
    return this.makeRequest<PostType>("post", `/api/posts/${id}/like`);
  }

  unlikePost(id: string): Promise<PostType> {
    return this.makeRequest<PostType>("delete", `/api/posts/${id}/unlike`);
  }
}
