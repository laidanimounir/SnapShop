"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-40 px-4 text-center">
      <p className="text-black/60 mb-4">Something went wrong loading this page.</p>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-full bg-black text-white hover:bg-black/80 transition-all"
      >
        Try again
      </button>
    </div>
  );
}
