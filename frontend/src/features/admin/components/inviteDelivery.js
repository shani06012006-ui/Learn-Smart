// frontend/src/features/admin/components/inviteDelivery.js
// Helpers shared by the Create-Student and Resend-link modals
// (kept out of InviteDeliveryFields.jsx so that file only exports a component).

// How the one-time activation link is delivered. E-mail is the default.
export const DEFAULT_DELIVERY = { email: true, whatsapp: false, phone: "" };

// -> the fields the backend expects ({ send_via, phone? }).
export function deliveryToPayload({ email, whatsapp, phone }) {
  const send_via = [];
  if (email) send_via.push("email");
  if (whatsapp) send_via.push("whatsapp");
  return whatsapp ? { send_via, phone: (phone || "").trim() } : { send_via };
}
