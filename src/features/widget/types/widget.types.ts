export type WidgetPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

export interface WidgetConfig {
  primary_color: string;
  user_message_color: string;
  position: WidgetPosition;
  width: number;
  height: number;
  bot_name: string;
  avatar_text: string;
  welcome_message: string;
  public_key?: string;
}

export interface WidgetKeys {
  public_key: string;
  test_key: string;
  anthropic_key_masked: string;
}
