import { BaseClient } from "./base";

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

  createPost(data: {
    metadata?: PostType["metadata"];
    targetType?: string;
    targetId?: string;
  }): Promise<PostType> {
    return this.makeRequest<PostType>("post", "/api/posts", data);
  }

  updatePost(id: string, data: { content: string }): Promise<PostType> {
    return this.makeRequest<PostType>("put", `/api/posts/${id}`, data);
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
