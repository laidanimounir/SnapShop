# تقرير ليلة العمل — صفحة المنتج (overnight/product-page)

## 1. الخلاصة

- جاهز: 48 مهمة من أصل 50 برسائل كمّيتر مطابقة حرفيًا، والصفحة تعمل على الجوال والحاسوب، وكل الفحوصات خضراء.
- بناء المشروع (npm run build) نجح 26/26 صفحة، والاختبارات 333/333، وtypecheck وlint بدون أي خطأ.
- ليس جاهزاً للإنتاج حتى تطبّق 5 ملفات قاعدة بيانات (0015 إلى 0019) وتفعّل علم `NEXT_PUBLIC_ENABLE_OFFERS` — الموقع يعمل الآن بدونها بأمان.
- تم تخطّي مهمة 50 (rate limiting) كما سمح التوجيه، ووضعت الخيارات لقرارك في القسم 4.
- لم أغيّر أي بيانات حيّة ولم أطبّق أي migration — كل شيء جاهز للمراجعة والتطبيق اليدوي صباحاً.

## 2. جدول المهام

الرسالة = الرسالة الدقيقة للكمّيتر في git.

| # | الرسالة (commit message) | الحالة | ملاحظة |
|---|---|---|---|
| 1 | Show a placeholder image when a product has no photos | DONE | صورة بديلة عند غياب الصور |
| 2 | Return 404 instead of 500 for invalid product ids | DONE | id غير uuid → 404 |
| 3 | Hide the empty 0.0 rating row when a product has no reviews | DONE | لا يظهر تقييم 0.0 |
| 4 | Show review count next to the rating | DONE | عدّاد المراجعات |
| 5 | Replace the sticky bar dash with the subtotal until a wilaya is picked | DONE | مجموع السلة بدل الشَّرطة |
| 6 | Remove the placeholder FAQ and replace it with real delivery and returns info | DONE | أسئلة حقيقية (توصيل/إرجاع) |
| 7 | Cache the product query so it only runs once per request | DONE | cache() على استعلام المنتج |
| 8 | Add sizes to the main product image | DONE | دمج الأحجام في صورة المنتج |
| 9 | Add a preview page button in the admin product editor | DONE | زر معاينة في لوحة التحكم |
| 10 | Add a public reader for the store pixel settings | DONE | قراءة pixel_id بدون مفتاح service — migration 0019 |
| 11 | Inject the Facebook and TikTok pixel in the root layout | DONE | حقن السكربت في layout، بدون كوكيز |
| 12 | Fire ViewContent with product id and price on the product page | DONE | حدث العرض بالسعر الحقيقي |
| 13 | Fire InitiateCheckout when the order is submitted | DONE | عند الضغط على إتمام الطلب |
| 14 | Fire Purchase with the real order total after success | DONE | مع event_id = رقم الطلب للدمج |
| 15 | Add compare_at_price column to products | DONE | migration 0015 (غير مطبّق) |
| 16 | Add the old price field to the admin product form | DONE | حقل السعر القديم في اللوحة |
| 17 | Validate that the old price is higher than the real price | DONE | التحقق في الاستمارة |
| 18 | Show the struck old price and savings badge on the product page | DONE | السعر مشطوب + شارة التوفير |
| 19 | Stop using percentage and amount discounts on the product page | DONE | صفحة المنتج تعرض base_price فقط |
| 20 | Update the order RPC to charge the real price only | NO CHANGE NEEDED | RPC يخصم base_price أصلاً؛ الحقول القديمة للعرض فقط ولم تُمسّ |
| 21 | Add product_quantity_offers table with RLS | DONE | migration 0016 (غير مطبّق) |
| 22 | Add the quantity offers card to the admin product editor | DONE | بطاقة العروض في اللوحة |
| 23 | Add save action and validation for quantity offers | DONE | حفظ + تحقق (السعر الإجمالي ≥ السعر العادي) |
| 24 | Add one-click preset for 1, 2 and 3 pieces | DONE | زر إضافة جاهزة |
| 25 | Show quantity offer cards on the product page | DONE | بطاقات العروض للزبون |
| 26 | Remove the quantity stepper when a product has offers | DONE | العدّاد يختفي عند وجود عروض |
| 27 | Show the selected offer total in the sticky bar | DONE | الإجمالي المختار في الشريط السفلي |
| 28 | Add offer_id param to place_guest_order | DONE | migration 0017 (غير مطبّق) |
| 29 | Save the offer snapshot on order items | DONE | migration 0018 (غير مطبّق) |
| 30 | Pass the selected offer from the order form | DONE | يُرسل فقط عند `NEXT_PUBLIC_ENABLE_OFFERS=true` + اختيار عرض |
| 31 | Track the selected offer in pixel events | DONE | offer_id/offer_quantity في الأحداث |
| 32 | Make the price and title visible above the fold on mobile | DONE | صورة 4:5 على الجوال |
| 33 | Redesign the product header with a cleaner layout | DONE | تخطيط أنظف |
| 34 | Add a swipeable image gallery with dots on mobile | DONE | تمرير بنقطة التوقف + نقاط |
| 35 | Add tap to zoom on product images | DONE | تكبير بالضغط (Dialog) |
| 36 | Add a trust strip: cash on delivery, delivery, returns | DONE | 3 عناصر ثقة، صياغة صادقة |
| 37 | Make color and size buttons bigger for touch | DONE | أهداف لمس ≥ 44px |
| 38 | Redesign the order form with clearer spacing and labels | DONE | تسميات مرئية + مدخلات 16px |
| 39 | Add a clean product summary line to the order form | DONE | صورة صغيرة + الاسم + المقاس/اللون + السعر |
| 40 | Move reviews above the tabs and make them visible | DONE | المراجعات فوق التبويبات |
| 41 | Improve the related products section to match the same category | DONE | نفس الفئة أولاً وإخفاء القسم فارغاً |
| 42 | Make the sticky order bar cleaner with price and button | DONE | سعر + زر أنظف |
| 43 | Polish typography, spacing and colors across the page | DONE | تباعد وخطوط + احترام تقليل الحركة + لا تمرير أفقي |
| 44 | Enforce Algerian phone format 05 or 06 with 10 digits | DONE | قبول +213 و00213 وتوحيدها إلى 0XXXXXXXXX — بدون تغيير الـ RPC |
| 45 | Add aria labels to quantity and option buttons | DONE | أزرار +/− والألوان والأحجام |
| 46 | Fix low contrast text on the order form | DONE | أخطاء حمراء أغمق + إزالة الرمادي الفاتح + ذهبي داكن للنص |
| 47 | Add JSON-LD product data with the offers | DONE | Product + عرض لكل فئة + AggregateRating شرطي + Breadcrumb |
| 48 | Add Open Graph and Twitter card metadata | DONE | og كامل + twitter card لصفحة المنتج |
| 49 | Fix the sitemap to list only real product urls | DONE | روابط /p/ للمنتجات المحوّلة + updated_at حقيقي + بدون اعتماد على env |
| 50 | Add rate limiting to order and review submissions | SKIPPED | انظر القرار 1 في القسم 4 — لا نقطة خادم بين المتصفح وSupabase |

## 3. ما يجب فعله صباحاً (بالترتيب)

1. **راجع معاينة Vercel** للفرع `overnight/product-page` (لا تدمجه في main قبل الخطوات 2–3).
2. **طبّق الـ migrations الخمسة** في Supabase → SQL Editor، بالترتيب وبأسماء ملفاتها (كلها مصمّمة لتُطبّق مرتين بأمان):
   - `0015_product_compare_at_price.sql` — يضيف عمود `compare_at_price` (السعر القديم) لجدول المنتجات.
   - `0016_product_quantity_offers.sql` — ينشئ جدول عروض الكمية مع RLS (الإدارة تكتب، الجميع يقرأ العروض النشطة).
   - `0017_place_guest_order_offer_param.sql` — يضيف معامل `p_offer_id` اختياري لدالة الطلب؛ بدونه تبقى الدالة كما هي تماماً.
   - `0018_order_items_offer_snapshot.sql` — يحفظ نسخة العرض في `order_items` (offer_id/offer_quantity/offer_label).
   - `0019_public_tracking_pixel_read.sql` — يسمح للزوار بقراءة سطر `tracking_pixel` من `store_settings` (بدونه البكسل يبقى مطفأ).
3. **بعد 0017+0018 فقط**: أضف `NEXT_PUBLIC_ENABLE_OFFERS=true` في Vercel و أعد النشر (العلم و الـ migrations معاً؛ بدون العلم لا يُرسَل `p_offer_id` إطلاقاً والموقع يطلب كالمعتاد).
4. **البكسل (اختياري)**: بعد 0019، أدخل رقم بكسل فيسبوك في «الإعدادات → معرّف البكسل» (الحقل موجود مسبقاً) — حول تيك توك غير موجود في اللوحة، ويُقرأ من نفس JSON إن أضفته يدوياً.
5. **اختبار سريع (390×844)**:
   - صفحة منتج: اسحب الصور ↔ النقاط، اضغط صورة للتكبير، شريط الثقة ظاهر، أزرار اللون/المقاس كبيرة، المراجعات فوق التبويبات.
   - إن فعّلت العروض: بطاقات 1/2/3 قطع، عند اختيار فئة يختفي العدّاد ويظهر الإجمالي في الشريط السفلي، وفي الطلب يظهر "الكمية: قطعتان".
   - الطلب: جرّب `0550` (يجب أن يظهر خطأ) ثم `0550123456` (ينجح)؛ `+213 550 12 34 56` تُقبل وتُحوَّل داخلياً.
   - Admin: ضع سعر قديم أعلى — يُقبل؛ مساوٍ أو أقل — خطأ.
   - `view-source`: ابحث عن `application/ld+json` في صفحة المنتج، وافتح `/sitemap.xml` (روابط `/p/...` للمنتجات المحوّلة).
6. **إذا لم تطبّق الـ migrations بعد**: لا مشكلة — صفحة المنتج تعمل كما هي اليوم (بدون سعر قديم، عروض فارغة، البكسل مطفأ). استمارة الطلب لا ترسل `p_offer_id` إطلاقاً بدون العلم.

## 4. قرارات تحتاج رأيي

**القرار 1 — الحد من الطلبات/المراجعات الوهمية (مهمة 50 — متروكة):**
المشكلة: الطلب والمراجعة يذهبان مباشرة من متصفح الزبون إلى Supabase، فما يوجد طبقة خادم نستطيع وضع حدّ فيها دون تغيير مسار الطلب (ممنوع في التوجيه). الخيارات:
1. **مسار Next.js وسيط (proxy)** — الطلب يذهب لـ `/api/orders` ثم للقاعدة، ونستخدم `checkRateLimit` الموجود أصلاً. لا يتغير شكل الاستمارة إطلاقاً. **(توصيتي — أقل تغيير ويعيد استخدام الموجود)**
2. **Cloudflare Turnstile** — يمنع الروبوتات بصفحة تحقّق خفيفة، لكنه يحتاج مفتاحاً وإضافة ودجت + نقطة تحقق.
3. **Supabase Edge Function** — طبقة على طرف Supabase نفسها، أقوى ضد الإساءة لكنها تعني نشراً جديداً وصيانة إضافية.

**القرار 2 — حقول الخصم القديمة (`discount_percentage`/`discount_amount`):**
الآن صفحة المنتج تتجاهلها تماماً و تعرض `base_price`. الخياران: (أ) **اتركها كما هي** — آمن ولا يكسر اللوحة القديمة **(توصيتي)**؛ (ب) كتابة migration يصفّرها لكل المنتجات — أنظف بياناتياً لكنه تعديل على بيانات حيّة.

## 5. افتراضات اتخذتها

1. رقم بكسل تيك توك للمتجر غير موجود في اللوحة → القارئ العام يقبل `tiktok_pixel_id` اختيارياً داخل نفس JSON الخاص بـ `tracking_pixel`.
2. بطاقات العروض تظهر دائماً؛ العلم `NEXT_PUBLIC_ENABLE_OFFERS` يتحكم فقط في إرسال `p_offer_id` للـ RPC (كما طلب التوجيه حرفياً).
3. تحقّق الهاتف الجديد طُبّق أيضاً على استمارة الصفحة الرئيسية (لأن `validatePhone` مشترك) مع توحيد الرقم قبل الإرسال.
4. لون النص الذهبي في استمارة الطلب: أضفت `--brand-accent-ink: #7A5F1A` (ذهب داكن بتباين 6:1) بدل `#C9A24B` الفاتح — شارات المنتج في أعلى الصفحة أُبقيت كما هي خارج نطاق المهمة.
5. مهمة 20: قررت "لا تغيير" لأن الـ RPC يخصم السعر الحقيقي أصلاً.
6. sitemap يجلب حتى 1000 منتج في طلب واحد (المتجر فيه حالياً 11 منتج).
7. المراجعات/الطلبات مرتّبة زمنياً بالمراحل حسب أولوية التوجيه (1 → 3 → 4 → 5 → 2 → 6)، والرسائل مطابقة حرفيًا بعد التصحيح.
8. شهادة `AggregateRating` تنشر فقط عند `rating > 0` ووجود مراجعة معتمدة واحدة على الأقل (لا نجوم مخترعة).

## 6. مشاكل ومخاطر

1. **الـ migrations غير مطبّقة** (علّمتُها عمداً): قبل تطبيقها، حفظ عروض الكمية من اللوحة سيفشل (الجدول غير موجود)، وعمود السعر القديم غير موجود. بعد تطبيقها كل شيء يعمل.
2. **البكسل مطفأ حتى** تطبيق 0019 + وجود سطر `tracking_pixel` في `store_settings` (الجدول فارغ حالياً) — وهذا مقصود وآمن.
3. **لا يوجد rate limiting** للمشتريات/المراجعات (مهمة 50 متخطّاة) — نفس وضع الموقع اليوم.
4. أحداث Meta/TikTok تُطلق من المتصفح فقط؛ بدون سكربت قاعدة في الصفحة (يتطلب 0019 + إعداد) تبقى الأحداث صامتة — لا تغيير عن وضع اليوم.
5. `sitemap.xml` صار ديناميكاً (يقرأ headers الطلب) — هذا طبيعي ومقصود حتى لا يعتمد على env.
6. ملفّي `docs/landing-page-audit.md` و`docs/product-page-audit.md` بقيا غير مُرقَّمان (untracked) عمداً — لا تضمّهما للـ commit.
7. لم أرَ مشاكل في قاعدة البيانات الحيّة أثناء الفحص (كنت للقراءة فقط).

## 7. أرقام

- **البناء**: `npm run build` ✅ — 26/26 صفحة، بدون أخطاء.
- **الاختبارات**: 333/333 ✅ في 38 ملفاً.
- **typecheck + lint**: ✅ بدون أي تحذير.
- **الكمّيتات**: 48 كمّيتر على الفرع (كل رسالة مطابقة حرفيًا للتوجيه) + كمّيتر التقرير هذا = 49.
- **ملفات متغيّرة**: 48 ملفاً، إضافة ~3800 سطر، حذف ~300 سطر.
- **الـ migrations المكتوبة وغير المطبّقة**: 5 (0015–0019).
- **المهام**: 48 DONE + 1 NO CHANGE NEEDED (20) + 1 SKIPPED (50) = 50.

## 8. لقطات للتحقق (افتح DevTools وضع 390×844)

1. `/shop` ثم أي منتج — تأكد من: الصورة والسعر والعنوان في أول شاشة، سحب الصور والنقاط، تكبير بالضغط، شريط الثقة، المراجعات قبل التبويبات.
2. `/shop/product/<uuid>` على 360px — لا تمرير أفقي إطلاقاً.
3. استمارة الطلب: أخطاء الحقول الحمراء مقروءة، `0550` يُرفض، `0650123456` يُقبل.
4. `view-source` لصفحة المنتج → `<script type="application/ld+json">` (Product + BreadcrumbList).
5. `/sitemap.xml` → الروابط الحقيقية مع `lastModified`.
6. `/p/<slug>` للمنتج المحوّل — يفتح مباشرة، و `/shop/product/<uuid>` يوجّه إليه.
7. لوحة التحكم `/admin/products/<id>/edit` → حقل السعر القديم + بطاقة عروض الكمية (بعد 0016).
8. لوحة المتصفح (Network) على صفحة المنتج → طلبات أقل (cache في المهمة 7).
