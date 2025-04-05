import { BaseClient } from "./base";
import { PagyResponseType, UserType } from "./types";

export class UserClient extends BaseClient {
  updateProfile(
    id: string,
    params: {
      name?: string;
      email?: string;
      code?: string;
    }
  ): Promise<UserType> {
    return this.makeRequest<UserType>("put", `/api/users/${id}`, params);
  }

  rankings(range: "day" | "week" | "month" | "year" | "all" = "day"): Promise<{
    rankings: UserType[];
    range: string;
  }> {
    return this.makeRequest("get", "/api/users/rankings", null, { range });
  }

  users(filter: "following" | "followers" = "followers"): Promise<
    {
      users: UserType[];
    } & PagyResponseType
  > {
    return this.makeRequest("get", "/api/users", null, { filter });
  }

  user(id: string): Promise<UserType> {
    return this.makeRequest<UserType>("get", `/api/users/${id}`);
  }

  userFollowing(
    id: string,
    options: { page: number }
  ): Promise<
    {
      users: UserType[];
    } & PagyResponseType
  > {
    return this.makeRequest("get", `/api/users/${id}/following`, null, options);
  }

  userFollowers(
    id: string,
    options: { page: number }
  ): Promise<
    {
      users: UserType[];
    } & PagyResponseType
  > {
    return this.makeRequest("get", `/api/users/${id}/followers`, null, options);
  }

  follow(id: string): Promise<
    {
      user: UserType;
    } & {
      following: boolean;
    }
  > {
    return this.makeRequest("post", `/api/users/${id}/follow`);
  }

  unfollow(id: string): Promise<
    {
      user: UserType;
    } & {
      following: boolean;
    }
  > {
    return this.makeRequest("post", `/api/users/${id}/unfollow`);
  }
}
