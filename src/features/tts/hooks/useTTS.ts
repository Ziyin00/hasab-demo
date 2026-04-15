import { ttsConfig } from "../config/tts.config";

export const useTTS = () => {
  const generateSpeech = async (data: any) => {
    console.log(`Generating speech via ${ttsConfig.processing.endpoint}`, data);
  };

  return {
    generateSpeech,
    config: ttsConfig,
  };
};
