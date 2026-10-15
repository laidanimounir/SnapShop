-- ============================================================
-- SnapShop - DEV DEMO seed (NOT a migration, never auto-run)
-- Run ONCE manually via the SQL editor / execute_sql, then delete
-- the rows with supabase/cleanup_dev_demo.sql when done.
-- Every product: brand = 'DEMO', description starts with '[DEMO]'.
-- Images reference local files under /public/images (verified present).
-- Idempotency: aborts if any DEMO rows already exist.
-- ============================================================

DO $$
DECLARE
  p1 uuid; p2 uuid; p3 uuid; p4 uuid;
  p5 uuid; p6 uuid; p7 uuid; p8 uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.products WHERE brand = 'DEMO') THEN
    RAISE EXCEPTION 'DEMO seed already applied (brand = DEMO rows exist)';
  END IF;

  -- ---- 8 products ----
  INSERT INTO public.products (name, description, category, brand, base_price, discount_percentage, is_active)
  VALUES ('Classic White Tee', '[DEMO] Plain white cotton tee for store demo.', 'T-Shirts', 'DEMO', 25.00, 10, true)
  RETURNING id INTO p1;

  INSERT INTO public.products (name, description, category, brand, base_price, discount_amount, is_active)
  VALUES ('Denim Jacket', '[DEMO] Blue denim jacket for store demo.', 'Jackets', 'DEMO', 89.99, 15, true)
  RETURNING id INTO p2;

  INSERT INTO public.products (name, description, category, brand, base_price, is_active)
  VALUES ('Summer Dress', '[DEMO] Light summer dress for store demo.', 'Dresses', 'DEMO', 59.50, true)
  RETURNING id INTO p3;

  INSERT INTO public.products (name, description, category, brand, base_price, discount_percentage, is_active)
  VALUES ('Fleece Hoodie', '[DEMO] Warm fleece hoodie for store demo.', 'Hoodies', 'DEMO', 45.00, 20, true)
  RETURNING id INTO p4;

  INSERT INTO public.products (name, description, category, brand, base_price, discount_amount, is_active)
  VALUES ('Chino Pants', '[DEMO] Classic chino pants for store demo.', 'Pants', 'DEMO', 55.00, 5, true)
  RETURNING id INTO p5;

  INSERT INTO public.products (name, description, category, brand, base_price, is_active)
  VALUES ('Polo Shirt', '[DEMO] Cotton polo shirt for store demo.', 'T-Shirts', 'DEMO', 35.00, true)
  RETURNING id INTO p6;

  INSERT INTO public.products (name, description, category, brand, base_price, discount_percentage, is_active)
  VALUES ('Winter Coat', '[DEMO] INACTIVE winter coat (must never be orderable).', 'Jackets', 'DEMO', 149.99, 15, false)
  RETURNING id INTO p7;

  INSERT INTO public.products (name, description, category, brand, base_price, discount_amount, is_active)
  VALUES ('Linen Shirt', '[DEMO] Breathable linen shirt for store demo.', 'Shirts', 'DEMO', 49.00, 7, true)
  RETURNING id INTO p8;

  -- ---- images (2-3 each, local /public/images files) ----
  INSERT INTO public.product_images (product_id, url, alt_text, position, is_primary) VALUES
    (p1, '/images/pic1.png', '[DEMO] white tee front', 0, true),
    (p1, '/images/pic2.png', '[DEMO] white tee back', 1, false),
    (p2, '/images/pic3.png', '[DEMO] denim jacket front', 0, true),
    (p2, '/images/pic4.png', '[DEMO] denim jacket detail', 1, false),
    (p2, '/images/pic5.png', '[DEMO] denim jacket back', 2, false),
    (p3, '/images/dress-style-1.png', '[DEMO] summer dress', 0, true),
    (p3, '/images/dress-style-2.png', '[DEMO] summer dress alt', 1, false),
    (p4, '/images/pic6.png', '[DEMO] hoodie front', 0, true),
    (p4, '/images/pic7.png', '[DEMO] hoodie back', 1, false),
    (p5, '/images/pic8.png', '[DEMO] chino front', 0, true),
    (p5, '/images/pic9.png', '[DEMO] chino detail', 1, false),
    (p6, '/images/pic10.png', '[DEMO] polo front', 0, true),
    (p6, '/images/pic11.png', '[DEMO] polo detail', 1, false),
    (p7, '/images/pic12.png', '[DEMO] winter coat', 0, true),
    (p7, '/images/pic13.png', '[DEMO] winter coat alt', 1, false),
    (p8, '/images/pic14.png', '[DEMO] linen shirt front', 0, true),
    (p8, '/images/pic15.png', '[DEMO] linen shirt detail', 1, false),
    (p8, '/images/dress-style-3.png', '[DEMO] linen shirt alt', 2, false);

  -- ---- variants (2-4 each, stock 5-20) ----
  INSERT INTO public.product_variants (product_id, color, size, stock_quantity) VALUES
    (p1, 'White', 'S', 10),
    (p1, 'White', 'M', 15),
    (p1, 'White', 'L', 20),
    (p2, 'Blue', 'M', 8),
    (p2, 'Blue', 'L', 12),
    (p2, 'Black', 'M', 5),
    (p3, 'Red', 'S', 10),
    (p3, 'Red', 'M', 7),
    (p4, 'Gray', 'S', 6),
    (p4, 'Gray', 'M', 9),
    (p4, 'Gray', 'L', 11),
    (p4, 'Navy', 'M', 8),
    (p5, 'Beige', '32', 10),
    (p5, 'Beige', '34', 12),
    (p5, 'Olive', '32', 5),
    (p6, 'Green', 'M', 14),
    (p6, 'White', 'L', 9),
    (p7, 'Black', 'L', 6),
    (p7, 'Camel', 'M', 4),
    (p8, 'Sand', 'M', 10),
    (p8, 'Sand', 'L', 8),
    (p8, 'White', 'M', 12);

  -- ---- 3 approved reviews (rating trigger updates products.rating) ----
  INSERT INTO public.reviews (product_id, reviewer_name, rating, comment, is_approved) VALUES
    (p1, 'Demo Reviewer One', 5, '[DEMO] Great tee, fits perfectly.', true),
    (p1, 'Demo Reviewer Two', 4, '[DEMO] Good quality for the price.', true),
    (p2, 'Demo Reviewer Three', 5, '[DEMO] Excellent jacket.', true);
END $$;
