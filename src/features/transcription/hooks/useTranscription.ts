import { transcriptionConfig } from "../config/transcription.config";

export const useTranscription = () => {
  const uploadAudio = async (file: File) => {
    // Implement upload logic using transcriptionConfig.processing.endpoint
    console.log(`Uploading to ${transcriptionConfig.processing.endpoint}`, file);
  };

  return {
    uploadAudio,
    config: transcriptionConfig,
  };
};
