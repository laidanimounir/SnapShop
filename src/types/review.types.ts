export type Review = {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
};
