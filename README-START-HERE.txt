DONE DEAL GADGETS & SUPPLIES — UPGRADED FRONT END

WHAT IS INCLUDED
- Your supplied logo integrated into the navigation; full logo image included for use in other pages.
- Your existing homepage, branding, brand selector, cart and storage-variant modal retained.
- Wishlist saved to browser, comparison of up to 3 phones, maximum-price filtering.
- Local store manager demonstration to add products and set browser-local selling prices.
- Support for product image URLs added to products through the local demo.
- Existing verified Philippine SRP variant entries retained. Unverified models remain quote-only.
- Existing checkout remains a DEMO and does not send orders or collect payments.

HOW TO DEPLOY
1. Back up the current website repository.
2. Upload index.html, app.js, enhancements.js, done-deal-mark.png,
   done-deal-full-logo.png, and apple-logo.svg to your website root.
3. IMPORTANT: Keep your current existing hero-unified.webp, hero-model.jpg,
   and hero-product.webp files in that root. These assets were NOT included
   in the supplied files and are referenced by the existing HTML/CSS.
4. Commit changes to the branch used by Cloudflare Pages.
5. Hard-refresh the browser and test on mobile and desktop.

IMPORTANT LIMITATIONS
- The store manager is a browser-local demo; it has NO secure authentication,
  NO shared inventory, and NO cloud synchronization. Do not use it to operate
  a real store. A production admin requires a backend such as Supabase with
  authentication, role policies, and protected storage.
- Payment methods (GCash, Maya, cards) require onboarding with a licensed
  payment provider, secure server integration and webhooks.
- The checkout DOES NOT submit orders. It is labeled as a demo.
- Real product photos are not supplied in the uploaded source. You can add
  licensed official image HTTPS URLs to new products in the demo, but to
  complete all catalog photos you need verified image assets or URLs.
- Prices in the source are historical published PH SRPs, not live selling prices.
  Confirm availability, storage configurations and current SRP before selling.
- This is a substantial front-end upgrade, NOT a completed live e-commerce backend.

NEXT PRODUCTION PHASE
Secure admin auth, database tables for products/variants/stock, image hosting,
customer checkout/order capture, payment processor, shipping fee rules,
customer notifications, order tracking, and inventory concurrency controls.


PHOTO AND ORDER REQUEST UPDATE
- product-photos.js adds photographs via Wikimedia Commons where a matching image is found.
- The image lookup requires an internet connection and may not find every model. Check image accuracy and reuse rights before publishing.
- In Store Manager, each phone now has a Photo URL field. Use your own authorized product photo URLs for reliable exact-model imagery.
- Cart no longer displays the demo checkout notice. The checkout button now prepares an order request that customers can copy or open in their email app. It does NOT send orders to the store automatically or process payment.
- For actual checkout, integrate a secure backend and payment processor.
