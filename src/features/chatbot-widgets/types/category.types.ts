export interface ChatCategory {
  id: number;
  chatbot_widget_id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export const MAX_CATEGORIES_PER_WIDGET = 20;
