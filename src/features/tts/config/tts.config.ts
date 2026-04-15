export const ttsConfig = {
  type: "tts",

  input: {
    type: "text",
    maxLength: 5000,
  },

  ui: {
    title: "Text to Speech",
    description: "Convert text into natural sounding speech",
    inputLabel: "Enter text to convert",
  },

  processing: {
    endpoint: "/tts",
    supportsVoiceSelection: true,
    supportsSpeedControl: true,
  },

  output: {
    type: "audio",
    downloadable: true,
    exportFormats: ["mp3", "wav"],
  },
};
