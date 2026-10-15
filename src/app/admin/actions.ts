"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const validStatuses = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export async function updateOrderStatus(id: string, formData: FormData) {
  const status = formData.get("status") as string;
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid order status");
  }

  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function setProductActive(id: string, formData: FormData) {
  const isActive = formData.get("is_active") === "true";

  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
}

export async function setReviewApproved(id: string, formData: FormData) {
  const isApproved = formData.get("is_approved") === "true";

  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("reviews")
    .update({ is_approved: isApproved })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/reviews");
}

export async function signOutAdmin() {
  const supabase = createServerSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
