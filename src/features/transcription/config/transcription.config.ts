export const transcriptionConfig = {
  type: "transcription",

  input: {
    accept: ["audio/*"],
    maxSizeMB: 25,
    maxSizeMBForCompany: 25,
  },

  ui: {
    title: "Transcription",
    description: "Convert speech to text",
    uploadLabel: "Upload audio file",
  },

  processing: {
    endpoint: "/upload-audio",
    supportsLanguage: true,
    supportsSpeakerDiarization: true,
  },

  output: {
    type: "text",
    downloadable: true,
    exportFormats: ["pdf", "txt", "json"], // for history
  },
};
