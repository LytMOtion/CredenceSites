/* ============================================================================
   CREDENCE CLIENT BILLING — public configuration
   ============================================================================
   The Credence billing experience is intentionally INACTIVE. No payment
   processor is connected and no payment or bank information is collected.

   HOW THIS WORKS
   - When a URL below is empty (""), the matching action opens the
     "Billing access is not active yet" dialog. Nothing is submitted and no
     payment is taken.
   - When a real, PUBLIC hosted-payment URL is later provided by an approved
     processor (for example a hosted Checkout / Payment Link URL, or a hosted
     Customer Portal URL), paste it into the matching field. The corresponding
     action then becomes an external link that opens in a new browser tab
     (target="_blank" rel="noopener noreferrer").
   - Visitors are NEVER automatically redirected.

   SECURITY — READ BEFORE EDITING
   - ONLY public, hosted-checkout or customer-portal URLs belong in this file.
     It ships to the browser and is world-readable.
   - NEVER put secret keys, API keys, processor secrets, webhook signing
     secrets, tokens, passwords, or bank details in this file or in any other
     front-end file. Those belong only on a server or in the processor's own
     dashboard — never in this repository.
   - Before any live URL is added, the processor account, the legal operating
     company, the invoicing entity, the service-agreement company, and the
     payout bank account should all be the SAME correct Credence entity.
   ============================================================================ */
window.CREDENCE_BILLING = {
  providerName: "",         // display only, e.g. "Stripe" — leave empty until activated
  newClientCheckoutUrl: "", // public hosted Checkout / Payment Link URL — leave empty until activated
  customerPortalUrl: ""     // public hosted Customer Portal URL — leave empty until activated
};
