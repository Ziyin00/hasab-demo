export interface TokenTransaction {
  id: number;
  amount: string;
  currency: string;
  tokens: number;
  tx_ref: string;
  payment_status: "success" | "pending" | "failed" | "admin_adjustment" | string;
  created_at: string;
}

export interface TokenTransactionPage {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: TokenTransaction[];
}

export interface TopUpRequest {
  amount: string;
  currency: "ETB" | "USD";
}

export interface TopUpResponse {
  data: {
    response: {
      data: {
        checkout_url: string;
      };
    };
  };
  message?: string;
}
