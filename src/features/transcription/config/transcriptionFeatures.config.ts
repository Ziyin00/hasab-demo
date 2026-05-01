export type TranscriptionFeatureId = "summary";

export const TRANSCRIPTION_OPTIONAL_FEATURES = [
  {
    id: "summary" as const,
    title: "Summarization",
    description:
      "Generate a concise summary alongside the transcription for quick scanning and downstream use.",
  },
] satisfies ReadonlyArray<{
  id: TranscriptionFeatureId;
  title: string;
  description: string;
}>;

/** Target locales when translating the transcript. Values match API conventions. */
export const TRANSCRIPTION_TARGET_LANGUAGES = [
  { value: "amh", label: "አማርኛ" },
  { value: "english", label: "English" },
  { value: "tig", label: "Tigrigna (Beta)" },
  { value: "orm", label: "Oromoo" },
] as const;
