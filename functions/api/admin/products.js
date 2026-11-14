
const enc = new TextEncoder();

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

async function authorized(request, env) {
  if (!env.ADMIN_SESSION_SECRET) return false;

  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.split(";")
    .map(x => x.trim())
    .find(x => x.startsWith("dd_admin="))
    ?.slice(9);

  if (!token) return false;

  const match = /^admin\.(\d+)\.([a-f0-9]{64})$/.exec(token);
  if (!match) return false;

  const expires = Number(match[1]);
  if (!Number.isSafeInteger(expires) ||
      expires <= Date.now() / 1000) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(env.ADMIN_SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signature = new Uint8Array(
    match[2].match(/.{2}/g).map(x => parseInt(x, 16))
  );

  return crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    enc.encode(`admin.${match[1]}`)
  );
}

export async function onRequestGet({ request, env }) {
  if (!(await authorized(request, env))) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (!env.DB) {
    return json({ error: "Database not connected" }, 503);
  }

  try {
    const result = await env.DB.prepare(
      `SELECT sku, name, variant, price_centavos,
              stock, enabled
       FROM store_variants
       ORDER BY name, variant`
    ).all();

    return json({ products: result.results || [] });
  } catch {
    return json({ error: "Unable to load products" }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  if (!(await authorized(request, env))) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (new URL(request.url).origin !==
      request.headers.get("Origin")) {
    return json({ error: "Invalid origin" }, 403);
  }

  if (!(request.headers.get("Content-Type") || "")
      .toLowerCase().startsWith("application/json")) {
    return json({ error: "JSON required" }, 415);
  }

  if (!env.DB) {
    return json({ error: "Database not connected" }, 503);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const sku = data?.sku;
  const price = data?.price_centavos;
  const stock = data?.stock;
  const enabled = data?.enabled;

  if (typeof sku !== "string" ||
      sku.length < 1 || sku.length > 150 ||
      !Number.isSafeInteger(price) ||
      price < 1 || price > 1000000000 ||
      !Number.isSafeInteger(stock) ||
      stock < 0 || stock > 100000 ||
      ![0, 1].includes(enabled)) {
    return json({ error: "Invalid product values" }, 400);
  }

  try {
    const result = await env.DB.prepare(
      `UPDATE store_variants
       SET price_centavos = ?,
           stock = ?,
           enabled = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE sku = ?`
    ).bind(price, stock, enabled, sku).run();

    if (!result.meta?.changes) {
      return json({ error: "Product not found" }, 404);
    }

    return json({ ok: true });
  } catch {
    return json({ error: "Unable to save product" }, 500);
  }
}
