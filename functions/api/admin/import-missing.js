
const missingModels = [
  ["Apple-0", "Apple iPhone 17 Pro Max"],
  ["Apple-1", "Apple iPhone 17 Pro"],
  ["Apple-2", "Apple iPhone Air"],
  ["Apple-4", "Apple iPhone 16 Pro Max"],
  ["Apple-5", "Apple iPhone 16 Pro"],
  ["Apple-6", "Apple iPhone 16 Plus"],
  ["Apple-7", "Apple iPhone 16"],
  ["Apple-8", "Apple iPhone 16e"],
  ["Apple-9", "Apple iPhone 15"],

  ["Huawei-2", "Huawei Mate X6"],
  ["Huawei-3", "Huawei Pura 70 Pro"],
  ["Huawei-4", "Huawei nova 13 Pro"],

  ["OPPO-0", "OPPO Find X9 Pro"],
  ["OPPO-1", "OPPO Find X9"],
  ["OPPO-2", "OPPO Find X8 Pro"],
  ["OPPO-3", "OPPO Find N5"],
  ["OPPO-4", "OPPO Reno13 Pro"],

  ["vivo-0", "vivo X300 Pro"],
  ["vivo-1", "vivo X300"],
  ["vivo-2", "vivo X200 Pro"],
  ["vivo-3", "vivo X200"],
  ["vivo-4", "vivo V60"],

  ["Xiaomi-0", "Xiaomi 17 Ultra"],
  ["Xiaomi-1", "Xiaomi 17 Pro Max"],
  ["Xiaomi-2", "Xiaomi 15 Ultra"],
  ["Xiaomi-3", "Xiaomi 15"],
  ["Xiaomi-4", "Xiaomi 14T Pro"]
];

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

  const expiry = Number(match[1]);

  if (!Number.isSafeInteger(expiry) ||
      expiry <= Date.now() / 1000) {
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

  if (request.headers.get("Origin") !==
      new URL(request.url).origin) {
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
    const statements = missingModels.map(([id, name]) =>
      env.DB.prepare(`
        INSERT OR IGNORE INTO store_variants
          (sku, name, variant, price_centavos, stock, enabled)
        VALUES (?, ?, 'To be set', 0, 0, 0)
      `).bind(`${id}::To be set`, name)
    );

    const results = await env.DB.batch(statements);

    const added = results.reduce(
      (sum, result) => sum + (result.meta?.changes || 0),
      0
    );

    return Response.json({
      ok: true,
      added,
      skipped: missingModels.length - added,
      message: "Missing gadget models imported."
    }, { headers });

  } catch {
    return Response.json(
      { error: "Import failed" },
      { status: 500, headers }
    );
  }
}
