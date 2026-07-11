export type WidgetPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

export interface ChatbotWidgetLauncher {
  type?: string;
  label?: string;
  icon_url?: string | null;
  background_color?: string;
  text_color?: string;
}

export interface ChatbotWidgetHeader {
  avatar_url?: string | null;
  avatar_initials?: string;
}

export interface ChatbotWidgetMic {
  label?: string;
  recording_label?: string;
  processing_label?: string;
  icon_url?: string | null;
  recording_icon_url?: string | null;
  background_color?: string;
  recording_background_color?: string;
  processing_background_color?: string;
  text_color?: string;
}

export interface ChatbotWidgetSend {
  label?: string;
  icon_url?: string | null;
}

export interface ChatbotWidgetTheme {
  primary_color?: string;
  panel_background?: string;
  message_area_background?: string;
  text_color?: string;
  bot_message_background?: string;
  bot_message_text_color?: string;
  user_message_background?: string;
  user_message_text_color?: string;
  chip_background?: string;
  chip_text_color?: string;
  border_color?: string;
  font_family?: string;
  border_radius?: string;
  panel_width?: string;
  panel_height?: string;
  launcher_size?: string;
  launcher?: ChatbotWidgetLauncher;
  header?: ChatbotWidgetHeader;
  mic?: ChatbotWidgetMic;
  send?: ChatbotWidgetSend;
}

export interface LanguageOption {
  code: string;
  label: string;
}

export interface QuickPrompt {
  label: string;
  prompt: string;
}

export interface WidgetFeatures {
  audio_upload?: boolean;
  quick_prompts?: boolean;
  language_selector?: boolean;
}

export interface ChatbotWidgetSettings {
  title?: string;
  subtitle?: string;
  launcher_label?: string;
  input_placeholder?: string;
  show_language_selector?: boolean;
  languages?: LanguageOption[];
  quick_prompts?: QuickPrompt[];
  features?: WidgetFeatures;
}

export interface ChatbotWidget {
  id: number;
  widget_id: string;
  name: string;
  allowed_origins: string[];
  theme: ChatbotWidgetTheme;
  settings: ChatbotWidgetSettings;
  chat_context_ids: number[];
  rag_store_ids: number[];
  welcome_message: string;
  default_language: string;
  position: WidgetPosition;
  rate_limit_per_minute: number;
  is_active: boolean;
  snippet?: string;
}

export type CreateChatbotWidgetPayload = Omit<ChatbotWidget, "id" | "widget_id" | "snippet">;
export type UpdateChatbotWidgetPayload = Partial<CreateChatbotWidgetPayload>;
