import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddAllToCart } from "@/components/add-all-to-cart";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { AddToCartPanel } from "@/components/add-to-cart-panel";
import { CompareButton } from "@/components/compare-button";
import { FavoriteButton } from "@/components/favorite-button";
import {
  BoltIcon,
  CardIcon,
  CheckIcon,
  ReturnIcon,
  ShieldIcon,
  StarIcon,
  TruckIcon,
} from "@/components/icons";
import { MobileBuyBar } from "@/components/mobile-buy-bar";
import { ProductArt } from "@/components/product-art";
import { ProductCard, toCartLine } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { ProductTabs } from "@/components/product-tabs";
import { RecordProductView } from "@/components/record-product-view";
import { ReviewForm } from "@/components/review-form";
import { brandToSlug } from "@/lib/brands";
import {
  getFrequentlyBoughtTogether,
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
} from "@/lib/data";
import { getProductReviews } from "@/lib/reviews";
import { discountPercent, faDate, faNumber, shippingRules, toman } from "@/lib/format";
import { galleryFor } from "@/lib/images";
import type { Product } from "@/lib/types";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "محصول پیدا نشد" };
  return {
    title: product.name,
    description: `${product.tagline} — خرید ${product.name} با گارانتی ۱۸ ماهه از Hadi Digital.`,
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default function ProductPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

function DetailSkeleton() {
  return (
    <div className="container-x py-4">
      <div className="h-3 w-64 animate-pulse rounded bg-paper" />
      <div className="mt-4 grid gap-5 rounded-xl border border-line bg-paper p-5 lg:grid-cols-[400px_minmax(0,1fr)_304px]">
        <div className="aspect-square animate-pulse rounded-lg bg-cream" />
        <div className="space-y-3">
          <div className="h-4 w-24 animate-pulse rounded bg-cream" />
          <div className="h-8 w-4/5 animate-pulse rounded bg-cream" />
          <div className="h-24 animate-pulse rounded-lg bg-cream" />
        </div>
        <div className="h-72 animate-pulse rounded-lg bg-cream" />
      </div>
    </div>
  );
}

const KNOWN_SPEC_LABELS = [
  "حذف نویز",
  "زمان شارژ",
  "نوع اتصال",
  "نوع محصول",
  "صفحه نمایش",
  "ظرفیت باتری",
  "درگاه شارژ",
];

function splitSpec(spec: string): [string, string] {
  for (const label of KNOWN_SPEC_LABELS) {
    if (spec.startsWith(`${label} `)) return [label, spec.slice(label.length + 1)];
  }
  const index = spec.indexOf(" ");
  if (index > 0) return [spec.slice(0, index), spec.slice(index + 1)];
  return ["مشخصه", spec];
}

function specRowsFor(product: Product): [string, string][] {
  return [
    ["برند", product.brand],
    ["دسته‌بندی", product.categoryName],
    ...product.specs.map(splitSpec),
    ["گارانتی", "۱۸ ماه گارانتی Hadi Digital"],
    ["موجودی", product.stock > 0 ? "موجود در انبار" : "ناموجود"],
    [
      "ارسال",
      product.price >= shippingRules.freeThreshold ? "ارسال رایگان" : `ارسال ${toman(shippingRules.fee)}`,
    ],
  ];
}

async function ProductDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.categorySlug, 6);
  const frequentlyBought = await getFrequentlyBoughtTogether(product.id, 3);
  const bundle = [
    ...frequentlyBought,
    ...related.filter((item) => !frequentlyBought.some((picked) => picked.id === item.id)),
  ].slice(0, 3);
  const reviews = await getProductReviews(product.id, 6);
  const off = discountPercent(product.price, product.oldPrice);
  const gallery = galleryFor(product);
  const specRows = specRowsFor(product);
  const featureItems = [
    ...product.specs.slice(0, 4).map(splitSpec),
    ["برند", product.brand] as [string, string],
    ["گارانتی", "۱۸ ماه Hadi Digital"] as [string, string],
  ];

  const faqs = [
    {
      q: `آیا ${product.name} گارانتی دارد؟`,
      a: "بله؛ همهٔ محصولات Hadi Digital با گارانتی ۱۸ ماهه و خدمات پس از فروش ارائه می‌شوند.",
    },
    {
      q: "ارسال سفارش چقدر طول می‌کشد؟",
      a: "سفارش‌های تهران و کرج در ۲۴ ساعت کاری و شهرستان‌ها بین ۲ تا ۴ روز کاری ارسال می‌شوند.",
    },
    {
      q: "امکان بازگشت کالا وجود دارد؟",
      a: "بله؛ تا ۷ روز پس از تحویل، در صورت سالم بودن کالا و بسته‌بندی، امکان بازگشت وجود دارد.",
    },
    {
      q: "از اصل بودن کالا چطور مطمئن شوم؟",
      a: "همهٔ کالاها با فاکتور رسمی و ضمانت اصالت ارسال می‌شوند؛ در صورت مغایرت، هزینه کامل بازگردانده می‌شود.",
    },
  ];

  return (
    <div className="container-x py-4 pb-20 lg:pb-4">
      <RecordProductView productId={product.id} />

      <nav aria-label="مسیر صفحه" className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-mute">
        <Link href="/" className="transition hover:text-ink">
          فروشگاه
        </Link>
        <span aria-hidden>›</span>
        <Link href="/products" className="transition hover:text-ink">
          همه محصولات
        </Link>
        <span aria-hidden>›</span>
        <Link href={`/products?category=${product.categorySlug}`} className="transition hover:text-ink">
          {product.categoryName}
        </Link>
        <span aria-hidden>›</span>
        <span className="text-ink-soft">{product.name}</span>
      </nav>

      <section className="mt-4 grid gap-5 rounded-xl border border-line bg-paper p-4 sm:p-5 lg:grid-cols-[320px_minmax(0,1fr)_270px] lg:gap-6 xl:grid-cols-[400px_minmax(0,1fr)_304px]">
        <div className="min-w-0">
          {gallery.length > 0 ? (
            <ProductGallery images={gallery} name={product.name} discount={off} badge={product.badge} />
          ) : (
            <ProductArt
              product={product}
              size="lg"
              priority
              imageSizes="(min-width: 1024px) 400px, 100vw"
              className="aspect-square rounded-xl border border-line"
            />
          )}
          <div className="mt-2.5 flex items-center justify-between gap-2 text-[8.5px] text-mute">
            <span className="inline-flex items-center gap-1">
              <CheckIcon className="size-3" />
              مشخصات کالا مطابق تصاویر است
            </span>
            <span className="font-mono">HD-{product.id}</span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/brands/${brandToSlug(product.brand)}`}
                className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[9px] font-bold text-ink-soft transition hover:border-coral/40 hover:text-coral"
              >
                <span className="size-1 rounded-full bg-green" />
                {product.brand}
              </Link>
              <Link
                href={`/products?category=${product.categorySlug}`}
                className="text-[9px] text-mute transition hover:text-ink"
              >
                {product.categoryName}
              </Link>
              {product.badge ? (
                <span className="rounded-full bg-coral px-2 py-0.5 text-[8px] font-black text-white">
                  {product.badge}
                </span>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <CompareButton product={product} className="!size-9" />
              <FavoriteButton product={product} size="md" className="shrink-0" />
            </div>
          </div>

          <h1 className="mt-2.5 text-[16px] font-black leading-[1.9] text-ink sm:text-[18px]">{product.name}</h1>
          <p className="mt-1 text-[10.5px] leading-6 text-mute">{product.tagline}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[9.5px] text-mute">
            <span className="flex items-center gap-1 text-[12px] font-black text-ink">
              <StarIcon className="size-4 text-gold" />
              {faNumber(Number(product.rating.toFixed(1)))}
            </span>
            <span>از ۵ · {faNumber(product.reviewCount)} امتیاز</span>
            <span className="h-3 w-px bg-line" aria-hidden />
            <a href="#reviews" className="font-bold text-ink-soft underline decoration-line underline-offset-4">
              دیدگاه‌ها
            </a>
            <span className="h-3 w-px bg-line" aria-hidden />
            <a href="#questions" className="font-bold text-ink-soft underline decoration-line underline-offset-4">
              پرسش‌ها
            </a>
            <span
              className={`ms-auto text-[9px] font-bold ${product.stock > 0 ? "text-green" : "text-coral"}`}
            >
              {product.stock > 0 ? "موجود در انبار" : "ناموجود"}
            </span>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-2 rounded-lg border border-[#f3e4bd] bg-[#fffaf0] px-3 py-2 text-[9px] text-[#6b5a2e]">
            <TruckIcon className="size-4 shrink-0 text-[#b9891c]" />
            <span className="flex-1">
              تحویل ۲۴ ساعته در تهران؛ ارسال رایگان برای سفارش‌های بالای ۲ میلیون تومان.
            </span>
            <Link href="/checkout" className="rounded-md border border-[#e8c96b] bg-white px-2 py-1 text-[8px] font-bold text-[#8a6414]">
              انتخاب آدرس
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[11.5px] font-black text-ink">
            ویژگی‌ها
            <span className="h-px flex-1 bg-line/70" aria-hidden />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {featureItems.map(([label, value], index) => (
              <div key={`${label}-${index}`} className="rounded-lg border border-line/70 bg-[#f7f7f8] px-2.5 py-2">
                <p className="text-[8.5px] text-mute">{label}</p>
                <p className="mt-0.5 text-[9.5px] font-bold leading-6 text-ink-soft">{value}</p>
              </div>
            ))}
          </div>
          <a
            href="#specs"
            className="mt-2 flex h-8 items-center justify-center gap-1 rounded-md border border-line bg-white text-[9px] font-bold text-ink-soft transition hover:border-coral/40 hover:text-coral"
          >
            مشاهده همه ویژگی‌ها
          </a>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-line px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[9.5px] font-black text-ink-soft">
                <TruckIcon className="size-3.5 text-violet" />
                ارسال سریع
              </p>
              <p className="mt-1 text-[8.5px] leading-5 text-mute">تحویل ۲۴ ساعته در تهران و کرج</p>
            </div>
            <div className="rounded-lg border border-line px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[9.5px] font-black text-ink-soft">
                <ReturnIcon className="size-3.5 text-violet" />
                خرید مطمئن
              </p>
              <p className="mt-1 text-[8.5px] leading-5 text-mute">۷ روز ضمانت بازگشت و تضمین اصالت</p>
            </div>
          </div>

          <p className="mt-3 flex items-start gap-1.5 text-[8.5px] leading-5 text-mute">
            <CheckIcon className="mt-0.5 size-3.5 shrink-0" />
            اصالت کالا تضمین‌شده است؛ در صورت مغایرت، هزینه کامل بازگردانده می‌شود.
          </p>
        </div>

        <aside
          id="buybox"
          className="scroll-mt-32 self-start rounded-[10px] border border-line bg-paper p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] lg:sticky lg:top-32"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line/70 pb-2.5">
            <b className="text-[11px] font-black text-ink">فروشنده</b>
            <a href="#seller" className="text-[8.5px] text-[#1672d4]">
              جزئیات فروشنده
            </a>
          </div>

          <div className="flex items-center gap-2 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-ink font-mono text-[10px] font-black text-white">
              HD
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-ink-soft">
                Hadi Digital
                <span className="rounded bg-[#eaf7ef] px-1 py-0.5 text-[6.5px] font-black text-green">منتخب</span>
              </div>
              <p className="mt-0.5 text-[8px] text-mute">
                <span className="font-bold text-green">عملکرد عالی</span> · ۹۸.۴٪ رضایت از کالا
              </p>
            </div>
          </div>

          <div className="py-2.5">
            {product.oldPrice ? (
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[#b3b3b8] line-through">{faNumber(product.oldPrice)}</span>
                <span className="rounded-full bg-coral px-1.5 py-0.5 text-[7.5px] font-black text-white">
                  {faNumber(off)}٪
                </span>
              </div>
            ) : null}
            <p className="mt-1 flex items-baseline gap-1 text-[22px] font-black leading-none text-ink">
              {faNumber(product.price)}
              <span className="text-[9.5px] font-normal text-mute">تومان</span>
            </p>
          </div>

          <AddToCartPanel line={toCartLine(product)} stock={product.stock} />

          <div className="mt-3 flex items-center gap-1.5 text-[8.5px] text-ink-soft">
            <ShieldIcon className="size-3.5 text-mute" />
            ۱۸ ماه گارانتی Hadi Digital
          </div>

          <div className="mt-3 border-t border-line/70 pt-2.5">
            <div className="flex items-center justify-between gap-2 text-[9px] font-bold text-ink-soft">
              روش‌های ارسال
              <TruckIcon className="size-3.5 text-mute" />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[8px] text-mute">
              <CheckIcon className="size-3 text-green" />
              تحویل عادی Hadi Digital
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[8px] text-mute">
              <CheckIcon className="size-3 text-green" />
              تحویل سریع (تهران و کرج)
            </p>
          </div>

          <div className="mt-3 rounded-lg bg-[#f2efff] p-2.5 text-[#5a3fe0]">
            <p className="flex items-center gap-1 text-[8.5px] font-black">
              <StarIcon className="size-3" />
              باشگاه Hadi Digital
            </p>
            <p className="mt-1 text-[7.5px] leading-5 text-[#7b6bb5]">ارسال سریع و رایگان برای سفارش‌های منتخب</p>
            <Link href="/about" className="mt-1 inline-flex text-[7.5px] font-bold text-[#5a3fe0]">
              مشاهده مزایا
            </Link>
          </div>

          <a href="#seller" className="mt-3 flex items-center justify-center gap-1 text-[8px] text-[#1672d4]">
            <ShieldIcon className="size-3" />
            مقایسه با فروشنده
          </a>
        </aside>
      </section>

      <div className="mt-3.5 grid grid-cols-2 gap-2.5 rounded-[10px] border border-line bg-paper px-4 py-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { icon: TruckIcon, label: "امکان تحویل اکسپرس" },
          { icon: BoltIcon, label: "۲۴ ساعته، ۷ روز هفته" },
          { icon: CardIcon, label: "امکان پرداخت در محل" },
          { icon: ReturnIcon, label: "هفت روز ضمانت بازگشت" },
          { icon: ShieldIcon, label: "ضمانت اصل بودن کالا" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-[8.5px] text-mute">
            <Icon className="size-5 shrink-0 text-[#9a9aa0]" />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <section id="seller" className="mt-3.5 scroll-mt-32 rounded-[10px] border border-line bg-paper p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[14px] font-black text-ink">
            <span className="h-4 w-[3px] rounded-full bg-coral" aria-hidden />
            فروشندهٔ این کالا
          </h2>
          <Link href="/about" className="text-[9px] text-[#1672d4]">
            دربارهٔ فروشنده
          </Link>
        </div>

        <div className="mt-3 grid gap-3 border-t border-line/70 pt-3 sm:grid-cols-[1.2fr_1fr_auto] sm:items-center">
          <div className="flex items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-ink font-mono text-[10px] font-black text-white">
              HD
            </span>
            <div>
              <div className="flex items-center gap-1.5 text-[10.5px] font-black text-ink-soft">
                Hadi Digital
                <span className="rounded bg-[#eaf7ef] px-1 py-0.5 text-[6.5px] font-black text-green">منتخب</span>
              </div>
              <p className="mt-0.5 text-[8.5px] text-mute">
                <span className="font-bold text-green">عملکرد عالی</span> · ۹۸.۴٪ رضایت از کالا
              </p>
            </div>
          </div>

          <div className="grid gap-1 text-[8.5px] text-mute">
            <p className="flex items-center gap-1.5">
              <TruckIcon className="size-3.5" />
              تحویل عادی Hadi Digital
            </p>
            <p className="flex items-center gap-1.5">
              <CheckIcon className="size-3.5 text-green" />
              تحویل سریع (تهران و کرج)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            <div className="text-end">
              <p className="flex items-center gap-1 text-[8px] text-mute">
                <ShieldIcon className="size-3.5" />
                ۱۸ ماه گارانتی
              </p>
              <p className="mt-0.5 text-[13px] font-black text-ink">
                {faNumber(product.price)} <span className="text-[8px] font-normal text-mute">تومان</span>
              </p>
            </div>
            <div className="w-full sm:w-[180px]">
              <AddToCartButton
                line={toCartLine(product)}
                variant="full"
                disabled={product.stock === 0}
                className="h-9 whitespace-nowrap px-2 text-[9px]"
              />
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mt-3.5 rounded-[10px] border border-line bg-paper p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-[14px] font-black text-ink">
              <span className="h-4 w-[3px] rounded-full bg-coral" aria-hidden />
              کالاهای مشابه
            </h2>
            <Link href={`/products?category=${product.categorySlug}`} className="text-[9px] text-[#1672d4]">
              مشاهده همه
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      <ProductTabs
        intro={
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <h3 className="text-[13px] font-black text-ink">
                معرفی
                <span className="mt-2 block h-0.5 w-12 rounded-full bg-coral" aria-hidden />
              </h3>
              <p className="mt-4 text-[10.5px] leading-7 text-ink-soft">{product.description}</p>
              <p className="mt-3 text-[10.5px] leading-7 text-ink-soft">
                Hadi Digital این محصول را با بسته‌بندی ضدضربه ارسال می‌کند و در صورت نیاز به راه‌اندازی،
                راهنمای تصویری اختصاصی در اختیار شما قرار می‌گیرد. برای مشاوره پیش از خرید هم می‌توانید
                با کارشناسان ما تماس بگیرید.
              </p>
              <ul className="mt-3 space-y-2">
                {product.specs.map((spec) => (
                  <li key={spec} className="relative ps-3.5 text-[10px] leading-6 text-ink-soft">
                    <span className="absolute start-0 top-2.5 size-1.5 rounded-full bg-coral" aria-hidden />
                    {spec}
                  </li>
                ))}
              </ul>
              <a href="#specs" className="mt-3 inline-flex items-center gap-1 text-[9px] font-bold text-[#1672d4]">
                مشاهده مشخصات کامل
              </a>
            </div>

            <aside className="self-start rounded-[10px] border border-line p-3 lg:sticky lg:top-32">
              <div className="flex gap-2.5">
                <ProductArt
                  product={product}
                  plain
                  imageSizes="80px"
                  className="size-[72px] shrink-0 rounded-lg border border-line"
                />
                <div className="min-w-0">
                  <p className="text-[9.5px] font-bold leading-6 text-ink-soft">{product.name}</p>
                  <p className="mt-1 text-[8px] text-mute">فروشنده: Hadi Digital</p>
                  <p className="text-[8px] text-mute">۱۸ ماه گارانتی</p>
                </div>
              </div>
              <p className="mt-2 flex items-baseline gap-1 text-[16px] font-black text-ink">
                {faNumber(product.price)}
                <span className="text-[8px] font-normal text-mute">تومان</span>
              </p>
              <a
                href="#buybox"
                className="btn btn-primary mt-2 flex h-9 w-full items-center justify-center text-[9px]"
              >
                مشاهده و خرید
              </a>
            </aside>
          </div>
        }
        specs={
          <div>
            <h3 className="text-[13px] font-black text-ink">
              مشخصات
              <span className="mt-2 block h-0.5 w-12 rounded-full bg-coral" aria-hidden />
            </h3>
            <table className="mt-4 w-full table-fixed border-collapse text-[10.5px]">
              <tbody>
                {specRows.map(([label, value], index) => (
                  <tr key={`${label}-${index}`} className={index % 2 === 0 ? "bg-[#fafafa]" : ""}>
                    <th className="w-[24%] border-b border-line/70 px-3 py-2.5 text-start align-top font-normal text-mute">
                      {label}
                    </th>
                    <td className="w-[38%] border-b border-line/70 px-3 py-2.5 align-top font-semibold text-ink-soft">
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
        reviews={
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-[13px] font-black text-ink">
                  <span className="h-4 w-[3px] rounded-full bg-coral" aria-hidden />
                  امتیاز و دیدگاه کاربران
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-[13px] font-black text-ink">
                    <StarIcon className="size-4 text-gold" />
                    {faNumber(Number(product.rating.toFixed(1)))}
                  </span>
                  <span className="text-[9px] text-mute">از ۵ · {faNumber(product.reviewCount)} امتیاز ثبت‌شده</span>
                </div>
              </div>
              <a
                href="#review-form"
                className="flex h-8 items-center justify-center rounded-md border border-coral px-3 text-[9px] font-bold text-coral"
              >
                ثبت دیدگاه
              </a>
            </div>

            <div className="mt-3 rounded-lg bg-[#f7f7ff] p-3">
              <p className="text-[10px] font-black text-ink">خلاصه امتیاز خریداران</p>
              <p className="mt-1 text-[9px] leading-6 text-ink-soft">
                میانگین امتیاز این محصول {faNumber(Number(product.rating.toFixed(1)))} از ۵ است و{" "}
                {faNumber(product.reviewCount)} کاربر آن را ارزیابی کرده‌اند. برای دیدن تجربهٔ خریداران،
                دیدگاه‌های زیر را بخوانید.
              </p>
            </div>

            <div className="mt-4 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
              <div className="space-y-2.5">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <article key={review.id} className="border-b border-line/70 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#fff0f3] text-[9px] font-black text-coral">
                          {review.name.slice(0, 1)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[9.5px] font-black text-ink-soft">{review.name}</p>
                          <p className="text-[7.5px] text-mute">{faDate(review.createdAt)}</p>
                        </div>
                        <div className="ms-auto flex items-center gap-0.5" aria-label={`${review.rating} از ۵`}>
                          {[1, 2, 3, 4, 5].map((value) => (
                            <StarIcon
                              key={value}
                              className={`size-3 ${value <= review.rating ? "text-gold" : "text-[#e0e0e2]"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-2 text-[9.5px] leading-6 text-ink-soft">{review.body}</p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-line px-4 py-8 text-center">
                    <p className="text-[10px] font-bold text-ink-soft">هنوز نظر نوشته‌شده‌ای ثبت نشده.</p>
                    <p className="mt-1 text-[8.5px] text-mute">اولین نفری باش که تجربه‌اش را می‌نویسد.</p>
                  </div>
                )}
              </div>

              <div id="review-form" className="scroll-mt-32">
                <ReviewForm productId={product.id} />
              </div>
            </div>
          </div>
        }
        questions={
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-[13px] font-black text-ink">
                <span className="h-4 w-[3px] rounded-full bg-coral" aria-hidden />
                پرسش‌ها
              </h3>
              <Link href="/about#contact" className="flex h-8 items-center rounded-md border border-coral px-3 text-[9px] font-bold text-coral">
                ثبت پرسش
              </Link>
            </div>

            <div className="mt-2 divide-y divide-line/70">
              {faqs.map((faq) => (
                <div key={faq.q} className="py-3">
                  <p className="flex items-start gap-1.5 text-[10px] font-black leading-6 text-ink-soft">
                    <CheckIcon className="mt-1 size-3.5 shrink-0 text-mute" />
                    {faq.q}
                  </p>
                  <div className="ms-5 mt-1.5 rounded-lg bg-[#f7f7f8] px-3 py-2 text-[9px] leading-6 text-ink-soft">
                    <p className="mb-1 flex items-center gap-1.5 text-[7.5px] text-mute">
                      <span className="rounded bg-[#fff3e0] px-1 py-0.5 text-[6.5px] font-black text-[#b26a00]">
                        پشتیبانی
                      </span>
                      Hadi Digital
                    </p>
                    {faq.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      />

      {bundle.length > 0 ? (
        <section className="mt-3.5 rounded-[10px] border border-line bg-paper p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-[14px] font-black text-ink">
              <span className="h-4 w-[3px] rounded-full bg-coral" aria-hidden />
              در کنارش خریداری شده
            </h2>
            <AddAllToCart lines={bundle.map(toCartLine)} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {bundle.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="h-16 lg:hidden" aria-hidden />
      <MobileBuyBar line={toCartLine(product)} />
    </div>
  );
}
