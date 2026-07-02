export interface ContextAccessStatus {
  has_access: boolean;
  is_organization_owner: boolean;
  can_grant_access: boolean;
  request_status?: string;
  access_type?: string;
  request?: {
    status: string;
    admin_notes?: string;
  };
}

export interface ContextItem {
  id: number;
  name: string;
  priority: number;
  is_active: boolean;
  context_data: string;
  rag_store_id?: number | null;
  created_at?: string;
}

export interface ContextFormData {
  name: string;
  priority: number;
  is_active: boolean;
  context_data: string;
}

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  team_role?: string;
  is_team_admin?: boolean;
  has_access: boolean;
  access_type?: string;
  access_status?: string;
}

export const LANGUAGE_OPTIONS = [
  { label: "English", value: "en", apiValue: "eng" },
  { label: "Amharic (አማርኛ)", value: "am", apiValue: "amh" },
  { label: "Oromo (Afaan Oromoo)", value: "om", apiValue: "orm" },
  { label: "Tigrinya (ትግርኛ)", value: "tir", apiValue: "tir" },
] as const;

export const MODEL_OPTIONS = [
  { label: "hasab-1-lite (recommended)", value: "hasab-1-lite", disabled: false },
  { label: "hasab-1-main (coming soon)", value: "hasab-1-main", disabled: true },
] as const;

export function getLanguageInstruction(lang: string): string {
  const map: Record<string, string> = {
    am: "CRITICAL: You MUST respond ONLY in Amharic (አማርኛ). All your responses must be in Amharic language. Do not use English or any other language. Always respond in Amharic.",
    om: "CRITICAL: You MUST respond ONLY in Oromia (Afaan Oromoo). All your responses must be in Oromia language. Do not use English, Amharic, or any other language. Always respond in Oromia.",
    tir: "CRITICAL: You MUST respond ONLY in Tigrinya (ትግርኛ). All your responses must be in Tigrinya language. Do not use English, Amharic, Oromo, or any other language. Always respond in Tigrinya.",
  };
  return (
    map[lang] ??
    "CRITICAL: You MUST respond ONLY in English. All your responses must be in English language. Do not use any other language. Always respond in English."
  );
}
