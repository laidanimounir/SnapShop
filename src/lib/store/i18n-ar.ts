// Arabic (storefront-only) UI strings. Typed dictionary, no i18n dependency.
// The storefront is Arabic-only: no language switcher. Numbers stay Western
// and currency is "DA" (rendered "12.00 DA").
//
// Product names, descriptions, categories, brands, colors, sizes and review
// text come from the database and are displayed exactly as stored — never
// translated and never transformed (no capitalize/uppercase). Only the UI
// chrome around them lives here.

import { round2 } from "../pricing";

export const ar = {
  meta: {
    titleSuffix: "متجر ملابس إلكتروني",
    description:
      "تسوّق أحدث صيحات الملابس أونلاين مع الدفع عند الاستلام والتوصيل حتى الباب.",
    ogLocale: "ar_DZ",
    notFoundTitle: "الصفحة غير موجودة",
    notFoundText: "الصفحة التي تبحث عنها غير موجودة.",
    notFoundCta: "العودة إلى الرئيسية",
    offerNotFoundTitle: "العرض غير متوفر",
    offerNotFoundText: "هذا العرض غير متوفر حاليًا أو تم إيقافه.",
    offerNotFoundCta: "تصفّح المنتجات",
  },
  nav: {
    shop: "تسوّق",
    onSale: "تخفيضات",
    newArrivals: "وصل حديثًا",
    brands: "العلامات التجارية",
    searchPlaceholder: "ابحث عن منتجات...",
    menuAria: "القائمة",
    searchAria: "بحث",
    userAria: "حسابي",
    menuChildren: {
      mensClothes: "ملابس رجالية",
      mensClothesDesc: "بألوان وتصاميم جذابة ومميزة",
      womensClothes: "ملابس نسائية",
      womensClothesDesc: "سيداتي، أسلوبك وذوقك يهمنا",
      kidsClothes: "ملابس أطفال",
      kidsClothesDesc: "لكل الأعمار، بألوان مبهجة وجميلة",
      bagsShoes: "حقائب وأحذية",
      bagsShoesDesc: "مناسبة للرجال والنساء ولكل الأذواق والأنماط",
    },
  },
  footer: {
    description:
      "لدينا ملابس تناسب أسلوبك والتي تفخر بارتدائها. من النساء إلى الرجال.",
    phoneWhatsApp: "الهاتف / واتساب:",
    email: "البريد الإلكتروني:",
    allRights: "جميع الحقوق محفوظة",
    sections: {
      company: {
        title: "الشركة",
        aboutUs: "من نحن",
        contactUs: "اتصل بنا",
      },
      help: {
        title: "المساعدة",
        shippingInfo: "معلومات الشحن",
        returnsExchanges: "الإرجاع والاستبدال",
        termsConditions: "الشروط والأحكام",
        privacyPolicy: "سياسة الخصوصية",
      },
      shop: {
        title: "تسوّق",
        allProducts: "جميع المنتجات",
        trackOrder: "تتبّع طلبك",
      },
    },
  },
  home: {
    hero: {
      title: "اعثر على ملابس تناسب أسلوبك",
      subtitle:
        "تصفّح مجموعتنا المتنوعة من الملابس المصممة بعناية، لتعكس شخصيتك وتلبي ذوقك في الأناقة.",
      shopNow: "تسوّق الآن",
      brands: "علامة تجارية عالمية",
      products: "منتج عالي الجودة",
      customers: "عميل سعيد",
      bigStarAlt: "نجمة كبيرة",
      smallStarAlt: "نجمة صغيرة",
    },
    newArrivals: "وصل حديثًا",
    topSelling: "الأكثر مبيعًا",
    viewAll: "عرض الكل",
    browseByStyle: "تصفّح حسب النمط",
    dressStyles: {
      casual: "كاجوال",
      formal: "رسمي",
      party: "سهرة",
      gym: "رياضي",
    },
    happyCustomers: "عملاؤنا السعداء",
    postedOn: "نُشر في",
  },
  shop: {
    filters: "التصفية",
    filter: "تصفية",
    home: "الرئيسية",
    category: "الفئة",
    price: "السعر",
    colors: "الألوان",
    size: "المقاس",
    clearFilters: "مسح التصفية",
    title: "المتجر",
    all: "الكل",
    showing: "عرض {from}-{to} من {total}",
    sortBy: "ترتيب حسب:",
    sort: {
      mostPopular: "الأكثر شيوعًا",
      lowPrice: "السعر: من الأقل إلى الأعلى",
      highPrice: "السعر: من الأعلى إلى الأقل",
      newest: "الأحدث",
    },
    noProducts: "لا توجد منتجات مطابقة للتصفية.",
    previous: "السابق",
    next: "التالي",
  },
  search: {
    title: "بحث",
    resultsFor: "نتائج البحث عن \"{q}\"",
    productsCount: "{n} {products}",
    searchPlaceholder: "ابحث عن منتجات...",
    noResults: "لا توجد منتجات.",
  },
  product: {
    selectColors: "اختر اللون",
    chooseSize: "اختر المقاس",
    outOfStock: "نفدت الكمية",
    orderNow: "اطلب الآن",
    pickColor: "اختر اللون",
    pickSize: "اختر المقاس",
    unavailable: "هذا المنتج غير متوفر حاليًا.",
    quantity: "الكمية",
    remainingStock: "المتبقي {n} قطعة",
    optionUnavailable: "{name} — نفدت الكمية",
    previewNotice: "معاينة فقط: لا يمكن إرسال طلب من هنا.",
    youMightAlsoLike: "قد يعجبك أيضًا",
    details: {
      title: "تفاصيل المنتج",
      category: "الفئة",
      brand: "العلامة التجارية",
    },
    tabs: {
      details: "تفاصيل المنتج",
      ratingReviews: "التقييم والمراجعات",
      faqs: "الأسئلة الشائعة",
    },
    reviews: {
      title: "جميع المراجعات",
      writeReview: "اكتب تقييمًا",
      noReviews: "لا توجد تقييمات بعد. كن أول من يترك تقييمًا.",
    },
    reviewForm: {
      title: "اكتب تقييمًا",
      name: "اسمك",
      namePlaceholder: "اسمك",
      nameError: "يرجى إدخال اسمك",
      rating: "التقييم",
      starOne: "نجمة واحدة",
      starMany: "{n} نجوم",
      comment: "التعليق",
      commentPlaceholder: "شاركنا رأيك...",
      submit: "إرسال التقييم",
      submitting: "جارٍ الإرسال...",
      submitted: "شكرًا! تم إرسال تقييمك وهو بانتظار المراجعة.",
      close: "إغلاق",
      errorGeneric: "حدث خطأ أثناء إرسال تقييمك.",
      company: "الشركة",
    },
    faqs: {
      title: "الأسئلة الشائعة",
      // Real, product-agnostic store answers (delivery, COD, confirmation,
      // returns). No merchant instructions and no invented numbers.
      items: [
        {
          question: "هل الدفع عند الاستلام متاح؟",
          answer:
            "نعم. جميع الطلبات تُدفع نقدًا عند وصولها، ولا نطلب أي دفع مسبق عبر الإنترنت. تدفع للموصّل المبلغ الإجمالي الموضّح لك عند تأكيد الطلب.",
        },
        {
          question: "هل التوصيل متوفر إلى جميع الولايات؟",
          answer:
            "نعم، نوصّل إلى جميع الولايات الجزائرية. تظهر تكلفة التوصيل حسب ولايتك وطريقتك (توصيل للمنزل أو استلام من المكتب) داخل نموذج الطلب قبل تأكيد الطلب.",
        },
        {
          question: "كيف يتم تأكيد طلبي؟",
          answer:
            "بعد إرسال الطلب سنتصل بك على رقم هاتفك للتأكد من الطلب والعنوان وطريقة التوصيل. يُرجى الرد على المكالمة حتى يبدأ شحن طلبك، وستحصل على رمز تأكيد يمكنك استخدامه في صفحة التتبّع.",
        },
        {
          question: "متى يصلني طلبي؟",
          answer:
            "مدّة التوصيل تعتمد على ولايتك، ويؤكدها فريقنا خلال مكالمة التأكيد. يمكنك متابعة حالة طلبك في أي وقت باستخدام رمز التأكيد في صفحة التتبّع.",
        },
        {
          question: "ماذا لو وصل المنتج معيبًا أو خاطئًا؟",
          answer:
            "إذا وصلك منتج مختلف عما طلبته أو تالفًا أو كانت هناك مشكلة في المقاس، تواصل معنا عبر صفحة الاتصال مع رمز طلبك ووصف مختصر للمشكلة، وسنرتّب الإرجاع أو الاستبدال وفق شروط الإرجاع المنشورة.",
        },
      ],
    },
  },
  checkout: {
    customerName: "اسم العميل",
    fullName: "اسمك الكامل",
    phoneNumber: "رقم الهاتف",
    phonePlaceholder: "+213 5XX XX XX XX",
    wilaya: "الولاية",
    loadingWilayas: "جارٍ تحميل الولايات…",
    selectWilaya: "اختر ولايتك",
    deliveryMethod: "طريقة التوصيل",
    selectWilayaHint: "اختر ولايتك لعرض أسعار التوصيل.",
    shippingAddress: "عنوان التوصيل",
    addressPlaceholder: "الشارع، المبنى، معالم قريبة",
    note: "ملاحظة إضافية (اختياري)",
    notePlaceholder: "أي تفاصيل تود إضافتها عن طلبك",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    delivery: "التوصيل",
    total: "الإجمالي",
    codNote: "الدفع عند الاستلام. يُعاد احتساب الإجمالي النهائي على الخادم.",
    confirmPurchase: "تأكيد الشراء",
    processing: "جارٍ المعالجة...",
    company: "الشركة",
    validation: {
      nameRequired: "يرجى إدخال اسمك الكامل",
      phoneRequired: "يرجى إدخال رقم هاتفك",
      phoneMin: "يجب أن يتكون رقم الهاتف من 8 أرقام على الأقل",
      addressRequired: "يرجى إدخال عنوان التوصيل",
      wilayaRequired: "يرجى اختيار ولايتك",
      zonesError:
        "تعذّر تحميل خيارات التوصيل. يرجى تحديث الصفحة والمحاولة مرة أخرى.",
      zonesLoading: "خيارات التوصيل ما زالت تُحمَّل. يرجى المحاولة بعد لحظات.",
      honeypot: "حدث خطأ أثناء إتمام طلبك. يرجى المحاولة مرة أخرى.",
      generic: "حدث خطأ أثناء إتمام طلبك. يرجى المحاولة مرة أخرى.",
    },
  },
  order: {
    trackTitle: "تتبّع طلبك",
    tokenPlaceholder: "الصق رمز التأكيد الخاص بك",
    track: "تتبّع",
    trackLoading: "...",
    noOrder: "لا يوجد طلب بهذا الرمز.",
    lookupError: "حدث خطأ أثناء البحث عن طلبك.",
    status: "الحالة",
    customer: "العميل",
    wilaya: "الولاية",
    delivery: "التوصيل",
    placed: "تاريخ الطلب",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    deliveryFee: "رسوم التوصيل",
    total: "الإجمالي",
    quantity: "الكمية",
    continueShopping: "مواصلة التسوق",
    trackOrder: "تتبّع الطلب",
    orderPlaced: "تم إرسال طلبك بنجاح!",
    contactSoon: "سنتواصل معك قريبًا. احتفظ بهذا الرمز لتتبّع طلبك:",
    couldNotFind: "تعذّر العثور على هذا الطلب.",
    trackAnOrder: "تتبّع طلبًا",
    loadingOrder: "جارٍ تحميل الطلب...",
  },
  statuses: {
    pending: "جديد",
    confirmed: "مؤكد",
    no_answer: "لا يرد",
    shipped: "مرسل",
    delivered: "مستلم",
    cancelled: "ملغى",
    returned: "مرجع",
  },
  deliveryTypes: {
    home: "توصيل للمنزل",
    office: "استلام من المكتب",
  },
  legal: {
    aboutTitle: "من نحن",
    contactTitle: "اتصل بنا",
    shippingTitle: "معلومات الشحن",
    returnsTitle: "الإرجاع والاستبدال",
    privacyTitle: "سياسة الخصوصية",
    termsTitle: "الشروط والأحكام",
    note: "تنبيه: هذه الصفحة نموذج أولي. يُرجى مراجعتها مع مستشار قانوني قبل استخدامها في الإنتاج.",
    about: {
      p1: "{brand} هو متجر ملابس إلكتروني يوفر طلبًا سهلًا مع الدفع عند الاستلام: تصفّح المتجر، اختر اللون والمقاس، وأتمم الطلب كضيف، وادفع عند وصول طلبك.",
      p2: "نركّز على الأنماط اليومية بأسعار عادلة، مع عرض مستويات المخزون بصدق في كل صفحة منتج.",
    },
    contact: {
      p1: "لديك سؤال عن طلب أو إرجاع أو منتج؟ تواصل معنا — ويرجى تضمين رمز الطلب إذا كان استفسارك عن طلب قائم.",
      phoneLabel: "الهاتف / واتساب:",
      emailLabel: "البريد الإلكتروني:",
    },
    shipping: {
      p1: "يقوم {brand} بتوصيل الطلبات ذات الدفع عند الاستلام إلى العنوان الذي تحدده عند إتمام الطلب. يرجى التأكد من صحة رقم هاتفك — يتصل فريق التوصيل للتأكيد قبل الوصول.",
      p2: "تعتمد تكلفة التوصيل على ولايتك وعلى الطريقة التي تختارها: التوصيل للمنزل أو الاستلام من المكتب. يظهر السعر الدقيق لولايتك عند إتمام الطلب قبل تأكيد الطلب — ولا يوجد حد أدنى للشحن المجاني.",
      p3: "تعتمد مدّة التوصيل على منطقتك ويؤكدها الهاتف عند معالجة طلبك. يمكنك متابعة حالة طلبك في أي وقت باستخدام رمز التأكيد الخاص بك في صفحة التتبّع.",
    },
    returns: {
      p1: "إذا كان هناك خطأ في طلبك (منتج خاطئ، منتج تالف، أو مشكلة في المقاس)، تواصل معنا خلال 7 أيام من التسليم مع رمز طلبك وسنرتّب إرجاعًا أو استبدالًا.",
      p2: "يجب أن تكون المنتجات المرتجعة غير ملبوسة وغير مغسولة وبحالتها الأصلية. ولأن جميع الطلبات تكون بالدفع عند الاستلام، تُعالج المبالغ المستردة المعتمدة نقدًا عند الاستلام أو في توصيلك التالي.",
      p3: "لبدء الإرجاع، تواصل معنا عبر صفحة الاتصال مع رمز طلبك ووصف مختصر للمشكلة.",
    },
    privacy: {
      p1: "يجمع {brand} فقط المعلومات اللازمة لتنفيذ طلبك: اسمك ورقم هاتفك وعنوان الشحن وعنوان بريدك الإلكتروني (إذا قدمته). لا توجد حسابات عملاء — تُتمم الطلب كضيف.",
      p2: "تُخزَّن بياناتك بشكل آمن في قاعدة بياناتنا وتُستخدم فقط لمعالجة طلبك وتوصيله ودعمه (بما في ذلك التواصل معك بخصوص التوصيل). نحن لا نبيع معلوماتك الشخصية.",
      p3: "لطلب نسخة من بياناتك أو حذفها، تواصل معنا عبر التفاصيل في صفحة الاتصال مع ذكر رقم الهاتف الذي طلبت به.",
    },
    terms: {
      p1: "بوضع طلب مع {brand}، فأنت توافق على الشروط التالية. جميع الطلبات تكون بالدفع عند الاستلام (COD): تدفع إجمالي الطلب نقدًا عند استلام منتجاتك.",
      p2: "تظهر الأسعار في كل صفحة منتج. تُطبَّق الخصومات، عند توفرها، تلقائيًا عند إتمام الطلب. قد تتغير توفر المنتجات ومستويات المخزون؛ وإذا أصبح منتج غير متوفر بعد طلبك، سنتواصل معك لترتيب بديل أو إلغاء.",
      p3: "بعد إتمام الطلب تحصل على رمز تأكيد. احتفظ به بأمان — فهو الطريقة الوحيدة للبحث عن طلبك في صفحة التتبّع.",
      p4: "يمكنك طلب إلغاء طلب معلّق عن طريق التواصل معنا في أقرب وقت ممكن مع رمز طلبك.",
    },
  },
  a11y: {
    close: "إغلاق",
    previousSlide: "الشريحة السابقة",
    nextSlide: "الشريحة التالية",
    morePages: "المزيد من الصفحات",
    more: "المزيد",
    breadcrumb: "مسار التنقل",
    carousel: "شريط تمرير",
    slide: "شريحة",
    pagination: "ترقيم الصفحات",
    search: "بحث",
    menu: "القائمة",
    user: "حسابي",
    filters: "التصفية",
  },
  errors: {
    generic: "حدث خطأ ما.",
    pageError: "حدث خطأ أثناء تحميل هذه الصفحة.",
    tryAgain: "حاول مرة أخرى",
    itemUnavailable:
      "عذرًا، المنتج الذي اخترته لم يعد متوفرًا. يرجى اختيار منتج آخر والمحاولة مرة أخرى.",
    insufficientStock:
      "عذرًا، لا توجد كمية كافية من المنتج الذي اخترته. يرجى تعديل الكمية والمحاولة مرة أخرى.",
    invalidQuantity:
      "يرجى التحقق من الكميات (بحد أقصى 10 للقطعة، وبحد أقصى 100 وحدة للطلب) والمحاولة مرة أخرى.",
    invalidPhone: "يرجى إدخال رقم هاتف صالح (من 6 إلى 15 رقمًا).",
    invalidEmail: "يرجى إدخال بريد إلكتروني صالح.",
    unsupportedPayment:
      "الدفع عند الاستلام هو طريقة الدفع الوحيدة المتاحة حاليًا.",
    invalidWilaya: "يرجى اختيار ولاية وطريقة توصيل صالحتين.",
    missingFields:
      "يرجى تعبئة الاسم ورقم الهاتف والعنوان قبل إتمام الطلب.",
    orderGeneric: "حدث خطأ أثناء إتمام طلبك. يرجى المحاولة مرة أخرى.",
    reviewGeneric: "حدث خطأ أثناء إرسال تقييمك. يرجى المحاولة مرة أخرى.",
  },
} as const;

export type StoreDict = typeof ar;

// --- helpers ---------------------------------------------------------------

/** Storefront price: amount, one space, "DA", always 2 decimals. */
export function formatStorePrice(value: number): string {
  return `${round2(value).toFixed(2)} DA`;
}

const statusRecord = ar.statuses as Record<string, string>;

/** Arabic label for an order status code; falls back to the raw code. */
export function statusLabelAr(status: string): string {
  return statusRecord[status] ?? status.replace(/_/g, " ");
}

const deliveryTypeRecord = ar.deliveryTypes as Record<string, string>;

/** Arabic label for a delivery type code; falls back to the raw code. */
export function deliveryTypeLabelAr(type: string): string {
  return deliveryTypeRecord[type] ?? type;
}

/** Replace `{key}` placeholders with values. */
export function formatAr(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  );
}

/**
 * Truncate to at most `max` user-perceived characters (grapheme clusters) so
 * metadata descriptions never split a combining mark or emoji in half.
 */
export function truncateGraphemes(text: string, max: number): string {
  if (text.length <= max) return text;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("ar", { granularity: "grapheme" });
    const parts = Array.from(segmenter.segment(text), (s) => s.segment);
    return parts.slice(0, max).join("").trimEnd();
  }
  return Array.from(text).slice(0, max).join("").trimEnd();
}

export type ArabicCountForms = {
  zero: string;
  one: string;
  two: string;
  few: string;
  many: string;
  other: string;
};

function arabicCountCategory(count: number): keyof ArabicCountForms {
  const abs = Math.abs(count);
  if (abs === 0) return "zero";
  if (abs === 1) return "one";
  if (abs === 2) return "two";
  if (abs >= 3 && abs <= 10) return "few";
  if (abs >= 11 && abs <= 99) return "many";
  return "other";
}

/** Count + correctly inflected Arabic noun form (CLDR plural categories). */
export function arabicCount(count: number, forms: ArabicCountForms): string {
  return `${count} ${forms[arabicCountCategory(count)]}`;
}

/** Reusable plural forms for "product(s)" in storefront copy. */
export const productCountForms: ArabicCountForms = {
  zero: "منتجات",
  one: "منتج",
  two: "منتجان",
  few: "منتجات",
  many: "منتجًا",
  other: "منتجًا",
};

/** Reusable plural forms for "review(s)" in storefront copy. */
export const reviewCountForms: ArabicCountForms = {
  zero: "تقييمات",
  one: "تقييم",
  two: "تقييمان",
  few: "تقييمات",
  many: "تقييمًا",
  other: "تقييمًا",
};
