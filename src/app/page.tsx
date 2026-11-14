import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "@/components/category-icon";
import { DealCountdown } from "@/components/deal-countdown";
import {
  ArrowLeftIcon,
  CardIcon,
  CheckIcon,
  ReturnIcon,
  ShieldIcon,
  TruckIcon,
} from "@/components/icons";
import { ProductCard, ProductGrid } from "@/components/product-card";
import { PersonalizedRails } from "@/components/personalized-rails";
import { brandToSlug } from "@/lib/brands";
import { getCategories, getProducts } from "@/lib/data";
import { discountPercent, faNumber, toman } from "@/lib/format";

const brands = ["Sony", "Samsung", "Xiaomi", "JBL", "Logitech", "Anker", "DJI", "Lenovo"];

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const trustItems = [
  { icon: TruckIcon, title: "ارسال سریع", text: "تهران ۲۴ ساعته" },
  { icon: ShieldIcon, title: "ضمانت اصالت", text: "۱۸ ماه گارانتی" },
  { icon: ReturnIcon, title: "۷ روز بازگشت", text: "بدون قید و شرط" },
  { icon: CardIcon, title: "پرداخت امن", text: "درگاه معتبر" },
];

export default async function HomePage() {
  const [categories, products, newest] = await Promise.all([
    getCategories(),
    getProducts({ limit: 100 }),
    getProducts({ sort: "new", limit: 5 }),
  ]);

  const deals = products.filter((product) => product.oldPrice).slice(0, 5);
  const popular = products.slice(0, 10);
  const spotlight =
    products.find((product) => product.slug === "iris-pro-headphones") ?? products[0];
  const gaming = products.find((product) => product.categorySlug === "gaming");
  const phone = products.find((product) => product.categorySlug === "mobile");
  const spotlightOff = spotlight ? discountPercent(spotlight.price, spotlight.oldPrice) : 0;

  return (
    <div className="container-x space-y-3 py-4">
      {/* hero */}
      <section className="grid gap-3 rounded-xl border border-line bg-paper p-2.5 lg:grid-cols-[212px_1fr_196px]">
        <aside className="min-w-0">
          <ul className="no-scrollbar flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-0 lg:overflow-visible lg:border-e lg:border-line lg:pe-1.5 lg:pb-0">
            {categories.map((category) => (
              <li key={category.slug} className="shrink-0 lg:block">
                <Link
                  href={`/products?category=${category.slug}`}
                  className="flex items-center justify-between gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] text-ink-soft transition hover:bg-[#f5f5f6] hover:text-ink lg:text-[11.5px]"
                >
                  <span>{category.name}</span>
                  <svg
                    viewBox="0 0 24 24"
                    className="hidden size-3 shrink-0 text-[#c2c2c9] lg:block"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="m14 6-6 6 6 6" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <div
          className="relative flex min-h-[300px] items-center overflow-hidden rounded-lg p-6 text-white sm:p-7"
          style={{ backgroundImage: "linear-gradient(140deg,#3f4064,#ef4056 58%,#ff6b81)" }}
        >
          <div className="grid-dots pointer-events-none absolute inset-0 opacity-30" aria-hidden />
          {spotlight?.image ? (
            <Image
              src={spotlight.image}
              alt=""
              width={320}
              height={320}
              priority
              className="absolute -bottom-12 -left-14 hidden size-[300px] rotate-[-8deg] rounded-full object-cover shadow-2xl sm:block"
            />
          ) : null}
          <div className="relative z-10 max-w-[280px]">
            <span className="inline-block rounded-full bg-coral px-2.5 py-1 text-[10px] font-black text-white">
              حراج پاییزه Hadi Digital
            </span>
            <h1 className="mt-3 text-[26px] font-black leading-[1.4] sm:text-[30px]">
              تا ۴۰٪ تخفیف روی گجت‌های منتخب
            </h1>
            <p className="mt-2 max-w-[260px] text-[11px] leading-6 text-white/70">
              هدفون، ساعت هوشمند و لوازم گیمینگ؛ با گارانتی ۱۸ ماهه و ارسال سریع.
            </p>
            <Link
              href="/products?sort=cheap"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-[11.5px] font-extrabold text-ink transition hover:bg-cream"
            >
              خرید با تخفیف
              <ArrowLeftIcon className="size-4" />
            </Link>
          </div>
        </div>

        <div className="hidden flex-col gap-3 lg:flex">
          <Link
            href={spotlight ? `/products/${spotlight.slug}` : "/products"}
            className="flex flex-1 flex-col justify-between gap-3 rounded-lg bg-ink p-4 text-white"
          >
            <span className="text-[9px] font-bold text-white/55">پیشنهاد ویژه اعضا</span>
            <b className="text-[14px] font-black leading-6">
              {spotlight ? spotlight.name : "پیشنهادهای امروز"}
            </b>
            {spotlight ? (
              <span className="text-[11px] font-black text-white">
                {toman(spotlight.price)}
                {spotlightOff > 0 ? (
                  <span className="ms-1.5 text-[9px] font-bold text-[#ffb3bd]">
                    {faNumber(spotlightOff)}٪
                  </span>
                ) : null}
              </span>
            ) : null}
            <span className="text-[10px] font-bold text-white/80">مشاهده محصول ←</span>
          </Link>
          <Link
            href="/products"
            className="flex flex-1 flex-col justify-between gap-3 rounded-lg bg-coral p-4 text-white"
          >
            <span className="text-[9px] font-bold text-white/70">ارسال رایگان</span>
            <b className="text-[14px] font-black leading-6">سفارش بالای ۲ میلیون</b>
            <span className="text-[10px] font-bold">شروع خرید ←</span>
          </Link>
        </div>
      </section>

      {/* sub banners */}
      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/products?category=gaming"
          className="flex items-center gap-4 overflow-hidden rounded-xl p-5 text-white"
          style={{ backgroundImage: "linear-gradient(120deg,#3f4064,#5a5c86)" }}
        >
          <div>
            <b className="text-[15px] font-black">کالکشن گیمینگ</b>
            <p className="mt-1 text-[11px] text-white/75">
              کیبورد، ماوس و دسته بازی با تخفیف ویژه
            </p>
          </div>
          {gaming?.image ? (
            <Image
              src={gaming.image}
              alt=""
              width={64}
              height={64}
              className="ms-auto size-16 shrink-0 rounded-full border-2 border-white/30 object-cover"
            />
          ) : null}
        </Link>
        <Link
          href="/products?category=mobile"
          className="flex items-center gap-4 overflow-hidden rounded-xl p-5 text-white"
          style={{ backgroundImage: "linear-gradient(120deg,#ef4056,#ff6b81)" }}
        >
          <div>
            <b className="text-[15px] font-black">هفته موبایل</b>
            <p className="mt-1 text-[11px] text-white/75">گوشی و تبلت با گارانتی رسمی</p>
          </div>
          {phone?.image ? (
            <Image
              src={phone.image}
              alt=""
              width={64}
              height={64}
              className="ms-auto size-16 shrink-0 rounded-full border-2 border-white/30 object-cover"
            />
          ) : null}
        </Link>
      </section>

      {/* categories */}
      <section className="rounded-xl border border-line bg-paper px-3 py-4">
        <div className="grid grid-cols-4 gap-1 sm:grid-cols-6 lg:grid-cols-12">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="flex flex-col items-center gap-2 rounded-lg p-1.5 text-center transition hover:bg-[#f7f7f8]"
            >
              <span className="grid size-14 place-items-center rounded-full bg-[#f2f3f5] text-ink-soft">
                <CategoryIcon slug={category.slug} className="size-7" />
              </span>
              <span className="text-[10.5px] leading-4 text-ink-soft">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* personalized: recently viewed / buy again */}
      <PersonalizedRails products={products} />

      {/* offers */}
      <section className="overflow-hidden rounded-xl border border-line bg-paper">
        <div
          className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-white"
          style={{ backgroundImage: "linear-gradient(90deg,#ef4056,#ff6b81)" }}
        >
          <h2 className="flex items-center gap-2 text-[14px] font-black">
            <span className="grid size-6 place-items-center rounded-md bg-white/20 text-[13px]">
              ✦
            </span>
            پیشنهاد شگفت‌انگیز
          </h2>
          <DealCountdown />
          <Link
            href="/products?sort=cheap"
            className="ms-auto inline-flex items-center gap-1 text-[10px] font-bold"
          >
            مشاهده همه
            <ArrowLeftIcon className="size-3.5" />
          </Link>
        </div>
        <div className="flex overflow-x-auto p-2.5">
          {deals.map((product) => (
            <div
              key={product.id}
              className="min-w-[185px] flex-1 border-e border-line px-2 last:border-e-0"
            >
              <ProductCard product={product} bare />
            </div>
          ))}
        </div>
      </section>

      {/* popular */}
      <section className="rounded-xl border border-line bg-paper p-4">
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[15px] font-black">
            <span className="h-4 w-1 rounded-full bg-coral" aria-hidden />
            پرفروش‌ترین گجت‌ها
          </h2>
          <Link
            href="/products?sort=rating"
            className="inline-flex items-center gap-1 text-[10.5px] font-bold text-coral"
          >
            مشاهده همه
            <ArrowLeftIcon className="size-3.5" />
          </Link>
        </header>
        <ProductGrid products={popular} />
      </section>

      {/* new arrivals */}
      <section className="rounded-xl border border-line bg-paper p-4">
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[15px] font-black">
            <span className="h-4 w-1 rounded-full bg-violet" aria-hidden />
            تازه‌های Hadi Digital
          </h2>
          <Link
            href="/products?sort=new"
            className="inline-flex items-center gap-1 text-[10.5px] font-bold text-violet"
          >
            مشاهده همه
            <ArrowLeftIcon className="size-3.5" />
          </Link>
        </header>
        <ProductGrid products={newest} />
      </section>

      {/* brands */}
      <section className="flex flex-col gap-3 rounded-xl border border-line bg-paper px-4 py-3 sm:flex-row sm:items-center">
        <h3 className="shrink-0 text-[12px] font-extrabold">برندهای همراه Hadi Digital</h3>
        <div className="flex flex-1 flex-wrap items-center justify-around gap-x-6 gap-y-2 text-[13px] font-black text-[#b7b7bf]">
          {brands.map((brand) => (
            <Link
              key={brand}
              href={`/brands/${brandToSlug(brand)}`}
              className="transition-colors hover:text-coral"
            >
              {brand}
            </Link>
          ))}
        </div>
      </section>

      {/* trust */}
      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {trustItems.map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-2.5 rounded-xl border border-line bg-paper px-4 py-3"
          >
            <item.icon className="size-6 shrink-0 text-mute" />
            <div>
              <b className="block text-[11px] font-extrabold">{item.title}</b>
              <span className="mt-0.5 block text-[9.5px] text-mute">{item.text}</span>
            </div>
          </div>
        ))}
      </section>

      <div className="flex items-center justify-center gap-1.5 pb-2 pt-1 text-[10px] text-mute">
        <CheckIcon className="size-3.5 text-green" />
        خرید مطمئن از Hadi Digital؛ اصالت کالا و بازگشت وجه تضمین شده است.
      </div>
    </div>
  );
}
