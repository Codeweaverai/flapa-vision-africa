
export interface CombinedRegistration {
  id: string;
  user_id: string;
  entity_id: string;
  event_id?: string;
  created_at: string;
  status: string;
  payment_status: string;
  payment_amount?: number;
  payment_currency?: string;
  payment_method?: string;
  payment_id?: string | null;
  phone_number?: string;
  mobile_operator?: string;
  user_fullname: string;
  user_email: string;
  title: string;
  date: string;
  type: 'event' | 'course';
  user?: {
    id: string;
    email: string;
    full_name: string;
    [key: string]: any;
  };
}
