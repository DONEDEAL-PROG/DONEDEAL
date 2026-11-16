export const CONCERNS = Object.freeze(["Refund Request", "Delivery Concern", "Order Follow-up", "Warranty Inquiry", "General Inquiry", "Affiliate Application", "Store Pickup", "Website Concern", "Rewards Inquiry", "Payment Error"]);
export const concernAllowed = value => typeof value === 'string' && CONCERNS.includes(value);
