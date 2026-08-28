import type { AxiosError } from "axios";

type LimitErrorBody = {
  message?: string;
  errors?: {
    limit?: string[] | string;
  };
};

export function isChannelLimitError(err: unknown): boolean {
  const axiosErr = err as AxiosError<LimitErrorBody>;
  if (axiosErr.response?.status !== 422) return false;
  const errors = axiosErr.response.data?.errors;
  if (!errors) return false;
  return "limit" in errors;
}

export function channelLimitErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<LimitErrorBody>;
  const limitMsg = axiosErr.response?.data?.errors?.limit;
  if (Array.isArray(limitMsg) && limitMsg[0]) return limitMsg[0];
  if (typeof limitMsg === "string" && limitMsg) return limitMsg;
  if (axiosErr.response?.data?.message) return axiosErr.response.data.message;
  return fallback;
}
