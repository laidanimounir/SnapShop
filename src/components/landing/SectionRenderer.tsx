import { Fragment, type ComponentType, type ReactNode } from "react";
import { sectionSchema, type Section } from "@/lib/landing/sections";
import HeroSection from "./sections/HeroSection";
import GallerySection from "./sections/GallerySection";
import FeaturesSection from "./sections/FeaturesSection";
import SizeGuideSection from "./sections/SizeGuideSection";
import BeforeAfterSection from "./sections/BeforeAfterSection";
import TestimonialsSection from "./sections/TestimonialsSection";
import FaqSection from "./sections/FaqSection";
import CountdownSection from "./sections/CountdownSection";
import RichTextSection from "./sections/RichTextSection";
import OrderFormSection from "./sections/OrderFormSection";
import StickyCtaSection from "./sections/StickyCtaSection";

type SectionComponent = ComponentType<{ section: unknown }>;

const SECTION_COMPONENTS: Record<Section["type"], SectionComponent> = {
  hero: HeroSection,
  gallery: GallerySection,
  features: FeaturesSection,
  size_guide: SizeGuideSection,
  before_after: BeforeAfterSection,
  testimonials: TestimonialsSection,
  faq: FaqSection,
  countdown: CountdownSection,
  rich_text: RichTextSection,
  order_form: OrderFormSection,
  sticky_cta: StickyCtaSection,
};

// Maps stored content JSON to section components. Never throws: unknown
// types, invalid payloads, hidden sections and duplicate ids are all
// skipped silently, so one bad row can never blank the whole page.
export default function SectionRenderer({ sections }: { sections: unknown }) {
  if (!Array.isArray(sections)) return null;

  const nodes: ReactNode[] = [];
  const seen = new Set<string>();

  sections.forEach((candidate) => {
    const parsed = sectionSchema.safeParse(candidate);
    if (!parsed.success) return;
    const section = parsed.data;
    if (section.hidden) return;
    if (seen.has(section.id)) return;
    seen.add(section.id);

    const Component = SECTION_COMPONENTS[section.type];
    if (!Component) return;

    nodes.push(<Component key={section.id} section={section} />);
  });

  if (nodes.length === 0) return null;
  return <Fragment>{nodes}</Fragment>;
}
