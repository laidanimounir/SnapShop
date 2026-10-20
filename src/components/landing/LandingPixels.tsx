import {
  facebookPixelScript,
  resolveLandingPixels,
  tiktokPixelScript,
} from "@/lib/landing/pixels";

// Base pixel code for a published landing page only. Rendered inside the
// page so the snippets run before the sections become interactive.
export default function LandingPixels({
  facebookPixelId,
  tiktokPixelId,
}: {
  facebookPixelId: string | null;
  tiktokPixelId: string | null;
}) {
  const ids = resolveLandingPixels({ facebookPixelId, tiktokPixelId });
  if (!ids.facebook && !ids.tiktok) return null;

  return (
    <>
      {ids.facebook && (
        <script
          dangerouslySetInnerHTML={{
            __html: facebookPixelScript(ids.facebook),
          }}
        />
      )}
      {ids.tiktok && (
        <script
          dangerouslySetInnerHTML={{ __html: tiktokPixelScript(ids.tiktok) }}
        />
      )}
    </>
  );
}
