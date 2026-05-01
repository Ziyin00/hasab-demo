export const translationConfig = {
  type: "translation",

  ui: {
    title: "Translation",
    description: "Translate text between Ethiopian languages and English.",
  },

  processing: {
    endpoint: "/translate",
  },

  output: {
    downloadable: true,
    exportFormats: ["pdf", "txt"] as const,
  },
};
