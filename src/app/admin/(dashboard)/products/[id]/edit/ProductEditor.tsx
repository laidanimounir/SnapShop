"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  AdminProductDetail,
  SizeType,
} from "@/lib/api/admin";
import {
  deleteProductAction,
  deleteProductImageAction,
  reorderImagesAction,
  saveVariantsAction,
  setImageColorAction,
  setPrimaryImageAction,
  updateProductAction,
  uploadProductImageAction,
} from "@/app/admin/actions";
import { buildVariantMatrix } from "@/lib/admin/variant-matrix";
import { COMMON_COLORS, isValidHex, normalizeHex } from "@/lib/admin/colors";
import {
  MAX_PRODUCT_IMAGES,
  hasTooManyImages,
  moveImage,
  sortImages,
} from "@/lib/admin/images";
import { presetSizesFor } from "@/lib/sizes";
import { ar, formatAr } from "@/lib/admin/i18n-ar";

const inputCls =
  "w-full px-3 py-2 border border-black/15 rounded-lg text-sm";
const sectionCls = "bg-white border border-black/10 rounded-lg p-5 mb-4";

type RowState = {
  stock: string;
  price: string;
  sku: string;
  active: boolean;
};

const rowKey = (color: string | null, size: string | null) =>
  `${color ?? ""}\n${size ?? ""}`;

export default function ProductEditor({
  product,
}: {
  product: AdminProductDetail;
}) {
  const router = useRouter();

  // ---- basic info ----
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [category, setCategory] = useState(product.category ?? "");
  const [brand, setBrand] = useState(product.brand ?? "");
  const [basePrice, setBasePrice] = useState(String(product.base_price));
  const [discountPct, setDiscountPct] = useState(
    String(product.discount_percentage)
  );
  const [discountAmt, setDiscountAmt] = useState(
    String(product.discount_amount)
  );
  const [isActive, setIsActive] = useState(product.is_active);
  const [sizeType, setSizeType] = useState<SizeType>(product.size_type);

  // ---- colors / sizes ----
  const initialColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of product.variants) {
      if (v.color && !map.has(v.color)) map.set(v.color, v.color_hex ?? "#000000");
    }
    return Array.from(map.entries()).map(([cname, hex]) => ({
      name: cname,
      hex,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const initialSizes = useMemo(() => {
    const set = new Set<string>();
    for (const v of product.variants) {
      if (v.size) set.add(v.size);
    }
    return Array.from(set);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [useColors, setUseColors] = useState(initialColors.length > 0);
  const [colors, setColors] = useState(initialColors);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [useSizes, setUseSizes] = useState(initialSizes.length > 0);
  const [sizes, setSizes] = useState<string[]>(initialSizes);
  const [customSize, setCustomSize] = useState("");

  // ---- variant rows ----
  const initialRows = useMemo(() => {
    const map = new Map<string, RowState>();
    for (const v of product.variants) {
      map.set(rowKey(v.color, v.size), {
        stock: String(v.stock_quantity),
        price: v.price != null ? String(v.price) : "",
        sku: v.sku ?? "",
        active: v.is_active,
      });
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [rows, setRows] = useState<Map<string, RowState>>(initialRows);
  const [bulkStock, setBulkStock] = useState("");

  // ---- images ----
  const [images, setImages] = useState(product.images);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Position-ordered view; position 0 is the primary image.
  const orderedImages = useMemo(() => sortImages(images), [images]);
  const imagesFull = orderedImages.length >= MAX_PRODUCT_IMAGES;

  // ---- misc ----
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const showToast = (message: string, isError = false) => {
    setToast(message);
    setToastError(isError);
  };

  // ---- color helpers ----
  const addColor = (name: string, hex: string) => {
    const cname = name.trim();
    if (!cname) return;
    if (colors.some((c) => c.name.toLowerCase() === cname.toLowerCase())) {
      showToast(
        formatAr(ar.products.editor.colorExists, { name: cname }),
        true
      );
      return;
    }
    const norm = normalizeHex(hex);
    if (!norm) {
      showToast(
        formatAr(ar.products.editor.colorNeedsHex, { name: cname }),
        true
      );
      return;
    }
    setColors((prev) => [...prev, { name: cname, hex: norm }]);
    setDirty(true);
  };

  const addCustomColor = () => {
    const norm = normalizeHex(newColorHex);
    if (!newColorName.trim() || !norm) return;
    addColor(newColorName, norm);
    setNewColorName("");
  };

  const renameColorAt = (index: number, newName: string) => {
    setColors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, name: newName } : c))
    );
    setDirty(true);
  };

  const removeColorAt = (index: number) => {
    setColors((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const effectiveColors = useMemo(
    () => (useColors ? colors : []),
    [useColors, colors]
  );
  const effectiveSizes = useMemo(
    () => (useSizes ? sizes : []),
    [useSizes, sizes]
  );
  const matrix = useMemo(
    () => buildVariantMatrix(effectiveColors, effectiveSizes),
    [effectiveColors, effectiveSizes]
  );

  const removedWithHistory = useMemo(() => {
    const wanted = new Set(matrix.map((m) => rowKey(m.color, m.size)));
    return product.variants.filter(
      (v) => !wanted.has(rowKey(v.color, v.size))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matrix]);

  const getRow = (color: string | null, size: string | null): RowState =>
    rows.get(rowKey(color, size)) ?? { stock: "0", price: "", sku: "", active: true };

  const setRow = (color: string | null, size: string | null, patch: Partial<RowState>) => {
    setRows((prev) => {
      const next = new Map(prev);
      next.set(rowKey(color, size), { ...getRow(color, size), ...patch });
      return next;
    });
    setDirty(true);
  };

  const saveAll = async () => {
    const colorNames = effectiveColors.map((c) => c.name.trim());
    if (
      colorNames.some((n) => n === "") ||
      new Set(colorNames.map((n) => n.toLowerCase())).size !== colorNames.length
    ) {
      showToast(ar.products.editor.colorNamesUnique, true);
      return;
    }
    setSaving(true);
    setToast(null);
    const basic = await updateProductAction(product.id, {
      name,
      description,
      category: category || null,
      brand: brand || null,
      base_price: Number(basePrice),
      discount_percentage: Number(discountPct) || 0,
      discount_amount: Number(discountAmt) || 0,
      is_active: isActive,
      size_type: sizeType,
    });
    if (!basic.ok) {
      setSaving(false);
      showToast(basic.error, true);
      return;
    }
    const variantRows = matrix.map((m) => {
      const r = getRow(m.color, m.size);
      return {
        color: m.color,
        color_hex: m.color_hex,
        size: m.size,
        stock_quantity: Math.max(0, parseInt(r.stock, 10) || 0),
        price: r.price.trim() === "" ? null : Number(r.price),
        sku: r.sku.trim() === "" ? null : r.sku.trim(),
        is_active: r.active,
      };
    });
    const saved = await saveVariantsAction(product.id, {
      colors: effectiveColors,
      sizes: effectiveSizes,
      size_type: sizeType,
      rows: variantRows,
    });
    setSaving(false);
    if (!saved.ok) {
      showToast(saved.error, true);
      return;
    }
    setDirty(false);
    const parts = [
      formatAr(ar.products.editor.saved, { n: variantRows.length }),
      saved.deactivated > 0
        ? formatAr(ar.products.editor.deactivatedHistory, {
            n: saved.deactivated,
          })
        : "",
    ]
      .filter(Boolean)
      .join(" ");
    showToast(parts);
    router.refresh();
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX_PRODUCT_IMAGES - orderedImages.length;
    if (room <= 0) {
      showToast(
        formatAr(ar.products.editor.maxImages, { n: MAX_PRODUCT_IMAGES }),
        true
      );
      return;
    }
    const selected = Array.from(files).slice(0, room);
    if (selected.length < files.length) {
      showToast(
        formatAr(ar.products.editor.onlyMoreImages, { n: room }),
        true
      );
    }
    setUploading(true);
    setToast(null);
    let failed = 0;
    for (const file of selected) {
      const form = new FormData();
      form.set("image", file);
      const result = await uploadProductImageAction(product.id, form);
      if (!result.ok) {
        failed += 1;
        showToast(`${file.name}: ${result.error}`, true);
        break;
      }
    }
    setUploading(false);
    if (failed === 0) {
      showToast(ar.products.editor.imagesUploaded);
      router.refresh();
      // Refresh local image list from the server on next render.
      window.location.reload();
    }
  };

  const removeImage = async (id: string) => {
    if (!window.confirm(ar.products.editor.deleteImageConfirm)) return;
    setDeletingId(id);
    const result = await deleteProductImageAction(id);
    setDeletingId(null);
    if (!result.ok) {
      showToast(result.error, true);
      return;
    }
    setImages((prev) => prev.filter((i) => i.id !== id));
    router.refresh();
  };

  // Persist a new order and keep is_primary consistent (index 0 is primary).
  const persistOrder = async (next: typeof images) => {
    setImages(next);
    const reordered = await reorderImagesAction(
      product.id,
      next.map((i) => i.id)
    );
    if (!reordered.ok) {
      showToast(reordered.error, true);
      return;
    }
    if (next[0]) {
      const primary = await setPrimaryImageAction(next[0].id);
      if (!primary.ok) {
        showToast(primary.error, true);
        return;
      }
    }
    router.refresh();
  };

  const reorderImage = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= orderedImages.length) return;
    await persistOrder(moveImage(orderedImages, index, j));
  };

  const makePrimary = async (id: string) => {
    const index = orderedImages.findIndex((i) => i.id === id);
    if (index <= 0) return; // already primary
    await persistOrder(moveImage(orderedImages, index, 0));
  };

  const linkColor = async (id: string, color: string) => {
    const result = await setImageColorAction(id, color || null);
    if (!result.ok) {
      showToast(result.error, true);
      return;
    }
    setImages((prev) =>
      prev.map((i) => (i.id === id ? { ...i, color: color || null } : i))
    );
  };

  const removeProduct = async () => {
    const result = await deleteProductAction(product.id);
    if (!result.ok) {
      showToast(result.error, true);
      return;
    }
    if (result.deactivated) {
      showToast(ar.products.editor.productHasOrders);
      router.refresh();
      return;
    }
    router.push("/admin/products");
  };

  const preset = presetSizesFor(sizeType);

  return (
    <div>
      {toast && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            toastError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"
          }`}
        >
          {toast}
        </div>
      )}

      {/* 1. Basic info */}
      <section className={sectionCls}>
        <h2 className="font-semibold mb-3">{ar.products.editor.basicInfo}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">
              {ar.products.editor.name}
            </label>
            <input
              className={inputCls}
              value={name}
              maxLength={200}
              onChange={(e) => {
                setName(e.target.value);
                setDirty(true);
              }}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">
              {ar.products.editor.description}
            </label>
            <textarea
              className={inputCls}
              value={description}
              rows={3}
              maxLength={5000}
              onChange={(e) => {
                setDescription(e.target.value);
                setDirty(true);
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {ar.products.editor.category}
            </label>
            <input
              className={inputCls}
              value={category}
              maxLength={120}
              onChange={(e) => {
                setCategory(e.target.value);
                setDirty(true);
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {ar.products.editor.brand}
            </label>
            <input
              className={inputCls}
              value={brand}
              maxLength={120}
              onChange={(e) => {
                setBrand(e.target.value);
                setDirty(true);
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {ar.products.editor.basePrice}
            </label>
            <input
              className={inputCls}
              type="number"
              min="0"
              step="0.01"
              value={basePrice}
              onChange={(e) => {
                setBasePrice(e.target.value);
                setDirty(true);
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {ar.products.editor.sizeType}
            </label>
            <select
              className={inputCls}
              value={sizeType}
              onChange={(e) => {
                setSizeType(e.target.value as SizeType);
                setDirty(true);
              }}
            >
              <option value="none">{ar.products.noSizes}</option>
              <option value="clothing">{ar.products.clothing}</option>
              <option value="shoes">{ar.products.shoes}</option>
              <option value="custom">{ar.products.custom}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {ar.products.editor.discountPct}
            </label>
            <input
              className={inputCls}
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={discountPct}
              onChange={(e) => {
                setDiscountPct(e.target.value);
                setDirty(true);
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {ar.products.editor.discountAmt}
            </label>
            <input
              className={inputCls}
              type="number"
              min="0"
              step="0.01"
              value={discountAmt}
              onChange={(e) => {
                setDiscountAmt(e.target.value);
                setDirty(true);
              }}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => {
                setIsActive(e.target.checked);
                setDirty(true);
              }}
            />
            {ar.products.editor.activeVisible}
          </label>
        </div>
        <p className="text-xs text-black/50 mt-2">
          {ar.products.editor.discountNote}
        </p>
      </section>

      {/* 2. Images */}
      <section className={sectionCls}>
        <h2 className="font-semibold mb-1">
          {ar.products.editor.images} ({orderedImages.length}/{MAX_PRODUCT_IMAGES})
        </h2>
        <p className="text-xs text-black/50 mb-3">
          {formatAr(ar.products.editor.imagesHelp, {
            n: MAX_PRODUCT_IMAGES - 1,
          })}
        </p>
        {hasTooManyImages(orderedImages.length) && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 text-amber-800 text-sm">
            {formatAr(ar.products.editor.tooManyImages, {
              count: orderedImages.length,
              max: MAX_PRODUCT_IMAGES,
            })}
          </div>
        )}
        <label
          className={`inline-block px-4 py-2 rounded-lg border border-black/15 text-sm font-medium mb-3 ${
            uploading || imagesFull
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:bg-gray-100"
          }`}
        >
          {uploading
            ? ar.products.editor.uploading
            : imagesFull
              ? ar.products.editor.limitReached
              : ar.products.editor.chooseImages}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            disabled={uploading || imagesFull}
            onChange={(e) => uploadFiles(e.target.files)}
          />
        </label>
        {orderedImages.length === 0 && (
          <p className="text-sm text-black/50">
            {ar.products.editor.noImagesYet}
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {orderedImages.map((img, idx) => (
            <div key={img.id} className="border border-black/10 rounded-lg p-2">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <span
                  className={`absolute top-1 start-1 text-[10px] px-1.5 py-0.5 rounded ${
                    idx === 0
                      ? "bg-black/80 text-white"
                      : "bg-white/85 text-black border border-black/10"
                  }`}
                >
                  {idx === 0 ? ar.products.editor.main : idx + 1}
                </span>
              </div>
              <select
                className="w-full mt-2 px-2 py-1 border border-black/15 rounded text-xs"
                value={img.color ?? ""}
                onChange={(e) => linkColor(img.id, e.target.value)}
                title={ar.products.editor.linkedColor}
              >
                <option value="">{ar.products.editor.allColors}</option>
                {effectiveColors.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1 mt-2">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => makePrimary(img.id)}
                  className="px-2 py-1 text-xs border border-black/15 rounded hover:bg-gray-100 disabled:opacity-40"
                >
                  {ar.products.editor.makeMain}
                </button>
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => reorderImage(idx, -1)}
                  className="px-2 py-1 text-xs border border-black/15 rounded hover:bg-gray-100 disabled:opacity-40"
                  aria-label={ar.products.editor.moveUp}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={idx === orderedImages.length - 1}
                  onClick={() => reorderImage(idx, 1)}
                  className="px-2 py-1 text-xs border border-black/15 rounded hover:bg-gray-100 disabled:opacity-40"
                  aria-label={ar.products.editor.moveDown}
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={deletingId === img.id}
                  onClick={() => removeImage(img.id)}
                  className="px-2 py-1 text-xs rounded bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  {deletingId === img.id ? "…" : ar.common.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Colors */}
      <section className={sectionCls}>
        <h2 className="font-semibold mb-3">{ar.products.editor.colors}</h2>
        <label className="flex items-center gap-2 text-sm mb-3">
          <input
            type="checkbox"
            checked={useColors}
            onChange={(e) => {
              setUseColors(e.target.checked);
              setDirty(true);
            }}
          />
          {ar.products.editor.hasColors}
        </label>
        {useColors && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {colors.map((c, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 ps-2 pe-1 py-1 border border-black/15 rounded-full text-sm"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <input
                    value={c.name}
                    maxLength={60}
                    aria-label={`${ar.common.name} ${idx + 1}`}
                    onChange={(e) => renameColorAt(idx, e.target.value)}
                    className="w-24 bg-transparent outline-none"
                  />
                  <button
                    type="button"
                    aria-label={`${ar.common.delete} ${idx + 1}`}
                    onClick={() => removeColorAt(idx)}
                    className="px-1 text-black/50 hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
              {colors.length === 0 && (
                <span className="text-sm text-black/50">
                  {ar.products.editor.noColorsYet}
                </span>
              )}
            </div>

            <p className="text-xs font-medium mb-2">
              {ar.products.editor.quickPalette}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {COMMON_COLORS.map((c) => {
                const exists = colors.some(
                  (x) => x.name.toLowerCase() === c.en.toLowerCase()
                );
                return (
                  <button
                    key={c.en}
                    type="button"
                    title={`${c.en} / ${c.ar}`}
                    aria-label={`${ar.products.editor.addColor} ${c.en} (${c.ar})`}
                    onClick={() => addColor(c.en, c.hex)}
                    className={`h-7 w-7 rounded-full border ${
                      exists
                        ? "border-black ring-2 ring-black/30"
                        : "border-black/20 hover:scale-110 transition-transform"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  {ar.common.name}
                </label>
                <input
                  className="px-3 py-2 border border-black/15 rounded-lg text-sm w-36"
                  value={newColorName}
                  maxLength={60}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="أحمر"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  {ar.products.editor.hex}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    className={`px-3 py-2 border rounded-lg text-sm w-28 font-mono ${
                      isValidHex(newColorHex)
                        ? "border-black/15"
                        : "border-red-400"
                    }`}
                    value={newColorHex}
                    maxLength={7}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    placeholder="#RRGGBB"
                  />
                  <input
                    type="color"
                    aria-label={ar.products.editor.pickColor}
                    className="h-10 w-12 border border-black/15 rounded-lg"
                    value={
                      isValidHex(newColorHex)
                        ? normalizeHex(newColorHex) ?? "#000000"
                        : "#000000"
                    }
                    onChange={(e) => setNewColorHex(e.target.value.toUpperCase())}
                  />
                  <span
                    className="w-9 h-9 rounded-full border border-black/20 shrink-0"
                    style={{
                      backgroundColor: isValidHex(newColorHex)
                        ? normalizeHex(newColorHex) ?? "#FFFFFF"
                        : "#FFFFFF",
                    }}
                    aria-hidden="true"
                  />
                </div>
                {!isValidHex(newColorHex) && (
                  <p className="text-xs text-red-500 mt-1">
                    {ar.products.editor.invalidHex}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={!newColorName.trim() || !isValidHex(newColorHex)}
                onClick={addCustomColor}
                className="px-4 py-2 rounded-lg border border-black/15 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ar.products.editor.addColor}
              </button>
            </div>
          </>
        )}
      </section>

      {/* 4. Sizes */}
      <section className={sectionCls}>
        <h2 className="font-semibold mb-3">{ar.products.editor.sizes}</h2>
        {sizeType === "none" ? (
          <p className="text-sm text-black/50">
            {ar.products.editor.noSizesNotice}
          </p>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm mb-3">
              <input
                type="checkbox"
                checked={useSizes}
                onChange={(e) => {
                  setUseSizes(e.target.checked);
                  setDirty(true);
                }}
              />
              {formatAr(ar.products.editor.hasSizes, { type: sizeType })}
            </label>
            {useSizes && preset.length > 0 && (
              <>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs text-black/50">
                    {ar.products.editor.tapToSelect}
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSizes((prev) =>
                          Array.from(new Set([...prev, ...preset]))
                        );
                        setDirty(true);
                      }}
                      className="text-xs px-2.5 py-1 border border-black/15 rounded-full hover:bg-gray-100"
                    >
                      {ar.products.editor.selectAll}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSizes((prev) =>
                          prev.filter((s) => !preset.includes(s))
                        );
                        setDirty(true);
                      }}
                      className="text-xs px-2.5 py-1 border border-black/15 rounded-full hover:bg-gray-100"
                    >
                      {ar.products.editor.clear}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {preset.map((s) => {
                    const on = sizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          setSizes((prev) =>
                            on ? prev.filter((x) => x !== s) : [...prev, s]
                          );
                          setDirty(true);
                        }}
                        className={`min-w-[3rem] px-3 py-1.5 rounded-full text-sm border font-medium transition-colors ${
                          on
                            ? "bg-black text-white border-black"
                            : "bg-white border-black/15 text-black/70 hover:bg-gray-100"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            {useSizes && sizeType === "custom" && (
              <div className="flex items-end gap-2 mb-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    {ar.products.editor.customSize}
                  </label>
                  <input
                    className="px-3 py-2 border border-black/15 rounded-lg text-sm w-40"
                    value={customSize}
                    maxLength={20}
                    onChange={(e) => setCustomSize(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const s = customSize.trim();
                        if (!s || sizes.includes(s)) return;
                        setSizes((prev) => [...prev, s]);
                        setCustomSize("");
                        setDirty(true);
                      }
                    }}
                    placeholder={ar.products.editor.customSizePlaceholder}
                  />
                </div>
                <button
                  type="button"
                  disabled={!customSize.trim()}
                  onClick={() => {
                    const s = customSize.trim();
                    if (!s || sizes.includes(s)) return;
                    setSizes((prev) => [...prev, s]);
                    setCustomSize("");
                    setDirty(true);
                  }}
                  className="px-4 py-2 rounded-lg border border-black/15 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ar.products.editor.addSize}
                </button>
              </div>
            )}
            {useSizes && sizes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-xs text-black/50 w-full mb-1">
                  {formatAr(ar.products.editor.selected, { n: sizes.length })}
                </span>
                {sizes
                  .filter((s) => sizeType === "custom" || !preset.includes(s))
                  .map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-sm"
                    >
                      {s}
                      <button
                        type="button"
                        aria-label={`${ar.common.delete} ${s}`}
                        onClick={() => {
                          setSizes((prev) => prev.filter((x) => x !== s));
                          setDirty(true);
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                {sizeType !== "custom" && (
                  <span className="text-xs text-black/50 w-full mt-1">
                    {sizes.filter((s) => preset.includes(s)).join(", ") ||
                      ar.products.editor.noneSelected}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* 5. Variants / stock */}
      <section className={sectionCls}>
        <h2 className="font-semibold mb-1">
          {ar.products.editor.variants} ({matrix.length})
        </h2>
        <p className="text-xs text-black/50 mb-3">
          {ar.products.editor.generatedFrom}
          {removedWithHistory.length > 0 && (
            <span className="text-amber-700 font-medium">
              {" "}
              {ar.products.editor.removingDeactivates}
            </span>
          )}
        </p>
        <div className="flex items-end gap-2 mb-3">
          <div>
            <label className="block text-xs font-medium mb-1">
              {ar.products.editor.setStockAll}
            </label>
            <input
              className="px-3 py-2 border border-black/15 rounded-lg text-sm w-28"
              type="number"
              min="0"
              value={bulkStock}
              onChange={(e) => setBulkStock(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const v = Math.max(0, parseInt(bulkStock, 10) || 0);
              setRows((prev) => {
                const next = new Map(prev);
                for (const m of matrix) {
                  next.set(rowKey(m.color, m.size), {
                    ...getRow(m.color, m.size),
                    stock: String(v),
                  });
                }
                return next;
              });
              setDirty(true);
            }}
            className="px-4 py-2 rounded-lg border border-black/15 text-sm font-medium hover:bg-gray-100"
          >
            {ar.products.editor.apply}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-black/10 text-start text-black/60">
                <th className="py-2 font-medium text-start">{ar.common.color}</th>
                <th className="py-2 font-medium text-start">{ar.common.size}</th>
                <th className="py-2 font-medium text-start">{ar.common.stock}</th>
                <th className="py-2 font-medium text-start">{ar.products.editor.priceOverride}</th>
                <th className="py-2 font-medium text-start">{ar.common.sku}</th>
                <th className="py-2 font-medium text-start">{ar.products.editor.active}</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((m) => {
                const r = getRow(m.color, m.size);
                const k = rowKey(m.color, m.size);
                return (
                  <tr key={k} className="border-b border-black/5">
                    <td className="py-2 pe-2">{m.color ?? "—"}</td>
                    <td className="py-2 pe-2">{m.size ?? "—"}</td>
                    <td className="py-2 pe-2">
                      <input
                        type="number"
                        min="0"
                        max="100000"
                        value={r.stock}
                        onChange={(e) => setRow(m.color, m.size, { stock: e.target.value })}
                        className="w-20 px-2 py-1 border border-black/15 rounded text-sm"
                      />
                    </td>
                    <td className="py-2 pe-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={ar.products.basePrice}
                        value={r.price}
                        onChange={(e) => setRow(m.color, m.size, { price: e.target.value })}
                        className="w-24 px-2 py-1 border border-black/15 rounded text-sm"
                      />
                    </td>
                    <td className="py-2 pe-2">
                      <input
                        value={r.sku}
                        maxLength={64}
                        onChange={(e) => setRow(m.color, m.size, { sku: e.target.value })}
                        className="w-28 px-2 py-1 border border-black/15 rounded text-sm"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="checkbox"
                        checked={r.active}
                        onChange={(e) =>
                          setRow(m.color, m.size, { active: e.target.checked })
                        }
                      />
                    </td>
                  </tr>
                );
              })}
              {matrix.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-black/50">
                    {ar.products.editor.noVariants}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={saveAll}
          className="px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-black/80 disabled:opacity-50"
        >
          {saving ? ar.common.saving : ar.products.editor.saveAll}
        </button>
        <Link
          href={`/shop/product/${product.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2.5 rounded-full border border-black/15 text-sm font-medium hover:bg-gray-100"
        >
          {ar.products.editor.previewPage}
        </Link>
        {!isActive && (
          <span className="text-xs text-black/50">
            {ar.products.editor.previewInactive}
          </span>
        )}
        {dirty && !saving && (
          <span className="text-xs text-amber-700">
            {ar.products.editor.unsaved}
          </span>
        )}
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2.5 rounded-full bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100"
          >
            {ar.products.editor.deleteProduct}
          </button>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm">
            <span>{ar.products.editor.deletePrompt}</span>
            <button
              type="button"
              onClick={removeProduct}
              className="px-4 py-2 rounded-full bg-red-600 text-white text-sm font-medium"
            >
              {ar.products.editor.confirmDelete}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 rounded-full border border-black/15 text-sm"
            >
              {ar.common.cancel}
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

