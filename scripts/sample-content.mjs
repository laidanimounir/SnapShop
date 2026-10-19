// Sample landing-page content used by the dev seeder (scripts/seed-landing-page.mjs).
//
// Kept as plain .mjs so the Node-run seeder can import it directly, while the
// vitest suite imports it too and validates it against the real zod schemas
// (src/lib/landing/sections.ts, theme.ts) — so this sample can never drift out
// of what the renderer accepts.

const DEFAULT_SLUG = "demo-offer";
const MAX_SECTIONS = 30;

/**
 * @param {{ name: string, price: number, images?: Array<{ url: string, alt?: string }> }} product
 */
function buildSampleContent({ name, price, images = [] }) {
  const priceText = `${Math.round(Number(price) || 0)} د.ج`;
  const endAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const sections = [];

  sections.push({
    id: "hero-1",
    type: "hero",
    props: {
      title: `${name} — بسعر ${priceText}`,
      subtitle:
        "منتج أصلي بجودة عالية، الدفع عند الاستلام، وتوصيل سريع لجميع الولايات.",
      ctaText: "اطلب الآن",
      ...(images[0] ? { imageUrl: images[0].url } : {}),
    },
  });

  if (images.length > 0) {
    sections.push({
      id: "gallery-1",
      type: "gallery",
      props: {
        colorName: "",
        images: images.slice(0, 6).map((img) => ({
          imageUrl: img.url,
          alt: img.alt ?? name,
        })),
      },
    });
  }

  sections.push({
    id: "features-1",
    type: "features",
    props: {
      title: "لماذا هذا المنتج؟",
      items: [
        { title: "الدفع عند الاستلام", text: "لا تدفع شيئاً قبل أن تستلم طلبك." },
        { title: "توصيل سريع", text: "من 24 إلى 48 ساعة داخل المدن الكبرى." },
        { title: "استبدال مجاني", text: "خلال 7 أيام إذا لم يناسبك المقاس." },
        { title: "جودة مضمونة", text: "مواد مختارة بعناية ومراجعة قبل الشحن." },
      ],
    },
  });

  sections.push({
    id: "size-1",
    type: "size_guide",
    props: {
      title: "دليل المقاسات",
      columns: ["المقاس", "الصدر (سم)", "الطول (سم)"],
      rows: [
        ["S", "48", "68"],
        ["M", "51", "70"],
        ["L", "54", "72"],
        ["XL", "57", "74"],
      ],
    },
  });

  if (images.length >= 2) {
    sections.push({
      id: "before-after-1",
      type: "before_after",
      props: {
        title: "المنتج على الطبيعة",
        pairs: [
          { beforeUrl: images[0].url, afterUrl: images[1].url, caption: name },
        ],
      },
    });
  }

  sections.push({
    id: "testimonials-1",
    type: "testimonials",
    props: {
      title: "آراء الزبائن",
      items: [
        {
          name: "أمينة. ب",
          text: "الطلب وصل بسرعة والجودة أفضل مما توقعت. أنصح به.",
          rating: 5,
        },
        {
          name: "ياسين. م",
          text: "المقاس مطابق تماماً للجدول، والتعامل كان محترماً.",
          rating: 5,
        },
        {
          name: "سارة. ل",
          text: "سعر جيد مقارنة بالجودة، سأعيد الطلب مرة أخرى.",
          rating: 4,
        },
      ],
    },
  });

  sections.push({
    id: "faq-1",
    type: "faq",
    props: {
      title: "أسئلة شائعة",
      items: [
        {
          question: "هل الدفع عند الاستلام متاح؟",
          answer: "نعم، تدفع عند استلام الطلب في جميع الولايات.",
        },
        {
          question: "كم يستغرق التوصيل؟",
          answer:
            "من 24 إلى 48 ساعة في المدن الكبرى، ومن 2 إلى 4 أيام لباقي المناطق.",
        },
        {
          question: "هل يمكنني الاستبدال؟",
          answer: "نعم، الاستبدال مجاني خلال 7 أيام في حال كان المنتج بحالته الأصلية.",
        },
      ],
    },
  });

  sections.push({
    id: "countdown-1",
    type: "countdown",
    props: {
      title: "ينتهي العرض خلال",
      endAt,
      note: "استفد من السعر الحالي قبل انتهاء المدة.",
    },
  });

  sections.push({
    id: "rich-1",
    type: "rich_text",
    props: {
      title: "تفاصيل المنتج",
      text: `**${name}** مصنوع من مواد عالية الجودة.\n\n- خياطة متينة تدوم طويلاً\n- ألوان ثابتة لا تبهت بعد الغسل\n\nاقرأ *سياسة الاستبدال* قبل الطلب أو [تواصل معنا](/contact) لأي سؤال.`,
    },
  });

  sections.push({
    id: "order-1",
    type: "order_form",
    props: {
      title: "أكمل طلبك",
      ctaText: "اطلب الآن",
      showStock: true,
      showShipping: true,
    },
  });

  sections.push({
    id: "sticky-1",
    type: "sticky_cta",
    props: {
      text: "اطلب الآن — الدفع عند الاستلام",
    },
  });

  const theme = {
    primaryColor: "#111111",
    accentColor: "#C9A24B",
    pageBgColor: "#FFFFFF",
    textColor: "#111111",
    buttonBgColor: "#C9A24B",
    buttonTextColor: "#111111",
    buttonRadius: 10,
    baseFontSize: 16,
    sectionSpacing: 48,
    headingFont: "cairo",
    bodyFont: "cairo",
  };

  return { theme: theme, sections: sections.slice(0, MAX_SECTIONS) };
}

export { buildSampleContent, DEFAULT_SLUG, MAX_SECTIONS };
