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

/** Recommended starter set from the categories admin guide (prefer 3–8, specific first). */
export const STARTER_CATEGORIES: ReadonlyArray<
  Required<Pick<CreateCategoryPayload, "name" | "description" | "is_active">>
> = [
  {
    name: "Pricing",
    description:
      'Plans, quotes, costs, discounts, and billing questions. Examples: "how much does it cost", "pricing plans", "do you have a discount", "invoice"',
    is_active: true,
  },
  {
    name: "Account Access",
    description:
      'Password reset, email change, permissions, team invites. Examples: "forgot password", "reset my account", "invite a teammate", "change email"',
    is_active: true,
  },
  {
    name: "Technical Support",
    description:
      'Bugs, errors, login failures, setup help. Examples: "not working", "error", "can\'t log in", "how do I install"',
    is_active: true,
  },
  {
    name: "Shipping & Delivery",
    description:
      'Delivery times, tracking, address changes. Examples: "where is my order", "tracking number", "change shipping address", "shipping delay"',
    is_active: true,
  },
  {
    name: "General Questions",
    description:
      'Product overview, how it works, and other broad questions that are not pricing, account, support, or shipping. Examples: "what is this", "how does it work", "tell me more"',
    is_active: true,
  },
];

export const CATEGORY_DESCRIPTION_PLACEHOLDER =
  'What this topic covers. Examples: "phrase one", "phrase two", "phrase three"';
