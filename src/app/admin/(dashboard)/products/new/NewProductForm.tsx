"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProductAction } from "@/app/admin/actions";
import { ar } from "@/lib/admin/i18n-ar";

const inputCls =
  "w-full px-3 py-2 border border-black/15 rounded-lg text-sm";

export default function NewProductForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [basePrice, setBasePrice] = useState("0");
  const [oldPrice, setOldPrice] = useState("");
  const [sizeType, setSizeType] = useState("none");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await createProductAction({
      name,
      description,
      category: category || null,
      brand: brand || null,
      base_price: Number(basePrice),
      compare_at_price: oldPrice.trim() === "" ? null : Number(oldPrice),
      is_active: false,
      size_type: sizeType as "none" | "clothing" | "shoes" | "custom",
    });
    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }
    router.push(`/admin/products/${result.id}/edit`);
  };

  return (
    <form onSubmit={submit} className="bg-white border border-black/10 rounded-lg p-5 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          {ar.products.nameRequired}
        </label>
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={200}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          {ar.common.description}
        </label>
        <textarea
          className={inputCls}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={5000}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {ar.common.category}
          </label>
          <input
            className={inputCls}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            maxLength={120}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {ar.common.brand}
          </label>
          <input
            className={inputCls}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            maxLength={120}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {ar.products.basePriceRequired}
          </label>
          <input
            className={inputCls}
            type="number"
            min="0"
            step="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {ar.products.oldPrice}
          </label>
          <input
            className={inputCls}
            type="number"
            min="0"
            step="0.01"
            value={oldPrice}
            placeholder={ar.products.oldPriceHint}
            onChange={(e) => setOldPrice(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {ar.products.sizeType}
          </label>
          <select
            className={inputCls}
            value={sizeType}
            onChange={(e) => setSizeType(e.target.value)}
          >
            <option value="none">{ar.products.noSizes}</option>
            <option value="clothing">{ar.products.clothing}</option>
            <option value="shoes">{ar.products.shoes}</option>
            <option value="custom">{ar.products.custom}</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-black/80 disabled:opacity-50"
      >
        {busy ? ar.products.creating : ar.products.createDraft}
      </button>
    </form>
  );
}
