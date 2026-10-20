import { describe, expect, it } from "vitest";

import {
  buildPublishUpdate,
  buildUnpublishUpdate,
  ensureUniqueSlug,
  isTemplateNameTaken,
  suggestSlug,
  templateNameKey,
  validateContentInput,
  validatePixelsInput,
  validateSeoInput,
  validateSlugInput,
  validateTemplateInput,
  validateTemplateName,
} from "../landing-validation";

const hero = (id: string) => ({
  id,
  type: "hero" as const,
  props: { title: "عنوان" },
});

describe("suggestSlug", () => {
  it("slugifies latin product names", () => {
    expect(suggestSlug("  Summer   T-Shirt! ")).toBe("summer-t-shirt");
  });

  it("strips diacritics", () => {
    expect(suggestSlug("Café Déjà Vu")).toBe("cafe-deja-vu");
  });

  it("falls back for all-arabic names that leave no latin chars", () => {
    expect(suggestSlug("حقيبة يد")).toBe("offer");
  });

  it("falls back when the latin result is too short", () => {
    expect(suggestSlug("ab")).toBe("offer");
  });

  it("never exceeds 60 chars and has no edge dashes", () => {
    const slug = suggestSlug("a".repeat(120));
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug).not.toMatch(/^-|-$/);
  });

  it("honours a custom fallback", () => {
    expect(suggestSlug("", "bundle")).toBe("bundle");
  });
});

describe("ensureUniqueSlug", () => {
  it("returns the base when unused", () => {
    expect(ensureUniqueSlug("offer", ["other"])).toBe("offer");
  });

  it("appends -2, -3, … until unique", () => {
    expect(ensureUniqueSlug("offer", ["offer"])).toBe("offer-2");
    expect(ensureUniqueSlug("offer", ["offer", "offer-2"])).toBe("offer-3");
  });
});

describe("validateSlugInput", () => {
  it("lowercases and trims a valid slug", () => {
    expect(validateSlugInput("  My-Page  ")).toEqual({
      ok: true,
      value: "my-page",
    });
  });

  it("rejects slugs that are too short or contain spaces", () => {
    expect(validateSlugInput("ab").ok).toBe(false);
    expect(validateSlugInput("has space").ok).toBe(false);
    expect(validateSlugInput("bad_slug").ok).toBe(false);
    expect(validateSlugInput(null).ok).toBe(false);
  });
});

describe("validateContentInput", () => {
  it("accepts and normalises content with defaults filled in", () => {
    const result = validateContentInput({ sections: [] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sections).toEqual([]);
      expect(result.value.theme).toBeDefined();
      expect(result.value.theme.primaryColor).toMatch(/^#/);
    }
  });

  it("fills defaults from an empty object", () => {
    const result = validateContentInput({});
    expect(result.ok).toBe(true);
  });

  it("rejects duplicate section ids", () => {
    const result = validateContentInput({
      sections: [hero("hero-1"), hero("hero-1")],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an unknown section type", () => {
    const result = validateContentInput({
      sections: [{ id: "x-1", type: "bogus", props: {} }],
    });
    expect(result.ok).toBe(false);
  });
});

describe("validateSeoInput", () => {
  it("maps empty strings to null", () => {
    expect(validateSeoInput({})).toEqual({
      ok: true,
      value: { seo_title: null, seo_description: null, og_image_url: null },
    });
  });

  it("trims and keeps provided values", () => {
    const result = validateSeoInput({
      seoTitle: "  عنوان  ",
      seoDescription: "وصف",
      ogImageUrl: "https://cdn.example.com/og.jpg",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.seo_title).toBe("عنوان");
      expect(result.value.og_image_url).toBe(
        "https://cdn.example.com/og.jpg"
      );
    }
  });

  it("rejects an over-long title", () => {
    expect(validateSeoInput({ seoTitle: "x".repeat(201) }).ok).toBe(false);
  });

  it("rejects a non-https og image", () => {
    expect(validateSeoInput({ ogImageUrl: "http://x.com/a.png" }).ok).toBe(
      false
    );
    expect(validateSeoInput({ ogImageUrl: "not-a-url" }).ok).toBe(false);
  });
});

describe("validatePixelsInput", () => {
  it("maps empty strings to null", () => {
    expect(validatePixelsInput({})).toEqual({
      ok: true,
      value: { facebook_pixel_id: null, tiktok_pixel_id: null },
    });
  });

  it("accepts a digits-only facebook id and an alphanumeric tiktok id", () => {
    const result = validatePixelsInput({
      facebookPixelId: "1234567890",
      tiktokPixelId: "CABC123XYZ",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.facebook_pixel_id).toBe("1234567890");
      expect(result.value.tiktok_pixel_id).toBe("cabc123xyz");
    }
  });

  it("rejects non-digit facebook ids", () => {
    expect(validatePixelsInput({ facebookPixelId: "12ab34" }).ok).toBe(false);
  });

  it("rejects tiktok ids that are too short or use bad characters", () => {
    expect(validatePixelsInput({ tiktokPixelId: "123" }).ok).toBe(false);
    expect(validatePixelsInput({ tiktokPixelId: "abc-123" }).ok).toBe(false);
  });
});

describe("buildPublishUpdate", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");

  it("copies a valid draft into published_content with a timestamp", () => {
    const result = buildPublishUpdate({ sections: [hero("hero-1")] }, now);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("published");
      expect(result.value.published_at).toBe("2026-01-01T00:00:00.000Z");
      expect(result.value.published_content.sections).toHaveLength(1);
    }
  });

  it("refuses to publish invalid content", () => {
    const result = buildPublishUpdate({
      sections: [hero("hero-1"), hero("hero-1")],
    });
    expect(result.ok).toBe(false);
  });
});

describe("buildUnpublishUpdate", () => {
  it("returns the unpublished status", () => {
    expect(buildUnpublishUpdate()).toEqual({ status: "unpublished" });
  });
});

describe("validateTemplateInput", () => {
  it("trims the name and keeps an optional description", () => {
    const result = validateTemplateInput({
      name: "  عرض الخريف ",
      description: " قالب جاهز ",
      content: { sections: [hero("hero-1")] },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("عرض الخريف");
      expect(result.value.description).toBe("قالب جاهز");
      expect(result.value.content.sections).toHaveLength(1);
    }
  });

  it("maps an empty description to null", () => {
    const result = validateTemplateInput({
      name: "قالب",
      description: "",
      content: { sections: [] },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.description).toBeNull();
  });

  it("rejects an empty or too-long name", () => {
    expect(
      validateTemplateInput({ name: "   ", content: { sections: [] } }).ok
    ).toBe(false);
    expect(
      validateTemplateInput({
        name: "x".repeat(81),
        content: { sections: [] },
      }).ok
    ).toBe(false);
  });

  it("rejects a too-long description", () => {
    expect(
      validateTemplateInput({
        name: "قالب",
        description: "x".repeat(301),
        content: { sections: [] },
      }).ok
    ).toBe(false);
  });

  it("rejects invalid content", () => {
    expect(
      validateTemplateInput({
        name: "قالب",
        content: { sections: [hero("dup"), hero("dup")] },
      }).ok
    ).toBe(false);
  });
});

describe("validateTemplateName", () => {
  it("accepts a trimmed name in range", () => {
    const result = validateTemplateName("  قالب جديد ");
    expect(result).toEqual({ ok: true, value: "قالب جديد" });
  });

  it("rejects empty and too-long names", () => {
    expect(validateTemplateName("").ok).toBe(false);
    expect(validateTemplateName("x".repeat(81)).ok).toBe(false);
  });
});

describe("template name uniqueness", () => {
  it("keys names ignoring case and surrounding spaces", () => {
    expect(templateNameKey("  Summer Deal ")).toBe("summer deal");
  });

  it("detects a collision differing only by case or spaces", () => {
    const taken = ["Summer Deal", "عرض"];
    expect(isTemplateNameTaken("  summer   deal", taken)).toBe(false);
    expect(isTemplateNameTaken(" summer deal ", taken)).toBe(true);
    expect(isTemplateNameTaken("عرض ", taken)).toBe(true);
    expect(isTemplateNameTaken("جديد", taken)).toBe(false);
  });

  it("can ignore the template being renamed", () => {
    const taken = ["Summer Deal"];
    expect(isTemplateNameTaken("summer deal", taken, "Summer Deal")).toBe(
      false
    );
  });
});
