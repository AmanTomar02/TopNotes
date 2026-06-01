package com.topnotes.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/** Checkout callback payload sent by the browser after payment. */
@Getter
@Setter
public class PaymentVerifyRequest {
    @NotNull(message = "Note id is required")


    @NotBlank(message = "Order id is required")
    private String razorpayOrderId;

    @NotBlank(message = "Payment id is required")
    private String razorpayPaymentId;

    @NotBlank(message = "Payment signature is required")
    private String razorpaySignature;
}
