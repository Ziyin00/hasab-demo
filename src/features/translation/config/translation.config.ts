export const translationConfig = {
  type: "translation",

  input: {
    accept: ["audio/*", "video/*", "text/plain"],
    maxSizeMB: 50,
  },

  ui: {
    title: "Translation",
    description: "Translate audio or text to another language",
    uploadLabel: "Upload file for translation",
  },

  processing: {
    endpoint: "/translate",
    supportsSourceLanguage: true,
    supportsTargetLanguage: true,
  },

  output: {
    type: "text",
    downloadable: true,
    exportFormats: ["pdf", "txt", "json"],
  },
};
