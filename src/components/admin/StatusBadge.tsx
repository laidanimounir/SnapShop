import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  isOrderStatus,
} from "@/lib/admin/order-transitions";
import { cn } from "@/lib/utils";

export default function StatusBadge({ status }: { status: string }) {
  const known = isOrderStatus(status);
  const label = known ? STATUS_LABELS[status] : status.replace(/_/g, " ");
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
      {label}
    </span>
  );
}
