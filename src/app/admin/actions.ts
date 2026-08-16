"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

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

  const supabase = createAdminClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}
