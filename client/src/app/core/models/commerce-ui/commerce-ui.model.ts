export interface UiPriceLine {
  id: string;
  label: string;
  amount: number;
}

export interface UiAddress {
  name: string;
  email?: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  deliveryNotes?: string;
}

export interface UiProductCardProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  imageUrl: string;
  price: number;
  currency: string;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  rating?: number;
  reviewCount?: number;
  saleLabel?: string;
}

export interface UiCartItem {
  id: string;
  productName: string;
  productSlug?: string;
  imageUrl: string;
  unitPrice: number;
  currency: string;
  quantity: number;
  maxQuantity: number;
  stockStatus?: string;
}

export interface UiOrderSummaryCharge {
  id?: string;
  label: string;
  amount: number;
  tone?: 'neutral' | 'success' | 'warning' | 'error';
}

export interface UiPaymentMethod {
  id: 'card' | 'cod' | 'wallet';
  label: string;
  description: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
}

export interface UiReview {
  id: string;
  authorName: string;
  createdAt: string | Date;
  rating: number;
  title?: string;
  body: string;
  moderationState: 'visible' | 'pending' | 'hidden' | 'removed';
  owner?: boolean;
}
