import {canCancel} from './_customer-order.js';
import {json,err} from './_shared.js';
const normPhone = v => String(v||'').replace(/[^0-9]/g,'').replace(/^63(?=9[0-9]{9}$)/,'0');
export async function onRequestPost({request,env}){
 if(!env.DB)return err('Order tracking is temporarily unavailable',503);
 if(!String(request.headers.get('content-type')||'').toLowerCase().includes('application/json'))return err('Invalid request',415);
 let b;try{b=await request.json()}catch{return err('Invalid request')}
 const id=String(b.order_id||'').trim(),phone=normPhone(b.phone);
 if(!/^DD-[0-9a-f-]{36}$/i.test(id)||phone.length<10||phone.length>13)return err('Enter a valid order reference and phone number',400);
 try{
  const row=await env.DB.prepare(`SELECT o.id,o.status,o.created_at,o.customer_json,o.paid_at,m.payment_status,
    m.fulfillment,p.pickup_status
    FROM store_orders o
    LEFT JOIN store_order_meta m ON m.order_id=o.id
    LEFT JOIN store_pickup_tracking p ON p.order_id=o.id
    WHERE o.id=?`).bind(id).first();
  if(!row)return err('Order not found or phone number does not match',404);
  let customer={};try{customer=JSON.parse(row.customer_json||'{}')}catch{}
  if(!customer.phone||normPhone(customer.phone)!==phone)return err('Order not found or phone number does not match',404);
  return json({ok:true,order:{id:row.id,status:row.status,created_at:row.created_at,
   fulfillment:row.fulfillment||null,pickup_status:row.pickup_status||null,payment_status:row.payment_status||null,can_cancel:canCancel(row)}});
 }catch(e){console.error('Tracking lookup failed',e);return err('Tracking is temporarily unavailable',503)}
}
