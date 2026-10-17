import Link from "next/link";
import { getAdminReviews } from "@/lib/api/admin";
import { setReviewApproved } from "@/app/admin/actions";
import { ar } from "@/lib/admin/i18n-ar";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filter = searchParams.filter as string | undefined;
  const reviews = await getAdminReviews(filter as "pending" | "approved" | undefined);

  const tabClass = (active: boolean) =>
    cn(
      "px-4 py-1.5 rounded-full text-sm font-medium",
      active ? "bg-black text-white" : "bg-white border border-black/10 text-black/60"
    );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{ar.reviews.title}</h1>

      <div className="flex gap-2 mb-4">
        <Link href="/admin/reviews" className={tabClass(!filter)}>
          {ar.reviews.all}
        </Link>
        <Link href="/admin/reviews?filter=pending" className={tabClass(filter === "pending")}>
          {ar.reviews.pending}
        </Link>
        <Link href="/admin/reviews?filter=approved" className={tabClass(filter === "approved")}>
          {ar.reviews.approved}
        </Link>
      </div>

      <div className="bg-white border border-black/10 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-start text-black/60">
              <th className="px-4 py-3 font-medium text-start">{ar.reviews.product}</th>
              <th className="px-4 py-3 font-medium text-start">{ar.reviews.reviewer}</th>
              <th className="px-4 py-3 font-medium text-start">{ar.reviews.rating}</th>
              <th className="px-4 py-3 font-medium text-start">{ar.reviews.comment}</th>
              <th className="px-4 py-3 font-medium text-start">{ar.reviews.date}</th>
              <th className="px-4 py-3 font-medium text-start">{ar.reviews.status}</th>
              <th className="px-4 py-3 font-medium text-start">{ar.reviews.action}</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="border-b border-black/5 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${review.product_id}`}
                    className="underline underline-offset-2"
                  >
                    {review.product_name}
                  </Link>
                </td>
                <td className="px-4 py-3">{review.reviewer_name}</td>
                <td className="px-4 py-3">{review.rating}/5</td>
                <td className="px-4 py-3 max-w-xs truncate text-black/70">
                  {review.comment ?? "-"}
                </td>
                <td className="px-4 py-3 text-black/60">
                  {new Date(review.created_at).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      review.is_approved
                        ? "px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                        : "px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800"
                    }
                  >
                    {review.is_approved
                      ? ar.reviews.approvedLabel
                      : ar.reviews.pendingLabel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <form action={setReviewApproved.bind(null, review.id)}>
                    <input
                      type="hidden"
                      name="is_approved"
                      value={String(!review.is_approved)}
                    />
                    <button
                      type="submit"
                      className={
                        review.is_approved
                          ? "px-3 py-1 rounded-full text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50"
                          : "px-3 py-1 rounded-full text-xs font-medium bg-black text-white hover:bg-black/80"
                      }
                    >
                      {review.is_approved ? ar.reviews.reject : ar.reviews.approve}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-black/50">
                  {ar.reviews.noReviews}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
