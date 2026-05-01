export const transcriptionConfig = {
  type: "transcription",

  input: {
    accept: ["video/*", "audio/*"],
    maxSizeMB: 500,
  },

  ui: {
    title: "Transcription",
    description: "Upload audio or video and generate transcript outputs",
    uploadLabel: "Upload audio or video file",
  },

  processing: {
    endpoint: "/generate-subtitles",
    supportsLanguage: true,
    supportsStyling: true,
    supportsBurnIn: true,
    supportsSpeakerDiarization: true,
  },

  output: {
    type: "video/srt",
    downloadable: true,
    exportFormats: ["mp4", "srt", "vtt"],
  },
};
