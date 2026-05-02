import { TranslationPlayground } from "@/features/translation/components/TranslationPlayground";

export default function TranslationPlaygroundPage() {
  return (
    <div className="mx-auto w-full max-w-4xl -mt-5 space-y-6 sm:space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Translation</h1>
        <p className="max-w-prose text-sm text-muted-foreground sm:text-base">
          Translate passages between Ethiopian languages and English
        </p>
      </div>
      <TranslationPlayground />
    </div>
  );
}
