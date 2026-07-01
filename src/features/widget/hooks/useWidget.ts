import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { widgetApi } from "../api/widget.api";
import type { WidgetConfig } from "../types/widget.types";

export function useWidgetConfig() {
  return useQuery({
    queryKey: ["widget", "config"],
    queryFn: widgetApi.getConfig,
  });
}

export function useUpdateWidgetConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<WidgetConfig>) => widgetApi.updateConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widget", "config"] });
      toast.success("Widget settings saved");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message ?? "Failed to save settings");
    },
  });
}

export function useWidgetKeys() {
  return useQuery({
    queryKey: ["widget", "keys"],
    queryFn: widgetApi.getKeys,
  });
}
