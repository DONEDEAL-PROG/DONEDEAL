
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

  if (!env.IMAGES) {
    return Response.json(
      { error: "R2 bucket not connected" },
      { status: 503, headers }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("image");

    if (!(file instanceof File)) {
      return Response.json(
        { error: "Please select an image" },
        { status: 400, headers }
      );
    }

    const allowed = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp"
    };

    const extension = allowed[file.type];

    if (!extension || file.size > 5 * 1024 * 1024 ||
        file.size === 0) {
      return Response.json(
        { error: "Use JPG, PNG or WebP under 5MB" },
        { status: 400, headers }
      );
    }

    const key = `products/${crypto.randomUUID()}.${extension}`;

    await env.IMAGES.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type
      }
    });

    return Response.json({
      ok: true,
      key,
      image_url: `/api/images/${key}`
    }, { headers });

  } catch {
    return Response.json(
      { error: "Image upload failed" },
      { status: 500, headers }
    );
  }
}
