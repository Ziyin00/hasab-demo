import { Status } from "./common.types";

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
  permissions?: any[];
}

export interface Organization {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postal_code: string;
  website: string;
  is_owner: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  user_type?: string;
  status?: string;
  role_id?: number;
  phone_number: string;
  organization_id?: number;
  email_verified_at: string | null;
  google_id?: string;
  reference: string;
  total_tokens?: number;
  created_at: string;
  updated_at: string;
  role: Role;
  organization?: Organization | null;
  context_access?: {
    has_access: boolean;
    is_organization_owner: boolean;
    can_grant_access: boolean;
    request_status: string;
    access_type: string;
  };
}

export interface LoginResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
}

export interface ProfileResponse {
  status: string;
  data: {
    user: User;
  };
  message: string;
  code: number;
  request_id: string;
}
