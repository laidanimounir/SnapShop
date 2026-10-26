"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { ar, formatAr, statusLabelAr } from "@/lib/admin/i18n-ar";
import { normalizeActionError } from "@/lib/admin/action-errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function enforceAdminRateLimit(userId: string, action: string) {
  if (!checkRateLimit(`admin:${action}:${userId}`, 30)) {
    throw new Error(ar.messages.tooManyRequests);
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  note?: string
): Promise<ActionResult> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "updateOrderStatus");

    const { allowedTransitions, isOrderStatus } = await import(
      "@/lib/admin/order-transitions"
    );
    if (!isOrderStatus(newStatus)) {
      return { ok: false, error: ar.messages.invalidStatus };
    }

    const { data: current, error: fetchError } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (!current) return { ok: false, error: ar.messages.orderNotFound };

    const from = (current as { status: string }).status;
    if (!allowedTransitions(from).includes(newStatus)) {
      return {
        ok: false,
        error: formatAr(ar.messages.cannotTransition, {
          from: statusLabelAr(from),
          to: statusLabelAr(newStatus),
        }),
      };
    }

    const trimmedNote = note?.trim()
      ? note.trim().slice(0, 1000)
      : null;

    // Optimistic guard: only apply if the status is still the one we saw.
    const { data: updated, error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId)
      .eq("status", from)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) {
      return {
        ok: false,
        error: ar.messages.statusChangedMeanwhile,
      };
    }

    // The DB trigger wrote the history row; attach the reason and actor.
    const { data: history } = await supabase
      .from("order_status_history")
      .select("id")
      .eq("order_id", orderId)
      .eq("new_status", newStatus)
      .order("changed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (history) {
      await supabase
        .from("order_status_history")
        .update({ note: trimmedNote, changed_by: userId })
        .eq("id", (history as { id: string }).id);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateAdminNote(
  orderId: string,
  note: string
): Promise<ActionResult> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "updateAdminNote");
    const trimmed = note.trim().slice(0, 2000);
    const { error } = await supabase
      .from("orders")
      .update({ admin_note: trimmed ? trimmed : null })
      .eq("id", orderId);
    if (error) throw new Error(error.message);
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
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
      return { ok: false, error: ar.messages.invalidEmailPassword };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: ar.messages.signInFailed };
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
        error: ar.messages.notAdmin,
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
  console.error("[admin action]", error);
  return {
    ok: false,
    error: normalizeActionError(error),
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
  compare_at_price?: number | null;
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
    compare_at_price?: number | null;
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
      return {
        ok: false,
        error: formatAr(ar.messages.colorsMax, { n: MAX_COLORS_PER_PRODUCT }),
      };
    }
    if (input.sizes.length > MAX_SIZES_PER_PRODUCT) {
      return {
        ok: false,
        error: formatAr(ar.messages.sizesMax, { n: MAX_SIZES_PER_PRODUCT }),
      };
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
          error: ar.messages.variantMismatch,
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
    if (!product) return { ok: false, error: ar.messages.productNotFound };

    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: ar.messages.chooseImage };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: ar.messages.imageSize };
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return { ok: false, error: ar.messages.imageType };
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = detectImageType(bytes);
    if (!kind) {
      return {
        ok: false,
        error: ar.messages.imageReal,
      };
    }

    // Reject dimension bombs before the file ever reaches storage or
    // the image optimizer (a 5 MB PNG can decode to gigapixels).
    const { readImageDimensions, withinDimensionLimit } = await import(
      "@/lib/admin/image-dimensions"
    );
    if (!withinDimensionLimit(readImageDimensions(bytes))) {
      return { ok: false, error: ar.messages.imageDimensions };
    }

    const { data: existing } = await supabase
      .from("product_images")
      .select("id, position")
      .eq("product_id", productId);
    if ((existing ?? []).length >= MAX_IMAGES_PER_PRODUCT) {
      return {
        ok: false,
        error: formatAr(ar.messages.maxImages, {
          n: MAX_IMAGES_PER_PRODUCT,
        }),
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

// ------------------------------------------------------------
// Delivery zones (all requireAdmin + rate limited)
// ------------------------------------------------------------

export type DeliveryZoneInput = {
  wilaya_code: number;
  home_price: number;
  office_price: number;
  is_active: boolean;
};

function normalizeDeliveryRow(
  row: DeliveryZoneInput,
  parse: (v: unknown) => number | null
): DeliveryZoneInput {
  return {
    wilaya_code: row.wilaya_code,
    home_price: parse(row.home_price) as number,
    office_price: parse(row.office_price) as number,
    is_active: row.is_active,
  };
}

export async function saveDeliveryZoneAction(
  input: DeliveryZoneInput
): Promise<ActionResult> {
  try {
    const { userId } = await requireAdmin();
    enforceAdminRateLimit(userId, "saveDeliveryZone");

    const { isValidWilayaCode, parseDeliveryPrice, validateDeliveryPrice } =
      await import("@/lib/admin/delivery-validation");

    if (!isValidWilayaCode(input?.wilaya_code)) {
      return { ok: false, error: ar.messages.invalidWilaya };
    }
    if (typeof input.is_active !== "boolean") {
      return { ok: false, error: ar.messages.invalidActiveFlag };
    }
    const homeError = validateDeliveryPrice(input.home_price);
    if (homeError) return { ok: false, error: homeError };
    const officeError = validateDeliveryPrice(input.office_price);
    if (officeError) return { ok: false, error: officeError };

    const { updateDeliveryZones } = await import("@/lib/api/admin");
    await updateDeliveryZones([
      normalizeDeliveryRow(input, parseDeliveryPrice),
    ]);
    revalidatePath("/admin/delivery");
    revalidatePath("/shop");
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveAllDeliveryZonesAction(
  rows: DeliveryZoneInput[]
): Promise<ActionResult> {
  try {
    const { userId } = await requireAdmin();
    enforceAdminRateLimit(userId, "saveAllDeliveryZones");

    const { isValidWilayaCode, parseDeliveryPrice, validateDeliveryPrice } =
      await import("@/lib/admin/delivery-validation");

    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 58) {
      return { ok: false, error: ar.messages.invalidPayload };
    }

    const seen = new Set<number>();
    for (const row of rows) {
      if (!isValidWilayaCode(row?.wilaya_code)) {
        return { ok: false, error: ar.messages.invalidWilaya };
      }
      if (seen.has(row.wilaya_code)) {
        return { ok: false, error: ar.messages.duplicateWilaya };
      }
      seen.add(row.wilaya_code);
      if (typeof row.is_active !== "boolean") {
        return { ok: false, error: ar.messages.invalidActiveFlag };
      }
      const homeError = validateDeliveryPrice(row.home_price);
      if (homeError) return { ok: false, error: homeError };
      const officeError = validateDeliveryPrice(row.office_price);
      if (officeError) return { ok: false, error: officeError };
    }

    const { updateDeliveryZones } = await import("@/lib/api/admin");
    await updateDeliveryZones(
      rows.map((row) => normalizeDeliveryRow(row, parseDeliveryPrice))
    );
    revalidatePath("/admin/delivery");
    revalidatePath("/shop");
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function bulkSetDeliveryPricesAction(
  field: "home" | "office",
  price: number
): Promise<ActionResult> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "bulkSetDeliveryPrices");

    if (field !== "home" && field !== "office") {
      return { ok: false, error: ar.messages.invalidPriceField };
    }
    const { parseDeliveryPrice, validateDeliveryPrice } = await import(
      "@/lib/admin/delivery-validation"
    );
    const priceError = validateDeliveryPrice(price);
    if (priceError) return { ok: false, error: priceError };
    const parsed = parseDeliveryPrice(price) as number;

    const { data, error } = await supabase
      .from("delivery_zones")
      .select("wilaya_code, home_price, office_price, is_active");
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as DeliveryZoneInput[];
    if (rows.length === 0) throw new Error(ar.messages.noZones);

    const { updateDeliveryZones } = await import("@/lib/api/admin");
    await updateDeliveryZones(
      rows.map((row) => ({
        wilaya_code: row.wilaya_code,
        home_price: field === "home" ? parsed : Number(row.home_price),
        office_price: field === "office" ? parsed : Number(row.office_price),
        is_active: row.is_active,
      }))
    );

    revalidatePath("/admin/delivery");
    revalidatePath("/shop");
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

// ------------------------------------------------------------
// Store settings (all requireAdmin + rate limited; secrets never returned)
// ------------------------------------------------------------

export async function saveTrackingPixelAction(input: {
  pixel_id: string;
  enabled: boolean;
}): Promise<ActionResult> {
  try {
    const { userId } = await requireAdmin();
    enforceAdminRateLimit(userId, "saveTrackingPixel");

    const { validatePixelId } = await import(
      "@/lib/admin/settings-validation"
    );
    const pixelId =
      typeof input?.pixel_id === "string" ? input.pixel_id.trim() : "";
    const error = validatePixelId(pixelId);
    if (error) return { ok: false, error };

    const { upsertStoreSetting, TRACKING_PIXEL_KEY } = await import(
      "@/lib/api/store-settings"
    );
    await upsertStoreSetting(
      TRACKING_PIXEL_KEY,
      { pixel_id: pixelId, enabled: input.enabled === true },
      userId
    );

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (e) {
    return actionError(e);
  }
}

export async function saveDeliveryProviderAction(input: {
  api_key?: string;
  base_url?: string;
  enabled: boolean;
}): Promise<ActionResult> {
  try {
    const { userId } = await requireAdmin();
    enforceAdminRateLimit(userId, "saveDeliveryProvider");

    const { validateHttpsUrl } = await import(
      "@/lib/admin/settings-validation"
    );
    const baseUrl = (input?.base_url ?? "").trim();
    const urlError = validateHttpsUrl(baseUrl);
    if (urlError) return { ok: false, error: urlError };

    const providedKey = (input?.api_key ?? "").trim();
    if (providedKey.length > 500) {
      return { ok: false, error: ar.messages.apiKeyTooLong };
    }

    const {
      getStoreSettings,
      upsertStoreSetting,
      DELIVERY_PROVIDER_KEY,
    } = await import("@/lib/api/store-settings");

    // Empty submit keeps the existing secret; it is never echoed back.
    const current = await getStoreSettings();
    const apiKey =
      providedKey !== "" ? providedKey : current.provider.api_key;

    await upsertStoreSetting(
      DELIVERY_PROVIDER_KEY,
      { api_key: apiKey, base_url: baseUrl, enabled: input.enabled === true },
      userId
    );

    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (e) {
    return actionError(e);
  }
}
