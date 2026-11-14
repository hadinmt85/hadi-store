import { cacheLife, cacheTag } from "next/cache";
import { query, withTransaction } from "@/lib/db";
import { brandToSlug } from "@/lib/brands";
import { shippingFor, shippingRules } from "@/lib/format";
import type { BrandInfo, Category, Order, OrderItem, Product, ProductQuery } from "@/lib/types";

type ProductRow = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  category_slug: string;
  category_name: string;
  emoji: string;
  image: string | null;
  gradient_from: string;
  gradient_to: string;
  price: number;
  old_price: number | null;
  rating: number;
  review_count: number;
  stock: number;
  badge: string | null;
  tagline: string;
  description: string;
  specs: unknown;
  featured: boolean | number;
  created_at: string | Date;
};

type OrderRow = {
  id: number;
  code: string;
  customer_name: string;
  phone: string;
  address: string;
  postal_code: string;
  note: string;
  shipping: number;
  subtotal: number;
  total: number;
  status: string;
  created_at: string | Date;
};

type OrderItemRow = {
  order_id: number;
  product_id: number;
  name: string;
  emoji: string;
  price: number;
  qty: number;
};

const PRODUCT_SELECT = `
  SELECT p.id, p.slug, p.name, p.brand, p.category_slug, c.name AS category_name,
         p.emoji, p.image, p.gradient_from, p.gradient_to, p.price, p.old_price, p.rating,
         p.review_count, p.stock, p.badge, p.tagline, p.description, p.specs,
         p.featured, p.created_at
  FROM products p
  JOIN categories c ON c.slug = p.category_slug
`;

function parseSpecs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      return [];
    }
  }
  return [];
}

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapProduct(row: ProductRow): Product {
  return {
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    emoji: row.emoji,
    image: row.image,
    gradientFrom: row.gradient_from,
    gradientTo: row.gradient_to,
    price: Number(row.price),
    oldPrice: row.old_price === null ? null : Number(row.old_price),
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    stock: Number(row.stock),
    badge: row.badge,
    tagline: row.tagline,
    description: row.description,
    specs: parseSpecs(row.specs),
    featured: row.featured === true || Number(row.featured) === 1,
    createdAt: toIso(row.created_at),
  };
}

function mapOrderItems(rows: OrderItemRow[]): OrderItem[] {
  return rows.map((row) => ({
    productId: Number(row.product_id),
    name: row.name,
    emoji: row.emoji,
    price: Number(row.price),
    qty: Number(row.qty),
  }));
}

function mapOrder(row: OrderRow, items: OrderItemRow[]): Order {
  return {
    id: Number(row.id),
    code: row.code,
    customerName: row.customer_name,
    phone: row.phone,
    address: row.address,
    postalCode: row.postal_code,
    note: row.note,
    shipping: Number(row.shipping),
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    status: row.status,
    createdAt: toIso(row.created_at),
    items: mapOrderItems(items),
  };
}

const SORT_MAP: Record<string, string> = {
  featured: "p.featured DESC, p.review_count DESC",
  new: "p.created_at DESC",
  cheap: "p.price ASC",
  expensive: "p.price DESC",
  rating: "p.rating DESC, p.review_count DESC",
};

/** شرط‌های مشترک فیلتر محصولات برای لیست و شمارش. */
function buildProductWhere(filters: ProductQuery): { where: string; params: unknown[] } {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.category) {
    params.push(filters.category);
    where.push(`p.category_slug = $${params.length}`);
  }

  if (filters.q && filters.q.trim().length > 0) {
    params.push(`%${filters.q.trim()}%`);
    const index = params.length;
    where.push(`(p.name ILIKE $${index} OR p.brand ILIKE $${index} OR p.tagline ILIKE $${index})`);
  }

  if (filters.brands && filters.brands.length > 0) {
    params.push(filters.brands);
    where.push(`p.brand = ANY($${params.length}::text[])`);
  }

  if (typeof filters.minPrice === "number" && Number.isFinite(filters.minPrice)) {
    params.push(filters.minPrice);
    where.push(`p.price >= $${params.length}`);
  }

  if (typeof filters.maxPrice === "number" && Number.isFinite(filters.maxPrice)) {
    params.push(filters.maxPrice);
    where.push(`p.price <= $${params.length}`);
  }

  if (typeof filters.minRating === "number" && Number.isFinite(filters.minRating)) {
    params.push(filters.minRating);
    where.push(`p.rating >= $${params.length}`);
  }

  if (filters.inStock) {
    where.push("p.stock > 0");
  }

  if (filters.freeShipping) {
    params.push(shippingRules.freeThreshold);
    where.push(`p.price >= $${params.length}`);
  }

  return { where: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

/* -------------------------------------------------------------------------- */
/* خواندن داده‌ها (کش‌شده در Next.js با tag محصولات)                            */
/* -------------------------------------------------------------------------- */

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const rows = await query<Category>("SELECT slug, name, emoji, color FROM categories ORDER BY sort_order ASC");
  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
  }));
}

export async function getProducts(filters: ProductQuery = {}): Promise<Product[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const { where, params } = buildProductWhere(filters);
  const orderBy = SORT_MAP[filters.sort ?? "featured"] ?? SORT_MAP.featured;
  const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 60;
  const offset = filters.offset && filters.offset > 0 ? Math.floor(filters.offset) : 0;

  const sql = `${PRODUCT_SELECT}
    ${where}
    ORDER BY ${orderBy}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  const rows = await query<ProductRow>(sql, [...params, limit, offset]);
  return rows.map(mapProduct);
}

export async function getProductCount(filters: ProductQuery = {}): Promise<number> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const { where, params } = buildProductWhere(filters);
  const rows = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM products p ${where}`,
    params,
  );
  return Number(rows[0]?.count ?? 0);
}

export async function getPriceBounds(): Promise<{ min: number; max: number }> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const rows = await query<{ min: number | null; max: number | null }>(
    `SELECT MIN(price)::int AS min, MAX(price)::int AS max FROM products`,
  );
  const step = 100_000;
  const rawMin = Number(rows[0]?.min ?? 0);
  const rawMax = Number(rows[0]?.max ?? 100_000_000);
  const min = Math.max(0, Math.floor(rawMin / step) * step);
  const max = Math.max(min + step, Math.ceil(rawMax / step) * step);
  return { min, max };
}

export async function getBrands(): Promise<BrandInfo[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const rows = await query<{ brand: string; count: number }>(
    `SELECT p.brand, COUNT(*)::int AS count
     FROM products p
     GROUP BY p.brand
     ORDER BY count DESC, p.brand ASC`,
  );

  return rows.map((row) => ({
    name: row.brand,
    slug: brandToSlug(row.brand),
    count: Number(row.count),
  }));
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const rows = await query<{ category_slug: string; count: number }>(
    "SELECT category_slug, COUNT(*)::int AS count FROM products GROUP BY category_slug",
  );

  return Object.fromEntries(rows.map((row) => [row.category_slug, Number(row.count)]));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const rows = await query<ProductRow>(`${PRODUCT_SELECT} WHERE p.slug = $1`, [slug]);
  return rows[0] ? mapProduct(rows[0]) : null;
}

export async function getRelatedProducts(
  productId: number,
  categorySlug: string,
  limit = 4,
): Promise<Product[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const rows = await query<ProductRow>(
    `${PRODUCT_SELECT} WHERE p.category_slug = $1 AND p.id != $2 ORDER BY p.rating DESC LIMIT $3`,
    [categorySlug, productId, limit],
  );

  if (rows.length >= limit) return rows.map(mapProduct);

  const fill = await query<ProductRow>(
    `${PRODUCT_SELECT} WHERE p.id != $1 ORDER BY p.review_count DESC LIMIT $2`,
    [productId, limit * 3],
  );

  const seen = new Set(rows.map((row) => Number(row.id)));
  const merged = [...rows];
  for (const row of fill) {
    if (merged.length >= limit) break;
    if (seen.has(Number(row.id))) continue;
    seen.add(Number(row.id));
    merged.push(row);
  }
  return merged.map(mapProduct);
}

export async function getFrequentlyBoughtTogether(
  productId: number,
  limit = 3,
): Promise<Product[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const rows = await query<ProductRow>(
    `${PRODUCT_SELECT}
     WHERE p.id IN (
       SELECT oi2.product_id
       FROM order_items oi
       JOIN order_items oi2 ON oi2.order_id = oi.order_id AND oi2.product_id <> oi.product_id
       WHERE oi.product_id = $1
       GROUP BY oi2.product_id
       ORDER BY COUNT(*) DESC
       LIMIT $2
     )
     ORDER BY p.rating DESC`,
    [productId, limit],
  );

  return rows.map(mapProduct);
}

export async function getProductSlugs(): Promise<string[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const rows = await query<{ slug: string }>("SELECT slug FROM products ORDER BY id ASC");
  return rows.map((row) => row.slug);
}

/* -------------------------------------------------------------------------- */
/* سفارش‌ها (بدون کش؛ همیشه تازه)                                              */
/* -------------------------------------------------------------------------- */

export async function getOrder(id: number): Promise<Order | null> {
  return loadOrder("id", id);
}

export async function getOrderByCode(code: string): Promise<Order | null> {
  if (!/^GL-\d{6}$/.test(code)) return null;
  return loadOrder("code", code);
}

async function loadOrder(column: "id" | "code", value: number | string): Promise<Order | null> {
  const rows = await query<OrderRow>(`SELECT * FROM orders WHERE ${column} = $1`, [value]);
  if (!rows[0]) return null;

  const id = Number(rows[0].id);
  const items = await query<OrderItemRow>(
    "SELECT order_id, product_id, name, emoji, price, qty FROM order_items WHERE order_id = $1",
    [id],
  );
  return mapOrder(rows[0], items);
}

export async function getOrders(limit = 50): Promise<Order[]> {
  const rows = await query<OrderRow>("SELECT * FROM orders ORDER BY id DESC LIMIT $1", [limit]);
  if (rows.length === 0) return [];

  const ids = rows.map((row) => Number(row.id));
  const items = await query<OrderItemRow>(
    "SELECT order_id, product_id, name, emoji, price, qty FROM order_items WHERE order_id = ANY($1::int[])",
    [ids],
  );

  const grouped = new Map<number, OrderItemRow[]>();
  for (const item of items) {
    const key = Number(item.order_id);
    const list = grouped.get(key);
    if (list) list.push(item);
    else grouped.set(key, [item]);
  }

  return rows.map((row) => mapOrder(row, grouped.get(Number(row.id)) ?? []));
}

export type NewOrderInput = {
  customerName: string;
  phone: string;
  address: string;
  postalCode: string;
  note: string;
  items: { productId: number; qty: number }[];
};

export type NewOrderResult = { ok: true; order: Order } | { ok: false; error: string };

class OrderError extends Error {}

/**
 * سفارش را با قیمت‌های واقعی دیتابیس و در یک تراکنش ثبت می‌کند.
 * قیمت‌های ارسالی از سمت کلاینت هرگز اعتماد نمی‌شوند.
 */
export async function createOrder(input: NewOrderInput): Promise<NewOrderResult> {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, error: "سبد خرید خالی است." };
  }

  try {
    const orderId = await withTransaction(async (q) => {
      const ids = [...new Set(input.items.map((item) => Number(item.productId)))].filter((id) =>
        Number.isInteger(id),
      );

      if (ids.length === 0) throw new OrderError("اقلام سفارش معتبر نیستند.");

      const rows = await q<ProductRow>(`${PRODUCT_SELECT} WHERE p.id = ANY($1::int[])`, [ids]);
      const byId = new Map(rows.map((row) => [Number(row.id), mapProduct(row)]));

      const lines: { product: Product; qty: number }[] = [];
      const requested = new Map<number, number>();

      for (const item of input.items) {
        const product = byId.get(Number(item.productId));
        if (!product) throw new OrderError("یکی از محصولات سبد خرید یافت نشد.");

        const qty = Math.floor(Number(item.qty));
        if (!Number.isFinite(qty) || qty < 1) throw new OrderError("تعداد محصول نامعتبر است.");

        const totalQty = (requested.get(product.id) ?? 0) + qty;
        requested.set(product.id, totalQty);
        if (totalQty > product.stock) {
          throw new OrderError(
            `موجودی «${product.name}» کافی نیست. (حداکثر ${product.stock} عدد)`,
          );
        }
        lines.push({ product, qty });
      }

      const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
      const shipping = shippingFor(subtotal);
      const total = subtotal + shipping;
      const code = `GL-${Math.floor(100000 + Math.random() * 900000)}`;

      const inserted = await q<{ id: number }>(
        `INSERT INTO orders
          (code, customer_name, phone, address, postal_code, note, shipping, subtotal, total, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          code,
          input.customerName.trim(),
          input.phone.trim(),
          input.address.trim(),
          input.postalCode.trim(),
          input.note.trim(),
          shipping,
          subtotal,
          total,
          "در حال پردازش",
        ],
      );

      const newOrderId = Number(inserted[0].id);

      for (const line of lines) {
        await q(
          `INSERT INTO order_items (order_id, product_id, name, emoji, price, qty)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newOrderId, line.product.id, line.product.name, line.product.emoji, line.product.price, line.qty],
        );

        const updated = await q<{ id: number }>(
          "UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING id",
          [line.qty, line.product.id],
        );
        if (updated.length === 0) {
          throw new OrderError(`موجودی «${line.product.name}» کافی نیست.`);
        }
      }

      return newOrderId;
    });

    const order = await getOrder(orderId);
    if (!order) return { ok: false, error: "ثبت سفارش ناموفق بود." };
    return { ok: true, order };
  } catch (error) {
    if (error instanceof OrderError) return { ok: false, error: error.message };
    return { ok: false, error: "خطا در ثبت سفارش. لطفاً دوباره تلاش کنید." };
  }
}

export async function updateOrderStatus(id: number, status: string): Promise<boolean> {
  const rows = await query<{ id: number }>(
    "UPDATE orders SET status = $1 WHERE id = $2 RETURNING id",
    [status, id],
  );
  return rows.length > 0;
}

export async function getStats() {
  const rows = await query<{
    orders: number;
    revenue: string | number;
    products: number;
    low_stock: number;
  }>(`
    SELECT
      (SELECT count(*)::int FROM orders) AS orders,
      (SELECT COALESCE(sum(total), 0)::bigint FROM orders) AS revenue,
      (SELECT count(*)::int FROM products) AS products,
      (SELECT count(*)::int FROM products WHERE stock <= 5) AS low_stock
  `);

  const row = rows[0];
  return {
    orders: Number(row?.orders ?? 0),
    revenue: Number(row?.revenue ?? 0),
    products: Number(row?.products ?? 0),
    lowStock: Number(row?.low_stock ?? 0),
  };
}

export async function createProduct(input: {
  name: string;
  brand: string;
  categorySlug: string;
  emoji: string;
  image: string | null;
  gradientFrom: string;
  gradientTo: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  tagline: string;
  description: string;
  specs: string[];
}): Promise<number> {
  const slug = `p-${Date.now().toString(36)}`;
  const rows = await query<{ id: number }>(
    `INSERT INTO products
      (slug, name, brand, category_slug, emoji, image, gradient_from, gradient_to, price, old_price,
       rating, review_count, stock, badge, tagline, description, specs, featured)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18)
     RETURNING id`,
    [
      slug,
      input.name,
      input.brand,
      input.categorySlug,
      input.emoji,
      input.image,
      input.gradientFrom,
      input.gradientTo,
      input.price,
      input.oldPrice,
      4.5,
      0,
      input.stock,
      "جدید",
      input.tagline,
      input.description,
      JSON.stringify(input.specs),
      true,
    ],
  );
  return Number(rows[0].id);
}
