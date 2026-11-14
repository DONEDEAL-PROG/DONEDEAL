
const encoder = new TextEncoder();

function toHex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password) {
  const data = encoder.encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value)
  );
  return toHex(new Uint8Array(signature));
}

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) {
    return Response.json(
      { error: "Admin login is not configured." },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  const supplied = String(body?.password || "");
  if (!supplied || supplied.length > 1024) {
    return Response.json(
      { error: "Invalid credentials." },
      { status: 401 }
    );
  }

  const expectedHash = await hashPassword(env.ADMIN_PASSWORD);
  const suppliedHash = await hashPassword(supplied);

  if (expectedHash !== suppliedHash) {
    return Response.json(
      { error: "Invalid credentials." },
      { status: 401 }
    );
  }

  const expires = Math.floor(Date.now() / 1000) + 3600;
  const payload = `admin.${expires}`;
  const signature = await sign(
    payload,
    env.ADMIN_SESSION_SECRET
  );

  return new Response(
    JSON.stringify({ ok: true }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Set-Cookie":
          `dd_admin=${payload}.${signature}; ` +
          "HttpOnly; Secure; SameSite=Strict; " +
          "Path=/api/admin; Max-Age=3600"
      }
    }
  );
}
