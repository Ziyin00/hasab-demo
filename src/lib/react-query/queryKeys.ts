export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  transcription: {
    list: ["transcription", "list"] as const,
    detail: (id: string) => ["transcription", id] as const,
  },
  history: {
    all: ["history"] as const,
    detail: (id: string) => ["history", id] as const,
  },
};
