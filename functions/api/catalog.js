
export async function onRequestGet({ env }) {
  if (!env.DB) {
    return Response.json(
      { error: "Catalog temporarily unavailable" },
      { status: 503 }
    );
  }

  try {
 
const result = await env.DB.prepare(`
  SELECT
    v.sku,
    v.name,
    v.variant,
    v.price_centavos,
    v.stock,
    i.image_key
  FROM store_variants AS v
  LEFT JOIN store_product_images AS i
    ON i.product_id =
      substr(v.sku, 1, instr(v.sku, '::') - 1)
  WHERE v.enabled = 1
  ORDER BY v.name, v.variant
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
