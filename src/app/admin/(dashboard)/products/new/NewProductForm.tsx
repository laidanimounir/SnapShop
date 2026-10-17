"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProductAction } from "@/app/admin/actions";

const inputCls =
  "w-full px-3 py-2 border border-black/15 rounded-lg text-sm";

export default function NewProductForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [basePrice, setBasePrice] = useState("0");
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
        <label className="block text-sm font-medium mb-1">Name *</label>
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={200}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
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
          <label className="block text-sm font-medium mb-1">Category</label>
          <input
            className={inputCls}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            maxLength={120}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Brand</label>
          <input
            className={inputCls}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            maxLength={120}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Base price *</label>
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
          <label className="block text-sm font-medium mb-1">Size type</label>
          <select
            className={inputCls}
            value={sizeType}
            onChange={(e) => setSizeType(e.target.value)}
          >
            <option value="none">No sizes</option>
            <option value="clothing">Clothing (XS-XXL)</option>
            <option value="shoes">Shoes (35-47)</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-black/80 disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create draft and continue"}
      </button>
    </form>
  );
}
