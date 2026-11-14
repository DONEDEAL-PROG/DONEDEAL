
const encoder = new TextEncoder();

async function authorized(request, env) {
  if (!env.ADMIN_SESSION_SECRET) return false;

  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.split(";")
    .map(x => x.trim())
    .find(x => x.startsWith("dd_admin="))
    ?.slice(9);

  const match = /^admin\.(\d+)\.([a-f0-9]{64})$/.exec(token || "");
  if (!match) return false;

  const expires = Number(match[1]);
  if (!Number.isSafeInteger(expires) ||
      expires <= Date.now() / 1000) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.ADMIN_SESSION_SECRET),
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
    encoder.encode(`admin.${match[1]}`)
  );
}

export async function onRequestPost({ request, env }) {
  const headers = { "Cache-Control": "no-store" };

  if (!(await authorized(request, env))) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers }
    );
  }

  if (request.headers.get("Origin") !== new URL(request.url).origin) {
    return Response.json(
      { error: "Invalid origin" },
      { status: 403, headers }
    );
  }

  if (!env.DB || !env.IMAGES) {
    return Response.json(
      { error: "Database or image storage unavailable" },
      { status: 503, headers }
    );
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON" },
      { status: 400, headers }
    );
  }

  const { product_id, image_key } = data || {};

  if (
    typeof product_id !== "string" ||
    !/^(?:[A-Za-z]+-\d+|custom-[0-9a-f-]{36})$/.test(product_id) ||
    typeof image_key !== "string" ||
    !/^products\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(image_key)
  ) {
    return Response.json(
      { error: "Invalid product or image" },
      { status: 400, headers }
    );
  }

  try {
    const existingProduct = await env.DB.prepare(`
      SELECT sku FROM store_variants
      WHERE sku LIKE ? LIMIT 1
    `).bind(`${product_id}::%`).first();

    if (!existingProduct) {
      return Response.json(
        { error: "Product not found" },
        { status: 404, headers }
      );
    }

    const image = await env.IMAGES.head(image_key);

    if (!image) {
      return Response.json(
        { error: "Uploaded image not found" },
        { status: 404, headers }
      );
    }

    await env.DB.prepare(`
      INSERT INTO store_product_images
        (product_id, image_key, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(product_id) DO UPDATE SET
        image_key = excluded.image_key,
        updated_at = CURRENT_TIMESTAMP
    `).bind(product_id, image_key).run();

    return Response.json({
      ok: true,
      product_id,
      image_url: `/api/images/${image_key}`
    }, { headers });

  } catch {
    return Response.json(
      { error: "Unable to save product image" },
      { status: 500, headers }
    );
  }
}

