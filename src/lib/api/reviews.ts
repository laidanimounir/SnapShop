import { supabase } from "@/lib/supabase/client";

export async function submitReview(input: {
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc("submit_review", {
    p_product_id: input.product_id,
    p_reviewer_name: input.reviewer_name,
    p_rating: input.rating,
    p_comment: input.comment,
  });

  if (error) throw new Error(error.message);
  return data as string;
}
