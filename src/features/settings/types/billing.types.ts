export interface TokenHistoryRecord {
  id: number;
  user_id: number;
  token_ratio_id: number;
  tokens: number;
  tokens_used: number | null;
  service_type: string | null;
  metadata: { note: string | null } | null;
  amount: string;
  currency: string;
  payment_status: string;
  tx_ref: string;
  chapa_ref: string | null;
  response: unknown;
  created_at: string;
  updated_at: string;
}

export interface TokenHistoryPage {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: TokenHistoryRecord[];
}

export interface TokenHistoryResponse {
  message: string;
  status: string;
  data: TokenHistoryPage;
}

export type TokenCurrency = "ETB" | "USD";

export interface BuyTokensPayload {
  currency: TokenCurrency;
  amount: number;
}

export interface BuyTokensData {
  id: number;
  user_id: number;
  token_ratio_id: number;
  tokens: number;
  amount: string;
  currency: string;
  payment_status: string;
  tx_ref: string;
  chapa_ref: string | null;
  response: {
    message: string;
    status: string;
    data: {
      checkout_url: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface BuyTokensResponse {
  message: string;
  status: string;
  data: BuyTokensData;
}
