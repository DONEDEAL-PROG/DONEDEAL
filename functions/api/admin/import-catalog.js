
const encoder = new TextEncoder();

// Exact catalog entries from your previous import list.
// Prices are in Philippine centavos.
const catalog = [
  ["Samsung-0::12GB / 256GB", "Samsung Galaxy S25 Ultra", "12GB / 256GB", 8299900],
  ["Samsung-0::12GB / 512GB", "Samsung Galaxy S25 Ultra", "12GB / 512GB", 9799900],
  ["Samsung-0::12GB / 1TB", "Samsung Galaxy S25 Ultra", "12GB / 1TB", 11199900],
  ["Samsung-1::12GB / 256GB", "Samsung Galaxy S25+", "12GB / 256GB", 6999900],
  ["Samsung-1::12GB / 512GB", "Samsung Galaxy S25+", "12GB / 512GB", 7999900],
  ["Samsung-2::12GB / 256GB", "Samsung Galaxy S25", "12GB / 256GB", 5499900],
  ["Samsung-2::12GB / 512GB", "Samsung Galaxy S25", "12GB / 512GB", 6899900],
  ["Samsung-3::12GB / 256GB", "Samsung Galaxy Z Fold7", "12GB / 256GB", 11799900],
  ["Samsung-3::12GB / 512GB", "Samsung Galaxy Z Fold7", "12GB / 512GB", 13199900],
  ["Samsung-3::16GB / 1TB", "Samsung Galaxy Z Fold7", "16GB / 1TB", 15499900],
  ["Samsung-4::12GB / 256GB", "Samsung Galaxy Z Flip7", "12GB / 256GB", 7399900],
  ["Samsung-4::12GB / 512GB", "Samsung Galaxy Z Flip7", "12GB / 512GB", 8888800],
  ["Huawei-0::16GB / 512GB", "Huawei Pura 80 Ultra", "16GB / 512GB", 8999900],
  ["Huawei-1::12GB / 512GB", "Huawei Pura 80 Pro", "12GB / 512GB", 5999900]
];

async function authorized(request, env) {
  if (!env.ADMIN_SESSION_SECRET) return false;

  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.split(";")
    .map(x => x.trim())
    .find(x => x.startsWith("dd_admin="))
    ?.slice(9);

  const match = /^admin\.(\d+)\.([a-f0-9]{64})$/.exec(token || "");
  if (!match || Number(match[1]) <= Date.now() / 1000) {
    return false;
  }

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

  if (!env.DB) {
    return Response.json(
      { error: "Database not connected" },
      { status: 503, headers }
    );
  }

  try {
    const statements = catalog.map(
      ([sku, name, variant, price]) =>
        env.DB.prepare(`
          INSERT OR IGNORE INTO store_variants
          (sku, name, variant, price_centavos, stock, enabled)
          VALUES (?, ?, ?, ?, 1, 1)
        `).bind(sku, name, variant, price)
    );

    const results = await env.DB.batch(statements);
    const added = results.reduce(
      (total, result) => total + (result.meta?.changes || 0),
      0
    );

    return Response.json({
      ok: true,
      added,
      skipped: catalog.length - added,
      message: "Catalog import completed."
    }, { headers });

  } catch {
    return Response.json(
      { error: "Catalog import failed." },
      { status: 500, headers }
    );
  }
}
