import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeftIcon, SearchIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product-card";
import {
  ActiveFilterChips,
  CategoryPanel,
  FiltersPanel,
} from "@/components/product-filters";
import { ProductPagination } from "@/components/product-pagination";
import { getBrands, getCategories, getCategoryCounts, getPriceBounds, getProductCount, getProducts } from "@/lib/data";
import { faNumber } from "@/lib/format";
import {
  buildProductsUrl,
  parseProductListParams,
  PRODUCTS_PAGE_SIZE,
  toProductQuery,
  type ProductListParams,
} from "@/lib/product-query";

type Search = Record<string, string | string[] | undefined>;

export const metadata = {
  title: "فروشگاه گجت و کالای دیجیتال",
  description:
    "همه محصولات Hadi Digital: هدفون، ساعت هوشمند، موبایل، لپ‌تاپ، گیمینگ و خانه هوشمند با قیمت و موجودی به‌روز.",
};

const sortOptions = [
  { value: "featured", label: "پیشنهادی" },
  { value: "new", label: "جدیدترین" },
  { value: "cheap", label: "ارزان‌ترین" },
  { value: "expensive", label: "گران‌ترین" },
  { value: "rating", label: "محبوب‌ترین" },
];

function ResultsSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-80 animate-pulse rounded-lg border border-line bg-paper" />
      ))}
    </div>
  );
}

export default function ProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  return (
    <div className="container-x py-4">
      <div className="max-w-2xl">
        <p className="eyebrow">فروشگاه</p>
        <h1 className="mt-3 text-2xl font-black sm:text-3xl">همه گجت‌ها، یک‌جا</h1>
        <p className="mt-2 text-xs leading-6 text-mute">
          با فیلتر قیمت، برند، امتیاز و موجودی سریع‌تر به انتخاب درست برس؛ همه محصولات با گارانتی
          ۱۸ ماهه.
        </p>
      </div>

      <Suspense fallback={<ResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: Promise<Search> }) {
  const raw = await searchParams;
  const parsed = parseProductListParams(raw);
  const filters = toProductQuery(parsed);

  const [categories, brands, counts, total, allTotal, priceBounds] = await Promise.all([
    getCategories(),
    getBrands(),
    getCategoryCounts(),
    getProductCount(filters),
    getProductCount(),
    getPriceBounds(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE));
  const page = Math.min(parsed.page, totalPages);
  const params: ProductListParams = { ...parsed, page };

  const products = await getProducts({
    ...filters,
    limit: PRODUCTS_PAGE_SIZE,
    offset: (page - 1) * PRODUCTS_PAGE_SIZE,
  });

  const activeCategory = categories.find((item) => item.slug === params.category);
  const start = total === 0 ? 0 : (page - 1) * PRODUCTS_PAGE_SIZE + 1;
  const end = Math.min(page * PRODUCTS_PAGE_SIZE, total);
  const filterProps = { categories, counts, brands, params, total: allTotal, priceBounds };

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-[15rem_1fr]">
      <aside className="min-w-0 md:sticky md:top-32 md:h-fit">
        <FiltersPanel {...filterProps} className="hidden md:block" />

        <div className="mt-3">
          <CategoryPanel {...filterProps} />
        </div>

        <div className="mt-3 hidden overflow-hidden rounded-xl bg-violet p-4 text-white md:block">
          <p className="text-[10px] font-black text-white">مشاوره خرید</p>
          <p className="mt-1.5 text-xs font-bold leading-6">
            مطمئن نیستی کدام گجت مناسبته؟
          </p>
          <p className="mt-1 text-[10px] text-white/60">تیم پشتیبانی هر روز ۹ تا ۲۱ پاسخ می‌دهد.</p>
          <a href="tel:+989929999999" className="btn btn-lime mt-3 h-9 px-3 text-[11px]">
            تماس با کارشناس
          </a>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="shrink-0 text-[10.5px] font-bold text-mute">مرتب‌سازی:</span>
            {sortOptions.map((option) => {
              const active = (params.sort ?? "featured") === option.value;
              return (
                <Link
                  key={option.value}
                  href={buildProductsUrl(params, { sort: option.value, page: 1 })}
                  className={`shrink-0 rounded-md border px-2.5 py-1.5 text-[10.5px] font-bold transition ${
                    active
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-paper text-ink-soft hover:border-ink/30"
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
          <p className="text-[10.5px] font-bold text-mute">
            {total > 0 ? (
              <>
                نمایش {faNumber(start)} تا {faNumber(end)} از {faNumber(total)} محصول
              </>
            ) : (
              "بدون نتیجه"
            )}
            {activeCategory ? ` در «${activeCategory.name}»` : ""}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <ActiveFilterChips categories={categories} counts={counts} params={params} total={total} />
        </div>

        <details className="mt-3 md:hidden">
          <summary className="surface flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-extrabold">
            فیلترها
            <span className="text-[10px] font-bold text-coral">قیمت، برند، امتیاز</span>
          </summary>
          <FiltersPanel {...filterProps} className="mt-2" />
        </details>

        {products.length > 0 ? (
          <>
            <div className="mt-4">
              <ProductGrid products={products} />
            </div>
            <ProductPagination params={params} total={total} />
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-line bg-paper px-6 py-14 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#f2f3f5] text-mute">
              <SearchIcon className="size-7" />
            </span>
            <h2 className="mt-4 text-lg font-black">چیزی پیدا نکردیم</h2>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-mute">
              فیلترها را ساده‌تر کن یا عبارت دیگری جستجو کن. شاید گجت مورد علاقه‌ات در دسته دیگری
              باشد.
            </p>
            <Link href="/products" className="btn btn-primary mt-5">
              دیدن همه محصولات
              <ArrowLeftIcon className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
