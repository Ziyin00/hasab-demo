import { translationConfig } from "../config/translation.config";

export const useTranslation = () => {
  const translate = async (data: any) => {
    console.log(`Translating via ${translationConfig.processing.endpoint}`, data);
  };

  return {
    translate,
    config: translationConfig,
  };
};
