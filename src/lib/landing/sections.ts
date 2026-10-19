import { z } from "zod";

// Section schemas for landing page content. One schema per section
// type, combined into a discriminated union so unknown `type` values
// are rejected. Strings and arrays are length-capped so a stored row
// can never blow up rendering, and every image must be an https URL.

const HTTPS_URL_MAX = 2048;

const httpsUrl = z
  .string()
  .max(HTTPS_URL_MAX)
  .regex(/^https:\/\/\S+$/, "must be an https url");

const shortText = (max: number, fallback = "") =>
  z.string().min(fallback ? 0 : 1).max(max);

const nonEmptyText = (max: number) => z.string().trim().min(1).max(max);

const optionalText = (max: number) => z.string().max(max);

export const heroSectionSchema = z.object({
  id: z.string().min(1).max(60),
  type: z.literal("hero"),
  hidden: z.boolean().default(false),
  props: z.object({
    title: nonEmptyText(120),
    subtitle: optionalText(300).default(""),
    imageUrl: httpsUrl.optional(),
    ctaText: nonEmptyText(40).default("اطلب الآن"),
  }),
});

export const gallerySectionSchema = z.object({
  id: z.string().min(1).max(60),
  type: z.literal("gallery"),
  hidden: z.boolean().default(false),
  props: z.object({
    images: z
      .array(
        z.object({
          imageUrl: httpsUrl,
          alt: optionalText(160).default(""),
        })
      )
      .min(1)
      .max(12),
    colorName: optionalText(60).default(""),
  }),
});

export const featuresSectionSchema = z.object({
  id: z.string().min(1).max(60),
  type: z.literal("features"),
  hidden: z.boolean().default(false),
  props: z.object({
    title: optionalText(120).default(""),
    items: z
      .array(
        z.object({
          title: nonEmptyText(80),
          text: optionalText(300).default(""),
          iconUrl: httpsUrl.optional(),
        })
      )
      .min(1)
      .max(12),
  }),
});

export const sizeGuideSectionSchema = z.object({
  id: z.string().min(1).max(60),
  type: z.literal("size_guide"),
  hidden: z.boolean().default(false),
  props: z.object({
    title: optionalText(120).default(""),
    columns: z.array(nonEmptyText(60)).min(1).max(8),
    rows: z
      .array(z.array(optionalText(100)).min(1).max(8))
      .min(1)
      .max(30),
  }),
});

export const beforeAfterSectionSchema = z.object({
  id: z.string().min(1).max(60),
  type: z.literal("before_after"),
  hidden: z.boolean().default(false),
  props: z.object({
    title: optionalText(120).default(""),
    pairs: z
      .array(
        z.object({
          beforeUrl: httpsUrl,
          afterUrl: httpsUrl,
          caption: optionalText(200).default(""),
        })
      )
      .min(1)
      .max(10),
  }),
});

export const testimonialsSectionSchema = z.object({
  id: z.string().min(1).max(60),
  type: z.literal("testimonials"),
  hidden: z.boolean().default(false),
  props: z.object({
    title: optionalText(120).default(""),
    items: z
      .array(
        z.object({
          name: nonEmptyText(80),
          text: nonEmptyText(500),
          rating: z.number().int().min(1).max(5).optional(),
          imageUrl: httpsUrl.optional(),
        })
      )
      .min(1)
      .max(10),
  }),
});

export const faqSectionSchema = z.object({
  id: z.string().min(1).max(60),
  type: z.literal("faq"),
  hidden: z.boolean().default(false),
  props: z.object({
    title: optionalText(120).default(""),
    items: z
      .array(
        z.object({
          question: nonEmptyText(200),
          answer: nonEmptyText(1000),
        })
      )
      .min(1)
      .max(15),
  }),
});

export const countdownSectionSchema = z.object({
  id: z.string().min(1).max(60),
  type: z.literal("countdown"),
  hidden: z.boolean().default(false),
  props: z.object({
    title: nonEmptyText(120),
    endAt: z
      .string()
      .max(40)
      .refine((v) => !Number.isNaN(Date.parse(v)), "must be a valid date"),
    note: optionalText(200).default(""),
  }),
});

export const richTextSectionSchema = z.object({
  id: z.string().min(1).max(60),
  type: z.literal("rich_text"),
  hidden: z.boolean().default(false),
  props: z.object({
    title: optionalText(120).default(""),
    // Constrained markup (bold / italic / links / lists), rendered by
    // the safe renderer. Never raw HTML.
    text: shortText(4000),
  }),
});

export const orderFormSectionSchema = z.object({
  id: z.string().min(1).max(60),
  type: z.literal("order_form"),
  hidden: z.boolean().default(false),
  props: z.object({
    title: optionalText(120).default(""),
    showStock: z.boolean().default(true),
    showShipping: z.boolean().default(true),
    ctaText: nonEmptyText(40).default("اطلب الآن"),
  }),
});

export const stickyCtaSectionSchema = z.object({
  id: z.string().min(1).max(60),
  type: z.literal("sticky_cta"),
  hidden: z.boolean().default(false),
  props: z.object({
    text: nonEmptyText(40).default("اطلب الآن"),
  }),
});

export const SECTION_TYPES = [
  "hero",
  "gallery",
  "features",
  "size_guide",
  "before_after",
  "testimonials",
  "faq",
  "countdown",
  "rich_text",
  "order_form",
  "sticky_cta",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export const sectionSchema = z.discriminatedUnion("type", [
  heroSectionSchema,
  gallerySectionSchema,
  featuresSectionSchema,
  sizeGuideSectionSchema,
  beforeAfterSectionSchema,
  testimonialsSectionSchema,
  faqSectionSchema,
  countdownSectionSchema,
  richTextSectionSchema,
  orderFormSectionSchema,
  stickyCtaSectionSchema,
]);

export type Section = z.infer<typeof sectionSchema>;
