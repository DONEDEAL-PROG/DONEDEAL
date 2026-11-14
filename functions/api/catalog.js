// Public catalog: supports both the original Done Deal schema and V2 schema.
// All prices are read from D1; no hardcoded price fallback.
const legacyQuery = `
  SELECT v.sku, v.name, v.variant, v.price_centavos, v.stock, i.image_key
  FROM store_variants AS v
  LEFT JOIN store_product_images AS i
    ON i.product_id = substr(v.sku, 1, instr(v.sku, '::') - 1)
  WHERE v.enabled = 1 AND NOT EXISTS (SELECT 1 FROM store_gadget_visibility AS g WHERE g.product_id=substr(v.sku,1,instr(v.sku,'::')-1) AND g.enabled=0)
  ORDER BY v.name, v.variant
`;

const v2Query = `
  SELECT v.sku, v.name, v.variant, v.price_centavos, v.stock,
         i.image_key, p.brand, p.model, p.description
  FROM store_variants AS v
  LEFT JOIN store_product_images AS i
    ON i.product_id = substr(v.sku, 1, instr(v.sku, '::') - 1)
  LEFT JOIN store_products AS p
    ON p.id = substr(v.sku, 1, instr(v.sku, '::') - 1)
  WHERE v.enabled = 1 AND NOT EXISTS (SELECT 1 FROM store_gadget_visibility AS g WHERE g.product_id=substr(v.sku,1,instr(v.sku,'::')-1) AND g.enabled=0)
  ORDER BY v.name, v.variant
`;

export async function onRequestGet({ env }) {
  if (!env.DB) {
    return Response.json({ error: "Catalog database binding unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  try {
    let result;
    try {
      result = await env.DB.prepare(v2Query).all();
    } catch (error) {
      // V2 migration may not yet have created store_products.
      // Use original schema without losing live prices.
      if (!/no such table:\s*store_products/i.test(String(error?.message || error))) {
        throw error;
      }
      result = await env.DB.prepare(legacyQuery).all();
    }
    return Response.json({ products: result.results || [] },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Public catalog query failed:", error);
    return Response.json({ error: "Unable to load catalog" },
      { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
