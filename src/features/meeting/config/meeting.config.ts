export const meetingConfig = {
  type: "meeting-minutes",

  input: {
    accept: ["audio/*", "video/*"],
    maxSizeMB: 100,
  },

  ui: {
    title: "Meeting Minutes",
    description: "Generate summaries and action items from meetings",
    uploadLabel: "Upload meeting recording",
  },

  processing: {
    endpoint: "/meeting-minutes",
    supportsTemplates: true,
    supportsActionItems: true,
  },

  output: {
    type: "structured",
    downloadable: true,
    exportFormats: ["pdf", "docx", "json"],
  },
};
