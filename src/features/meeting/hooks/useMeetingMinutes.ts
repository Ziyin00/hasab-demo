import { meetingConfig } from "../config/meeting.config";
import { submitMeetingMinutesUpload } from "../api/meeting.api";
import { useMeetingStore } from "@/store/meeting.store";
import { toast } from "sonner";

export const useMeetingMinutes = () => {
  const { setJob, updateJobProgress, setFromUploadResult } = useMeetingStore();

  const generateMeetingMinutes = async (data: { file: File; language?: string }) => {
    try {
      setJob({
        phase: "uploading",
        fileName: data.file.name,
        progress: 0,
        audioId: null,
        error: null,
      });

      const result = await submitMeetingMinutesUpload({
        file: data.file,
        language: data.language || "amh",
        onUploadProgress: (p) => {
          updateJobProgress(p);
          if (p >= 100) {
            setJob({
              phase: "processing",
              fileName: data.file.name,
              progress: 100,
              audioId: null,
              error: null,
            });
          }
        },
      });

      setFromUploadResult({
        rawResponse: result.raw,
        summaryText: result.summary,
        successMessage: result.message ?? "Audio processed successfully.",
        file: {
          name: data.file.name,
          size: `${(data.file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: data.file.type || "audio/*",
          url: result.audioUrl,
          s3Url: result.s3Url || null,
          audioId: result.audioId,
        },
      });

      setJob({
        phase: "done",
        fileName: data.file.name,
        progress: 100,
        audioId: result.audioId,
        error: null,
      });

      return result;
    } catch (error) {
      console.error(error);
      setJob({
        phase: "error",
        fileName: data.file.name,
        progress: 0,
        audioId: null,
        error: error instanceof Error ? error.message : "Upload failed",
      });
      toast.error("Failed to process meeting minutes");
      return null;
    }
  };

  return {
    config: meetingConfig,
    submitMeetingMinutesUpload,
    generateMeetingMinutes,
  };
};
