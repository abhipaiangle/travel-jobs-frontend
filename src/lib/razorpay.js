import { api } from "@/lib/api";

export async function openRazorpayCheckout({ plan, employer, onSuccess, onClose }) {
  if (typeof window === "undefined" || !window.Razorpay) {
    throw new Error("Razorpay SDK not loaded");
  }
  const { data } = await api.post("/api/billing/order", { plan });
  const order = data.order;

  const options = {
    key: data.key_id,
    amount: order.amount,
    currency: order.currency,
    name: "OpsyJobs",
    description: `${plan.toUpperCase()} subscription`,
    order_id: order.id,
    prefill: {
      name: employer?.company_name || "",
      email: employer?.email || "",
      contact: employer?.contact_phone || "",
    },
    theme: { color: "#0f172a" },
    handler: async (resp) => {
      try {
        await api.post("/api/billing/verify", {
          razorpay_order_id: resp.razorpay_order_id,
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_signature: resp.razorpay_signature,
          plan,
        });
        onSuccess?.();
      } catch (e) {
        throw e;
      }
    },
    modal: { ondismiss: () => onClose?.() },
  };
  const rzp = new window.Razorpay(options);
  rzp.open();
}
