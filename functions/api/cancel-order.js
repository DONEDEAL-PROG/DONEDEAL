import {json,err,sameOrigin} from './_shared.js';
import {normPhone,canCancel,cancelCondition} from './_customer-order.js';
export async function onRequestPost({request,env}){
 if(!sameOrigin(request))return err('Origin not allowed',403);
 if(!env.DB)return err('Order cancellation is temporarily unavailable',503);
 if(!String(request.headers.get('content-type')||'').toLowerCase().includes('application/json'))return err('Invalid request',415);
 let b;try{b=await request.json()}catch{return err('Invalid request')}
 const id=String(b.order_id||'').trim(),phone=normPhone(b.phone);
 if(!/^DD-[0-9a-f-]{36}$/i.test(id)||!/^09\d{9}$/.test(phone))return err('Enter a valid order reference and phone number',400);
 try{
  const row=await env.DB.prepare(`SELECT o.id,o.status,o.paid_at,o.customer_json,m.payment_status,p.pickup_status
   FROM store_orders o LEFT JOIN store_order_meta m ON m.order_id=o.id
   LEFT JOIN store_pickup_tracking p ON p.order_id=o.id WHERE o.id=?`).bind(id).first();
  let customer={};try{customer=JSON.parse(row?.customer_json||'{}')}catch{}
  if(!row||!customer.phone||normPhone(customer.phone)!==phone)return err('Order not found or phone number does not match',404);
  if(row.status==='cancelled')return json({ok:true,status:'cancelled',message:'This order is already cancelled.'});
  if(!canCancel(row))return err('This order can no longer be cancelled online. It is paid, under payment review, or already being processed. Please contact support.',409);
  // Use the existing status-transition inventory triggers; never restock twice.
  // Fail closed if the deployment has no cancellation stock handling configured.
  const triggers=await env.DB.prepare("SELECT sql FROM sqlite_master WHERE type='trigger' AND tbl_name='store_orders'").all();
  const handlesStock=(triggers.results||[]).some(t=>/cancelled/i.test(t.sql||'')&&/store_variants/i.test(t.sql||'')&&/stock/i.test(t.sql||''));
  if(!handlesStock)return err('Online cancellation is not configured for this store yet. Please contact support to cancel your order.',503);
  const result=await env.DB.prepare(`UPDATE store_orders SET status='cancelled' WHERE id=? AND ${cancelCondition}`).bind(id).run();
  if(!result.meta?.changes)return err('Order status changed. Refresh the order before trying again.',409);
  return json({ok:true,status:'cancelled',message:'Your order has been cancelled.'});
 }catch(e){console.error('Customer cancellation failed',e);return err('Cancellation is temporarily unavailable. Please try again or contact support.',503)}
}
