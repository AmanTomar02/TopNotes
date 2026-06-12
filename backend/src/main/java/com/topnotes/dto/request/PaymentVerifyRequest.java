package com.topnotes.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/** Checkout callback payload sent by the browser after a Cashfree payment. */
@Getter
@Setter
public class PaymentVerifyRequest {
    @NotNull(message = "Note id is required")
    private Long noteId;

    @NotBlank(message = "Order id is required")
    private String orderId;
}
