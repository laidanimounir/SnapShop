import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-40 px-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Page not found</h1>
      <p className="text-black/60 mb-6">
        The page you are looking for doesn&apos;t exist.
      </p>
      <Button asChild className="rounded-full">
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );
}
