"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function enforceAdminRateLimit(userId: string, action: string) {
  if (!checkRateLimit(`admin:${action}:${userId}`, 30)) {
    throw new Error("Too many requests. Please wait a minute and try again.");
  }
}

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

  const { userId, supabase } = await requireAdmin();
  enforceAdminRateLimit(userId, "updateOrderStatus");
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function setProductActive(id: string, formData: FormData) {
  const isActive = formData.get("is_active") === "true";

  const { userId, supabase } = await requireAdmin();
  enforceAdminRateLimit(userId, "setProductActive");
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
}

export async function setReviewApproved(id: string, formData: FormData) {
  const isApproved = formData.get("is_approved") === "true";

  const { userId, supabase } = await requireAdmin();
  enforceAdminRateLimit(userId, "setReviewApproved");
  const { error } = await supabase
    .from("reviews")
    .update({ is_approved: isApproved })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/reviews");
}

export async function signInAdmin(
  email: string,
  password: string
): Promise<ActionResult> {
  try {
    // Cookie-aware client: signInWithPassword stores the session in
    // cookies via setAll, so middleware and requireAdmin see it on the
    // very next request (a plain browser client would only write
    // localStorage and the server would never observe the session).
    const supabase = createServerSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      return { ok: false, error: "Invalid email or password." };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: "Sign-in failed. Please try again." };
    }

    const admin = createAdminClient();
    const { data: membership, error: adminError } = await admin
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (adminError) {
      return { ok: false, error: adminError.message };
    }

    if (!membership) {
      await supabase.auth.signOut();
      return {
        ok: false,
        error: "Access denied: this account is not an administrator",
      };
    }

    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function signOutAdmin() {
  const supabase = createServerSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ------------------------------------------------------------
// Product management (all requireAdmin + rate limited)
// ------------------------------------------------------------

export type ActionResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

function actionError(error: unknown): { ok: false; error: string } {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Something went wrong.",
  };
}

function revalidateProductPaths(id?: string) {
  revalidatePath("/admin/products");
  if (id) revalidatePath(`/admin/products/${id}`);
  revalidatePath("/shop");
  revalidatePath("/");
}

export async function createProductAction(input: {
  name: string;
  description: string;
  category?: string | null;
  brand?: string | null;
  base_price: number;
  discount_percentage?: number;
  discount_amount?: number;
  is_active?: boolean;
  size_type?: "none" | "clothing" | "shoes" | "custom";
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "createProduct");
    const { validateProductInput } = await import(
      "@/lib/admin/product-validation"
    );
    const checked = validateProductInput(input);
    if (!checked.ok) return { ok: false, error: checked.error };
    void supabase;
    const { createProduct } = await import("@/lib/api/admin");
    const { id } = await createProduct(checked.value);
    revalidateProductPaths(id);
    return { ok: true, id };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateProductAction(
  id: string,
  input: {
    name: string;
    description: string;
    category?: string | null;
    brand?: string | null;
    base_price: number;
    discount_percentage?: number;
    discount_amount?: number;
    is_active?: boolean;
    size_type?: "none" | "clothing" | "shoes" | "custom";
  }
): Promise<ActionResult> {
  try {
    const { userId } = await requireAdmin();
    enforceAdminRateLimit(userId, "updateProduct");
    const { validateProductInput } = await import(
      "@/lib/admin/product-validation"
    );
    const checked = validateProductInput(input);
    if (!checked.ok) return { ok: false, error: checked.error };
    const { updateProduct } = await import("@/lib/api/admin");
    await updateProduct(id, checked.value);
    revalidateProductPaths(id);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveVariantsAction(
  productId: string,
  input: {
    colors: { name: string; hex: string }[];
    sizes: string[];
    size_type: "none" | "clothing" | "shoes" | "custom";
    rows: {
      color: string | null;
      color_hex: string | null;
      size: string | null;
      stock_quantity: number;
      price?: number | null;
      sku?: string | null;
      is_active?: boolean;
    }[];
  }
): Promise<
  ActionResult<{ created: number; deleted: number; deactivated: number }>
> {
  try {
    const { userId } = await requireAdmin();
    enforceAdminRateLimit(userId, "saveVariants");
    const {
      MAX_COLORS_PER_PRODUCT,
      MAX_SIZES_PER_PRODUCT,
      validateColor,
      validateSizeValue,
      validateVariantRow,
    } = await import("@/lib/admin/product-validation");
    const { buildVariantMatrix } = await import("@/lib/admin/variant-matrix");

    if (input.colors.length > MAX_COLORS_PER_PRODUCT) {
      return { ok: false, error: `At most ${MAX_COLORS_PER_PRODUCT} colors.` };
    }
    if (input.sizes.length > MAX_SIZES_PER_PRODUCT) {
      return { ok: false, error: `At most ${MAX_SIZES_PER_PRODUCT} sizes.` };
    }

    const colors: { name: string; hex: string }[] = [];
    for (const c of input.colors) {
      const checked = validateColor(c);
      if (!checked.ok) return { ok: false, error: checked.error };
      colors.push(checked.value);
    }
    const sizes: string[] = [];
    for (const s of input.sizes) {
      const checked = validateSizeValue(s, input.size_type);
      if (!checked.ok) return { ok: false, error: checked.error };
      sizes.push(checked.value);
    }
    for (const row of input.rows) {
      const checked = validateVariantRow(row);
      if (!checked.ok) return { ok: false, error: checked.error };
    }

    const matrix = buildVariantMatrix(colors, sizes);
    const wanted = new Set(
      matrix.map((m) => `${m.color ?? ""}\n${m.size ?? ""}`)
    );
    for (const row of input.rows) {
      if (!wanted.has(`${row.color ?? ""}\n${row.size ?? ""}`)) {
        return {
          ok: false,
          error: "A variant row does not match the colors/sizes matrix.",
        };
      }
    }

    const { saveVariants } = await import("@/lib/api/admin");
    const result = await saveVariants(productId, input.rows);
    revalidateProductPaths(productId);
    return {
      ok: true,
      created: result.created,
      deleted: result.deleted,
      deactivated: result.deactivated,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteProductAction(
  id: string
): Promise<ActionResult<{ deactivated: boolean }>> {
  try {
    const { userId } = await requireAdmin();
    enforceAdminRateLimit(userId, "deleteProduct");
    const { deleteProduct } = await import("@/lib/api/admin");
    const result = await deleteProduct(id);
    revalidateProductPaths(id);
    return { ok: true, deactivated: result.deactivated };
  } catch (error) {
    return actionError(error);
  }
}

const UPLOAD_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function uploadProductImageAction(
  productId: string,
  formData: FormData
): Promise<ActionResult<{ id: string; url: string }>> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "uploadProductImage");
    const {
      MAX_IMAGE_BYTES,
      MAX_IMAGES_PER_PRODUCT,
      detectImageType,
    } = await import("@/lib/admin/product-validation");

    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();
    if (!product) return { ok: false, error: "Product not found." };

    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Choose an image file to upload." };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: "Image must be at most 5 MB." };
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return { ok: false, error: "Only JPEG, PNG and WebP images are allowed." };
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = detectImageType(bytes);
    if (!kind) {
      return {
        ok: false,
        error: "That file is not a real JPEG, PNG or WebP image.",
      };
    }

    const { data: existing } = await supabase
      .from("product_images")
      .select("id, position")
      .eq("product_id", productId);
    if ((existing ?? []).length >= MAX_IMAGES_PER_PRODUCT) {
      return {
        ok: false,
        error: `At most ${MAX_IMAGES_PER_PRODUCT} images per product.`,
      };
    }

    const ext = kind === "jpg" ? "jpg" : kind;
    const { randomUUID } = await import("crypto");
    const path = `products/${productId}/${randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, Buffer.from(bytes), {
        contentType: UPLOAD_MIME[kind],
        upsert: false,
      });
    if (uploadError) return { ok: false, error: uploadError.message };

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(path);
    const nextPosition =
      (existing ?? []).reduce(
        (max: number, img: { position: number }) => Math.max(max, img.position),
        -1
      ) + 1;

    const { data: inserted, error: insertError } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        url: publicUrl,
        alt_text: null,
        position: nextPosition,
        is_primary: (existing ?? []).length === 0,
      })
      .select("id, url")
      .single();
    if (insertError) {
      await supabase.storage.from("product-images").remove([path]);
      return { ok: false, error: insertError.message };
    }

    revalidateProductPaths(productId);
    return {
      ok: true,
      id: (inserted as { id: string }).id,
      url: (inserted as { url: string }).url,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteProductImageAction(
  imageId: string
): Promise<ActionResult> {
  try {
    const { userId } = await requireAdmin();
    enforceAdminRateLimit(userId, "deleteProductImage");
    const { deleteProductImage } = await import("@/lib/api/admin");
    const { productId } = await deleteProductImage(imageId);
    revalidateProductPaths(productId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function setPrimaryImageAction(
  imageId: string
): Promise<ActionResult> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "setPrimaryImage");
    const { setPrimaryImage } = await import("@/lib/api/admin");
    await setPrimaryImage(imageId);
    const { data } = await supabase
      .from("product_images")
      .select("product_id")
      .eq("id", imageId)
      .maybeSingle();
    revalidateProductPaths((data as { product_id: string } | null)?.product_id);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function reorderImagesAction(
  productId: string,
  orderedIds: string[]
): Promise<ActionResult> {
  try {
    const { userId } = await requireAdmin();
    enforceAdminRateLimit(userId, "reorderImages");
    const { reorderProductImages } = await import("@/lib/api/admin");
    await reorderProductImages(productId, orderedIds);
    revalidateProductPaths(productId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function setImageColorAction(
  imageId: string,
  color: string | null
): Promise<ActionResult> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "setImageColor");
    const { setImageColor } = await import("@/lib/api/admin");
    await setImageColor(imageId, color?.trim() ? color.trim() : null);
    const { data } = await supabase
      .from("product_images")
      .select("product_id")
      .eq("id", imageId)
      .maybeSingle();
    revalidateProductPaths((data as { product_id: string } | null)?.product_id);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}
