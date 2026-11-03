export type PublicJobDto = {
  id: string;
  source_url: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  publish_at: string | null;
  description_md: string | null;
  external_id: string | null;
  deadline: string | null;
};

export type ListJobsInput = {
  q?: string | null;
  company?: string | null;
  location?: string | null;
  publishAfter?: string | null;
  limit?: number;
  offset?: number;
};

export type ListJobsResult = {
  items: PublicJobDto[];
  total: number;
};

export type JobListFilters = {
  q: string;
  company: string;
  location: string;
  publishAfter: string;
  limit: number;
  offset: number;
};

export type WalletDto = {
  payer_msisdn: string | null;
  balance_xof: number | null;
};

export type PaymentMethodPublicDto = {
  display_name: string;
  merchant_msisdn: string | null;
};

export type PlanDto = {
  id: string;
  slug: string;
  display_name: string;
  price_xof: number;
  duration_days: number;
};

export type SubscriptionDto = {
  id: string;
  auth0_sub: string;
  plan_id: string;
  starts_at: string;
  ends_at: string;
};

export type PurchasePlanResult = {
  balance_xof: number;
  subscription: SubscriptionDto;
};
