package com.topnotes.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

/** Payment order details required by the Cashfree Checkout JS SDK. */
@Getter
@Builder
public class PaymentOrderResponse {
    private String provider;          // CASHFREE
    private String mode;              // sandbox | production (for the JS SDK)
    private String orderId;          // Cashfree order_id (used to verify)
    private String paymentSessionId; // passed to cashfree.checkout(...)
    private BigDecimal amount;
    private String currency;
    private Long noteId;
    private String noteTitle;
    private String buyerName;
    private String buyerEmail;
}
