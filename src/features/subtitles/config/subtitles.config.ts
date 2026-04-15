export const subtitlesConfig = {
  type: "subtitles",

  input: {
    accept: ["video/*", "audio/*"],
    maxSizeMB: 500,
  },

  ui: {
    title: "Subtitles",
    description: "Generate and burn-in subtitles for your videos",
    uploadLabel: "Upload video file",
  },

  processing: {
    endpoint: "/generate-subtitles",
    supportsStyling: true,
    supportsBurnIn: true,
  },

  output: {
    type: "video/srt",
    downloadable: true,
    exportFormats: ["mp4", "srt", "vtt"],
  },
};
