import type { CartItem } from "@/types/common.types";

export type CheckoutStatus = {
  tone: "success" | "error" | "info";
  message: string;
};

export type CheckoutAddress = {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
};

export type CheckoutItem = {
  id: string;
  itemType: "product" | "package";
  quantity: number;
  title: string;
  price: number;
  image: string;
  sourceType: "product" | "package";
  sourceId: string;
};

export type PaystackInlinePaymentData = {
  publicKey: string;
  amountKobo: number;
  reference: string;
  accessCode?: string | null;
};

export function isCheckoutDisabledState(input: {
  isSubmitting: boolean;
  isVerifyingPayment: boolean;
  cartDetails: CheckoutItem[];
  missingCartItems: number;
  shippingAddress: CheckoutAddress;
}) {
  return (
    input.isSubmitting ||
    input.isVerifyingPayment ||
    input.cartDetails.length === 0 ||
    input.missingCartItems > 0 ||
    !input.shippingAddress.fullName.trim() ||
    !input.shippingAddress.email.trim() ||
    !input.shippingAddress.phone.trim() ||
    !input.shippingAddress.addressLine1.trim()
  );
}

export function buildPaystackInlineOptions(input: {
  payment: PaystackInlinePaymentData;
  email: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}) {
  return {
    key: input.payment.publicKey,
    email: input.email,
    amount: input.payment.amountKobo,
    ref: input.payment.reference,
    access_code: input.payment.accessCode ?? undefined,
    currency: "NGN",
    callback: (response: { reference: string }) => {
      input.onSuccess(response.reference);
    },
    onClose: input.onClose,
  };
}

export async function verifyCheckoutPaymentFlow(input: {
  reference: string;
  verifyCustomerPayment: (payload: { reference: string }) => Promise<unknown>;
  clearCustomerCart: () => Promise<unknown>;
  replaceCart: (items: CartItem[], options?: { pending?: boolean }) => void;
  onVerified?: () => void | Promise<void>;
}): Promise<CheckoutStatus> {
  try {
    await input.verifyCustomerPayment({ reference: input.reference });
    await input.clearCustomerCart().catch(() => null);
    input.replaceCart([], { pending: false });
    await input.onVerified?.();

    return {
      tone: "success",
      message: "Payment verified successfully. Your order is now awaiting approval.",
    };
  } catch (error) {
    return {
      tone: "error",
      message: error instanceof Error ? error.message : "Unable to verify your payment.",
    };
  }
}
