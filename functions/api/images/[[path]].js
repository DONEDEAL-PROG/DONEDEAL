
export async function onRequestGet({ params, env }) {
  if (!env.IMAGES) {
    return new Response("Image storage unavailable", {
      status: 503
    });
  }

  const path = params.path;
  const key = Array.isArray(path) ? path.join("/") : path;

  // Only serve images from the products folder.
  if (
    typeof key !== "string" ||
    !/^products\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key)
  ) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const object = await env.IMAGES.get(key);

    if (!object) {
      return new Response("Image not found", {
        status: 404
      });
    }

    const contentType = {
      jpg: "image/jpeg",
      png: "image/png",
      webp: "image/webp"
    }[key.split(".").pop()];

    return new Response(object.body, {
      headers: {
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=3600"
      }
    });

  } catch {
    return new Response("Unable to load image", {
      status: 500
    });
  }
}
