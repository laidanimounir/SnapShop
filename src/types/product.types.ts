export type SizeType = "none" | "clothing" | "shoes" | "custom";

export type ProductVariant = {
  id: string;
  product_id: string;
  color: string | null;
  color_hex: string | null;
  size: string | null;
  price: number | null;
  stock_quantity: number;
  sku: string | null;
  is_active: boolean;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  position: number;
  is_primary: boolean;
  color: string | null;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string | null;
  brand: string | null;
  base_price: number;
  discount_percentage: number;
  discount_amount: number;
  rating: number;
  is_active: boolean;
  size_type: SizeType;
  created_at: string;
  images: ProductImage[];
  variants: ProductVariant[];
};
