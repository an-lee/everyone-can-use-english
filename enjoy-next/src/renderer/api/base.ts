import axios, { AxiosInstance } from "axios";
import decamelizeKeys from "decamelize-keys";
import camelcaseKeys from "camelcase-keys";
import { useAuthStore, useAppStore } from "@renderer/store";

const ONE_MINUTE = 1000 * 60; // 1 minute

export interface ClientOptions {
  baseUrl?: string;
  accessToken?: string;
  logger?: any;
  locale?: "en" | "zh-CN";
  onError?: (err: any) => void;
  onSuccess?: (res: any) => void;
}

export class BaseClient {
  public api: AxiosInstance;
  public baseUrl: string;
  public logger: any;

  constructor(options: ClientOptions = {}) {
    const {
      baseUrl = useAppStore.getState().webApiUrl,
      accessToken = useAuthStore.getState().currentUser?.accessToken,
      logger = console,
      locale = "en",
      onError,
      onSuccess,
    } = options;
    this.baseUrl = baseUrl;
    this.logger = logger;

    this.api = axios.create({
      baseURL: baseUrl,
      timeout: ONE_MINUTE,
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.api.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${accessToken}`;
      config.headers["Accept-Language"] = locale;

      this.logger.debug(
        config.method!.toUpperCase(),
        config.baseURL! + config.url,
        config.data,
        config.params
      );
      return config;
    });
    this.api.interceptors.response.use(
      (response) => {
        if (onSuccess) {
          onSuccess(response);
        }

        this.logger.debug(
          response.status,
          response.config.method!.toUpperCase(),
          response.config.baseURL! + response.config.url!
        );
        return camelcaseKeys(response.data, { deep: true });
      },
      (err) => {
        if (onError) {
          onError(err);
        }

        if (err.response) {
          this.logger.error(
            err.response.status,
            err.response.config.method!.toUpperCase(),
            err.response.config.baseURL! + err.response.config.url!
          );

          if (err.response.data) {
            if (typeof err.response.data === "string") {
              err.message = err.response.data;
            } else if (typeof err.response.data === "object") {
              err.message =
                err.response.data.error ||
                err.response.data.message ||
                JSON.stringify(err.response.data);
            }
          }
          return Promise.reject(err);
        }

        return Promise.reject(err);
      }
    );
  }

  // Utility method to wrap API calls
  protected makeRequest<T>(
    method: string,
    url: string,
    data?: any,
    params?: any
  ): Promise<T> {
    return this.api.request({
      method,
      url,
      data: data ? decamelizeKeys(data, { deep: true }) : undefined,
      params: params ? decamelizeKeys(params, { deep: true }) : undefined,
    });
  }
}
