import Link from "next/link";
import { CategoryIcon } from "@/components/category-icon";
import { CloseIcon } from "@/components/icons";
import { PriceRangeSlider } from "@/components/price-range-slider";
import { categoryGroups } from "@/lib/category-groups";
import { buildProductsUrl, ratingOptions, type ProductListParams } from "@/lib/product-query";
import { faNumber } from "@/lib/format";
import type { BrandInfo, Category } from "@/lib/types";

type FilterProps = {
  categories: Category[];
  counts: Record<string, number>;
  brands: BrandInfo[];
  params: ProductListParams;
  total: number;
  priceBounds?: { min: number; max: number };
};

export function CategoryPanel({ categories, counts, params, total }: FilterProps) {
  const grouped = categoryGroups
    .map((group) => ({
      ...group,
      items: group.slugs
        .map((slug) => categories.find((category) => category.slug === slug))
        .filter((category): category is Category => Boolean(category)),
    }))
    .filter((group) => group.items.length > 0);

  const groupedSlugs = new Set(grouped.flatMap((group) => group.items.map((item) => item.slug)));
  const rest = categories.filter((category) => !groupedSlugs.has(category.slug));

  return (
    <div className="surface min-w-0 p-4">
      <p className="text-xs font-extrabold">دسته‌بندی</p>

      {/* موبایل: ریل افقی ساده */}
      <ul className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1 md:hidden">
        <li className="shrink-0">
          <Link
            href={buildProductsUrl(params, { category: undefined, page: 1 })}
            className={`flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-2 text-[11.5px] font-bold transition ${
              !params.category ? "bg-ink text-white" : "text-ink-soft hover:bg-[#f5f5f6]"
            }`}
          >
            همه محصولات
            <span className="rounded-full bg-current/10 px-1.5 text-[0.6rem] opacity-60">
              {faNumber(total)}
            </span>
          </Link>
        </li>
        {categories.map((item) => {
          const active = item.slug === params.category;
          return (
            <li key={item.slug} className="shrink-0">
              <Link
                href={buildProductsUrl(params, { category: item.slug, page: 1 })}
                className={`flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-2 text-[11.5px] font-bold transition ${
                  active ? "bg-ink text-white" : "text-ink-soft hover:bg-[#f5f5f6]"
                }`}
              >
                <CategoryIcon slug={item.slug} className="size-4" />
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* دسکتاپ: منوی دو سطحی */}
      <div className="mt-3 hidden md:block">
        <Link
          href={buildProductsUrl(params, { category: undefined, page: 1 })}
          className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-[11.5px] font-bold transition ${
            !params.category ? "bg-ink text-white" : "text-ink-soft hover:bg-[#f5f5f6]"
          }`}
        >
          همه محصولات
          <span className="rounded-full bg-current/10 px-1.5 text-[0.6rem] opacity-60">
            {faNumber(total)}
          </span>
        </Link>

        <div className="mt-2 space-y-3">
          {[...grouped, ...(rest.length > 0 ? [{ title: "سایر", slugs: [], items: rest }] : [])].map(
            (group) => (
              <div key={group.title}>
                <p className="px-2.5 text-[9.5px] font-bold tracking-wide text-mute/70">{group.title}</p>
                <ul className="mt-1 space-y-0.5 border-e border-line pe-1.5">
                  {group.items.map((item) => {
                    const active = item.slug === params.category;
                    return (
                      <li key={item.slug}>
                        <Link
                          href={buildProductsUrl(params, { category: item.slug, page: 1 })}
                          className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-bold transition ${
                            active ? "bg-[#fff0f3] text-coral" : "text-ink-soft hover:bg-[#f5f5f6]"
                          }`}
                        >
                          <CategoryIcon slug={item.slug} className="size-3.5 shrink-0" />
                          <span className="flex-1">{item.name}</span>
                          <span className="text-[9px] text-mute">{faNumber(counts[item.slug] ?? 0)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export function FiltersPanel({
  brands,
  params,
  priceBounds = { min: 0, max: 100_000_000 },
  className = "",
}: FilterProps & { className?: string }) {
  const resetHref = buildProductsUrl(params, {
    min: undefined,
    max: undefined,
    brands: [],
    rating: undefined,
    instock: undefined,
    free: undefined,
    page: 1,
  });

  return (
    <form
      action="/products"
      method="get"
      className={`surface p-4 ${className}`}
      aria-label="فیلتر محصولات"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-extrabold">فیلترها</p>
        <Link href={resetHref} className="text-[10px] font-bold text-mute transition hover:text-coral">
          حذف همه
        </Link>
      </div>

      {params.q ? <input type="hidden" name="q" value={params.q} /> : null}
      {params.category ? <input type="hidden" name="category" value={params.category} /> : null}
      {params.sort && params.sort !== "featured" ? (
        <input type="hidden" name="sort" value={params.sort} />
      ) : null}

      <div className="mt-4">
        <p className="text-[10.5px] font-bold text-ink-soft">محدودهٔ قیمت (تومان)</p>
        <PriceRangeSlider
          key={`${params.min ?? "min"}-${params.max ?? "max"}`}
          lowerBound={priceBounds.min}
          upperBound={priceBounds.max}
          initialMin={params.min}
          initialMax={params.max}
        />
      </div>

      <div className="mt-4 border-t border-line pt-3">
        <p className="text-[10.5px] font-bold text-ink-soft">برند</p>
        <div className="no-scrollbar mt-2 max-h-44 space-y-1 overflow-y-auto pe-1">
          {brands.map((brand) => (
            <label
              key={brand.name}
              className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-[11px] text-ink-soft transition hover:bg-[#f7f7f8]"
            >
              <input
                type="checkbox"
                name="brand"
                value={brand.name}
                defaultChecked={params.brands.includes(brand.name)}
                className="size-3.5 accent-[#ef4056]"
              />
              <span className="flex-1">{brand.name}</span>
              <span className="text-[9px] text-mute">{faNumber(brand.count)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-line pt-3">
        <p className="text-[10.5px] font-bold text-ink-soft">امتیاز</p>
        <div className="mt-2 space-y-1">
          {ratingOptions.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-[11px] text-ink-soft transition hover:bg-[#f7f7f8]"
            >
              <input
                type="radio"
                name="rating"
                value={option.value}
                defaultChecked={params.rating === option.value}
                className="size-3.5 accent-[#ef4056]"
              />
              {option.label}
            </label>
          ))}
          {params.rating ? (
            <Link
              href={buildProductsUrl(params, { rating: undefined, page: 1 })}
              className="inline-flex items-center gap-1 px-1.5 text-[10px] font-bold text-coral"
            >
              <CloseIcon className="size-3" />
              حذف فیلتر امتیاز
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-1.5 border-t border-line pt-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-[11px] font-bold text-ink-soft">
          <input
            type="checkbox"
            name="instock"
            value="1"
            defaultChecked={params.instock === "1"}
            className="size-3.5 accent-[#ef4056]"
          />
          فقط کالاهای موجود
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-[11px] font-bold text-ink-soft">
          <input
            type="checkbox"
            name="free"
            value="1"
            defaultChecked={params.free === "1"}
            className="size-3.5 accent-[#ef4056]"
          />
          فقط با ارسال رایگان
        </label>
      </div>

      <button type="submit" className="btn btn-primary mt-4 h-9 w-full text-[11px]">
        اعمال فیلتر
      </button>
    </form>
  );
}

export function ActiveFilterChips({ categories, params, total }: Omit<FilterProps, "brands">) {
  const chips: { key: string; label: string; href: string }[] = [];
  const activeCategory = categories.find((category) => category.slug === params.category);

  if (params.q) {
    chips.push({
      key: "q",
      label: `جستجو: ${params.q}`,
      href: buildProductsUrl(params, { q: undefined, page: 1 }),
    });
  }

  if (activeCategory) {
    chips.push({
      key: "category",
      label: activeCategory.name,
      href: buildProductsUrl(params, { category: undefined, page: 1 }),
    });
  }

  for (const brand of params.brands) {
    chips.push({
      key: `brand-${brand}`,
      label: brand,
      href: buildProductsUrl(params, {
        brands: params.brands.filter((item) => item !== brand),
        page: 1,
      }),
    });
  }

  if (params.min || params.max) {
    chips.push({
      key: "price",
      label: `قیمت ${params.min ? `از ${faNumber(Number(params.min))}` : ""}${
        params.max ? ` تا ${faNumber(Number(params.max))}` : ""
      }`,
      href: buildProductsUrl(params, { min: undefined, max: undefined, page: 1 }),
    });
  }

  if (params.rating) {
    chips.push({
      key: "rating",
      label: `امتیاز ${faNumber(Number(params.rating))} به بالا`,
      href: buildProductsUrl(params, { rating: undefined, page: 1 }),
    });
  }

  if (params.instock === "1") {
    chips.push({
      key: "instock",
      label: "فقط موجود",
      href: buildProductsUrl(params, { instock: undefined, page: 1 }),
    });
  }

  if (params.free === "1") {
    chips.push({
      key: "free",
      label: "ارسال رایگان",
      href: buildProductsUrl(params, { free: undefined, page: 1 }),
    });
  }

  if (chips.length === 0) {
    return (
      <p className="text-[10.5px] font-bold text-mute">
        {faNumber(total)} محصول برای نمایش
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2.5 py-1 text-[10px] font-bold text-ink-soft transition hover:border-coral/40 hover:text-coral"
        >
          {chip.label}
          <CloseIcon className="size-3" />
        </Link>
      ))}
      <Link
        href={buildProductsUrl(params, {
          q: undefined,
          category: undefined,
          min: undefined,
          max: undefined,
          brands: [],
          rating: undefined,
          instock: undefined,
          free: undefined,
          page: 1,
        })}
        className="text-[10px] font-bold text-coral hover:underline"
      >
        حذف همه
      </Link>
    </div>
  );
}
