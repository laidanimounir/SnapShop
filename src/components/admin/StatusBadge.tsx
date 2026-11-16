import {
  STATUS_BADGE_CLASSES,
  isOrderStatus,
} from "@/lib/admin/order-transitions";
import { statusLabelAr } from "@/lib/admin/i18n-ar";
import { cn } from "@/lib/utils";
import { Dot } from "lucide-react";

export default function StatusBadge({ status }: { status: string }) {
  const known = isOrderStatus(status);
  const classes = known
    ? STATUS_BADGE_CLASSES[status]
    : "bg-admin-muted text-admin-muted-foreground dark:bg-admin-muted dark:text-admin-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex h-5 items-center justify-center gap-1.5 rounded-full border border-transparent px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
        classes
      )}
    >
      <Dot className="size-1.5" />
      {statusLabelAr(status)}
    </span>
  );
}
