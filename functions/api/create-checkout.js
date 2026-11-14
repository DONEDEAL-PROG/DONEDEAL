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
  await env.DB.batch([
   env.DB.prepare('INSERT INTO store_orders(id,status,total_centavos,customer_json,items_json,created_at) VALUES(?,?,?,?,?,?)').bind(id,'pending',quote.total,JSON.stringify(c),JSON.stringify(quote.items),new Date().toISOString()),
   env.DB.prepare(`INSERT INTO store_order_meta(order_id,source,fulfillment,payment_method,payment_status,shipping_note) VALUES(?,'website',?,?,'unpaid',?)`).bind(id,b.fulfillment,b.payment_method,b.fulfillment==='delivery'?'Shipping fee to be confirmed before dispatch':'Pickup time and location to be confirmed')
  ]);
  return json({ok:true,order_id:id,status:'pending',message:'Order request received. No payment has been collected. We will contact you to confirm availability and any shipping fees.'},201);
 }catch(e){return err(e.message||'Unable to submit order')}
}
