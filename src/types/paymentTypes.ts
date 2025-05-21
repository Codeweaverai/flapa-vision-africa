
export interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reference_type: string;
  reference_id: string;
  created_at: string;
  payment_method: string;
  user_id: string;
  creator_id?: string;
  provider?: string;
  provider_transaction_id?: string;
  metadata?: any;
  // UI-specific fields (not stored in DB)
  user_email?: string;
  course_title?: string;
  event_title?: string;
}

export interface PayoutTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  method: string;
  destination: string;
  transaction_id?: string;
}

export interface CreatorBalance {
  available: number;
  pending: number;
  currency: string;
}
