-- SnapShop - temporary test/seed data (safe to clear later)
do $$
declare
  pid uuid;
begin
  -- 1) T-shirt with Tape Details (no discount)
  insert into public.products (name, description, category, brand, base_price, discount_percentage, is_active)
  values ('T-shirt with Tape Details', 'A comfortable cotton t-shirt with tape details on the sleeves.', 't-shirts', 'SnapShop', 120, 0, true)
  returning id into pid;
  insert into public.product_images (product_id, url, position, is_primary) values
    (pid, '/images/pic1.png', 0, true),
    (pid, '/images/pic10.png', 1, false),
    (pid, '/images/pic11.png', 2, false);
  insert into public.product_variants (product_id, color, color_hex, size, price, stock_quantity, sku) values
    (pid, 'Red', '#dc2626', 'S', null, 10, 'TAPE-RED-S'),
    (pid, 'Red', '#dc2626', 'M', null, 8, 'TAPE-RED-M'),
    (pid, 'Red', '#dc2626', 'L', null, 5, 'TAPE-RED-L'),
    (pid, 'Green', '#16a34a', 'M', null, 0, 'TAPE-GRN-M'),
    (pid, 'Blue', '#2563eb', 'L', null, 7, 'TAPE-BLU-L');

  -- reviews for product 1
  insert into public.reviews (product_id, reviewer_name, rating, comment, is_approved) values
    (pid, 'Alex K.', 5, 'Great quality, exactly as pictured.', true),
    (pid, 'Sarah M.', 4, 'Nice fit, slightly large.', true),
    (pid, 'Liam K.', 5, 'Soft fabric and a great print.', true);

  -- 2) Skinny Fit Jeans (20% off)
  insert into public.products (name, description, category, brand, base_price, discount_percentage, is_active)
  values ('Skinny Fit Jeans', 'Stretch denim skinny fit jeans.', 'jeans', 'SnapShop', 260, 20, true)
  returning id into pid;
  insert into public.product_images (product_id, url, position, is_primary) values
    (pid, '/images/pic2.png', 0, true);
  insert into public.product_variants (product_id, color, color_hex, size, price, stock_quantity, sku) values
    (pid, 'Blue', '#2563eb', 'S', null, 12, 'JEAN-BLU-S'),
    (pid, 'Blue', '#2563eb', 'M', null, 15, 'JEAN-BLU-M'),
    (pid, 'Blue', '#2563eb', 'L', null, 9, 'JEAN-BLU-L');

  -- 3) Checkered Shirt (fixed-amount discount: DA 30)
  insert into public.products (name, description, category, brand, base_price, discount_amount, is_active)
  values ('Checkered Shirt', 'Classic checkered button-up shirt.', 'shirts', 'SnapShop', 180, 30, true)
  returning id into pid;
  insert into public.product_images (product_id, url, position, is_primary) values
    (pid, '/images/pic3.png', 0, true);
  insert into public.product_variants (product_id, color, color_hex, size, price, stock_quantity, sku) values
    (pid, 'Red', '#dc2626', 'M', null, 6, 'CHK-RED-M'),
    (pid, 'Red', '#dc2626', 'L', null, 4, 'CHK-RED-L'),
    (pid, 'Green', '#16a34a', 'L', null, 2, 'CHK-GRN-L');

  -- 4) Sleeve Striped T-shirt (30% off)
  insert into public.products (name, description, category, brand, base_price, discount_percentage, is_active)
  values ('Sleeve Striped T-shirt', 'T-shirt with striped sleeves.', 't-shirts', 'SnapShop', 160, 30, true)
  returning id into pid;
  insert into public.product_images (product_id, url, position, is_primary) values
    (pid, '/images/pic4.png', 0, true),
    (pid, '/images/pic10.png', 1, false),
    (pid, '/images/pic11.png', 2, false);
  insert into public.product_variants (product_id, color, color_hex, size, price, stock_quantity, sku) values
    (pid, 'Blue', '#2563eb', 'S', null, 20, 'SS-BLU-S'),
    (pid, 'Blue', '#2563eb', 'M', null, 18, 'SS-BLU-M'),
    (pid, 'Blue', '#2563eb', 'L', null, 10, 'SS-BLU-L'),
    (pid, 'Blue', '#2563eb', 'XL', null, 6, 'SS-BLU-XL'),
    (pid, 'Black', '#000000', 'M', null, 14, 'SS-BLK-M'),
    (pid, 'Black', '#000000', 'L', null, 8, 'SS-BLK-L');

  -- 5) Gradient Graphic T-shirt (no discount)
  insert into public.products (name, description, category, brand, base_price, is_active)
  values ('Gradient Graphic T-shirt', 'T-shirt with a gradient graphic print.', 't-shirts', 'SnapShop', 145, true)
  returning id into pid;
  insert into public.product_images (product_id, url, position, is_primary) values
    (pid, '/images/pic13.png', 0, true);
  insert into public.product_variants (product_id, color, color_hex, size, price, stock_quantity, sku) values
    (pid, 'Green', '#16a34a', 'M', null, 5, 'GRAD-GRN-M'),
    (pid, 'Green', '#16a34a', 'L', null, 3, 'GRAD-GRN-L'),
    (pid, 'Blue', '#2563eb', 'L', null, 11, 'GRAD-BLU-L'),
    (pid, 'Blue', '#2563eb', 'XL', null, 4, 'GRAD-BLU-XL');
end;
$$;
