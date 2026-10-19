"use client";

import { useRef, useState } from "react";

import { uploadLandingAssetAction } from "@/app/admin/landing-actions";
import { ar } from "@/lib/admin/i18n-ar";

const buttonCls =
  "px-3 py-1.5 rounded-lg border border-black/15 text-xs hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent";

// Uploads one image for this landing page and hands the public URL back to
// the field that renders it. The URL input stays editable, so pasting an
// external https link still works.
export function ImageUploadButton({
  pageId,
  onUploaded,
  label,
}: {
  pageId: string;
  onUploaded: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file || uploading) return;
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const result = await uploadLandingAssetAction(pageId, form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onUploaded(result.url);
    } catch {
      setError(ar.messages.generic);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || !pageId}
        className={buttonCls}
      >
        {uploading
          ? ar.landing.fields.uploading
          : (label ?? ar.landing.fields.uploadImage)}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && (
        <p role="alert" className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
