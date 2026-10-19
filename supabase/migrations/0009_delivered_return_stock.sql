-- 0009: delivered -> returned restores stock
--
-- The application (src/lib/admin/order-transitions.ts) now allows
-- delivered -> returned, but restore_stock_on_cancel() only restored
-- from pending/confirmed/no_answer/shipped, so returning goods after
-- delivery leaked stock. delivered -> cancelled stays disallowed in
-- the app (the customer received the goods), and the trigger keeps
-- restoring at most once via the OLD.status guard.
--
-- Reopening cancelled/returned remains forbidden, unchanged.

create or replace function public.restore_stock_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Terminal states cannot be reopened (they already restored stock).
  if OLD.status in ('cancelled', 'returned')
     and NEW.status is distinct from OLD.status then
    raise exception '% orders cannot be reopened', OLD.status;
  end if;

  -- Restore once, only from stock-holding states. delivered was
  -- added in 0009: goods returned after delivery go back into
  -- stock. The OLD.status guard makes the restore happen at most
  -- once.
  if NEW.status in ('cancelled', 'returned')
     and OLD.status in ('pending', 'confirmed', 'no_answer', 'shipped', 'delivered') then
    update public.product_variants pv
    set stock_quantity = pv.stock_quantity + oi.quantity
    from public.order_items oi
    where oi.order_id = NEW.id
      and oi.product_variant_id = pv.id;
  end if;

  return NEW;
end;
$$;

-- Grants/owner are preserved by create or replace (same signature).
