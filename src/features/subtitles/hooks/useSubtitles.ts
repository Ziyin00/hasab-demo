import { subtitlesConfig } from "../config/subtitles.config";

export const useSubtitles = () => {
  const generateSubtitles = async (file: File) => {
    console.log(`Generating subtitles via ${subtitlesConfig.processing.endpoint}`, file);
  };

  return {
    generateSubtitles,
    config: subtitlesConfig,
  };
};
