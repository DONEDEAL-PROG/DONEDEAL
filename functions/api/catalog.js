
export async function onRequestGet({ env }) {
  if (!env.DB) {
    return Response.json(
      { error: "Catalog temporarily unavailable" },
      { status: 503 }
    );
  }

  try {
    const result = await env.DB.prepare(`
      SELECT sku, name, variant, price_centavos, stock
      FROM store_variants
      WHERE enabled = 1
      ORDER BY name, variant
    `).all();

    return Response.json(
      { products: result.results || [] },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch {
    return Response.json(
      { error: "Unable to load catalog" },
      { status: 500 }
    );
  }
}
