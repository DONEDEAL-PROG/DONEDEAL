import {json,err,priceCart,sameOrigin} from './_shared.js';
export async function onRequestPost({request,env}){
 if(!sameOrigin(request))return err('Origin not allowed',403);
 if(!env.DB)return err('Store database not configured',503);
 try{
  const b=await request.json(),c=b.customer||{};
  if(typeof c.name!=='string'||!c.name.trim()||c.name.length>120||typeof c.phone!=='string'||!c.phone.trim()||c.phone.length>30||typeof c.email!=='string'||c.email.length>160)return err('Complete your contact details');
  if(c.email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email))return err('Invalid email');
  if(!['delivery','pickup'].includes(b.fulfillment))return err('Choose delivery or pickup');
  if(b.fulfillment==='delivery'&&(!c.address||!c.city||!c.province||!c.postal))return err('Complete the delivery address');
  if(!['cod','gcash','bank_transfer'].includes(b.payment_method))return err('Choose an available payment method. Card payments coming soon');
  const quote=await priceCart(env.DB,b.items);
  const id='DD-'+crypto.randomUUID();
  const refCode=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('dd_ref='))?.slice(7)||'';
  let affiliate=null;
  if(/^[a-f0-9]{12}$/.test(refCode)){
   try{affiliate=await env.DB.prepare("SELECT id,commission_bps FROM dd_affiliates WHERE referral_code=? AND status='approved'").bind(refCode).first()}catch(e){console.warn('Partner migration not yet installed',e)}
  }
  await env.DB.batch([
   ...quote.items.map(item=>env.DB.prepare(`UPDATE store_variants SET stock=CASE WHEN enabled=1 AND NOT EXISTS (SELECT 1 FROM store_gadget_visibility AS g WHERE g.product_id=substr(store_variants.sku,1,instr(store_variants.sku,'::')-1) AND g.enabled=0) THEN stock-? ELSE -1 END WHERE sku=?`).bind(item.quantity,item.sku)),
   env.DB.prepare('INSERT INTO store_orders(id,status,total_centavos,customer_json,items_json,created_at) VALUES(?,?,?,?,?,?)').bind(id,'pending',quote.total,JSON.stringify(c),JSON.stringify(quote.items),new Date().toISOString()),
   env.DB.prepare(`INSERT INTO store_order_meta(order_id,source,fulfillment,payment_method,payment_status,shipping_note) VALUES(?,'website',?,?,'unpaid',?)`).bind(id,b.fulfillment,b.payment_method,b.fulfillment==='delivery'?'Shipping fee to be confirmed before dispatch':'Pickup time and location to be confirmed'),
   env.DB.prepare('INSERT INTO store_order_reservations(order_id) VALUES(?)').bind(id),
   ...(affiliate?[env.DB.prepare("INSERT INTO dd_affiliate_orders(order_id,affiliate_id,commission_bps,commission_centavos) VALUES(?,?,?,?)").bind(id,affiliate.id,affiliate.commission_bps,Math.floor(quote.total*affiliate.commission_bps/10000))]:[])
  ]);
  return json({ok:true,order_id:id,status:'pending',message:'Order request received. No payment has been collected. We will contact you to confirm availability and any shipping fees.'},201);
 }catch(e){console.error('Order transaction rejected:',e);return err('Stock changed or order could not be saved. Please refresh and try again.',409)}
}
