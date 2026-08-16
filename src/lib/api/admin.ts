import { createAdminClient } from "@/lib/supabase/admin";

export type AdminOrder = {
  id: string;
  guest_name: string;
  guest_phone: string;
  status: string;
  total: number;
  created_at: string;
};

export async function getOrders(): Promise<AdminOrder[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, guest_name, guest_phone, status, total, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AdminOrder[];
}
