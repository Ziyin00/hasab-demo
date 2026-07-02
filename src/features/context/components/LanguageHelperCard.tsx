import { Languages } from "lucide-react";

const SUPPORTED_LANGUAGES = [
  { native: "English", label: "en" },
  { native: "አማርኛ", label: "Amharic" },
  { native: "Afaan Oromoo", label: "Oromo" },
  { native: "ትግርኛ", label: "Tigrinya" },
];

export function LanguageHelperCard() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-3.5 border-b bg-muted/20 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 flex-shrink-0">
          <Languages className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Supported Languages</p>
          <p className="text-xs text-muted-foreground mt-0.5">Available for AI responses</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Hasab AI can understand and respond in the following languages based on the context and user input.
        </p>

        <div className="grid grid-cols-2 gap-1.5">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <div
              key={lang.label}
              className="flex flex-col gap-0.5 rounded-md border border-border bg-muted/30 px-3 py-2.5"
            >
              <span className="text-xs font-semibold leading-none text-foreground">
                {lang.native}
              </span>
              <span className="text-[10px] leading-none text-muted-foreground">
                {lang.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
