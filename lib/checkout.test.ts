import {
  buildPaystackInlineOptions,
  isCheckoutDisabledState,
  verifyCheckoutPaymentFlow,
} from "@/lib/checkout";

describe("checkout helpers", () => {
  it("blocks checkout when the basket is empty", () => {
    expect(
      isCheckoutDisabledState({
        isSubmitting: false,
        isVerifyingPayment: false,
        cartDetails: [],
        missingCartItems: 0,
        shippingAddress: {
          fullName: "Ada Customer",
          email: "ada@example.com",
          phone: "08000000000",
          addressLine1: "14 Allen Avenue",
          city: "Ikeja",
          state: "Lagos",
          country: "Nigeria",
        },
      }),
    ).toBe(true);
  });

  it("builds the Paystack inline configuration payload", () => {
    const onSuccess = jest.fn();
    const onClose = jest.fn();
    const options = buildPaystackInlineOptions({
      payment: {
        publicKey: "pk_test_123",
        amountKobo: 2500000,
        reference: "ref-123",
        accessCode: "access-123",
      },
      email: "ada@example.com",
      onSuccess,
      onClose,
    });

    expect(options).toEqual(
      expect.objectContaining({
        key: "pk_test_123",
        email: "ada@example.com",
        amount: 2500000,
        ref: "ref-123",
        access_code: "access-123",
        currency: "NGN",
        onClose,
      }),
    );

    options.callback({ reference: "verified-ref" });
    expect(onSuccess).toHaveBeenCalledWith("verified-ref");
  });

  it("verifies successful checkout payments against the payment verify endpoint contract", async () => {
    const verifyCustomerPayment = jest.fn().mockResolvedValue({ success: true });
    const clearCustomerCart = jest.fn().mockResolvedValue({ success: true });
    const replaceCart = jest.fn();
    const onVerified = jest.fn();

    const status = await verifyCheckoutPaymentFlow({
      reference: "paystack-ref-1",
      verifyCustomerPayment,
      clearCustomerCart,
      replaceCart,
      onVerified,
    });

    expect(verifyCustomerPayment).toHaveBeenCalledWith({
      reference: "paystack-ref-1",
    });
    expect(clearCustomerCart).toHaveBeenCalledTimes(1);
    expect(replaceCart).toHaveBeenCalledWith([], { pending: false });
    expect(onVerified).toHaveBeenCalledTimes(1);
    expect(status).toEqual({
      tone: "success",
      message: "Payment verified successfully. Your order is now awaiting approval.",
    });
  });
});
