import {
  STATUS_BADGE_CLASSES,
  isOrderStatus,
} from "@/lib/admin/order-transitions";
import { statusLabelAr } from "@/lib/admin/i18n-ar";
import { cn } from "@/lib/utils";

export default function StatusBadge({ status }: { status: string }) {
  const known = isOrderStatus(status);
  const classes = known
    ? STATUS_BADGE_CLASSES[status]
    : "bg-gray-100 text-gray-700";

  return (
    <span
      className={cn(
        "inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap",
        classes
      )}
    >
      {statusLabelAr(status)}
    </span>
  );
}
