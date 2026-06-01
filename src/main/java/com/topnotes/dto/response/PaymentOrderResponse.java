package com.topnotes.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

/** Payment order details required by Razorpay Checkout. */
@Getter
@Builder
public class PaymentOrderResponse {
    private String provider;
    private String keyId;
    private String orderId;
    private Long amountPaise;
    private BigDecimal amount;
    private String currency;
    private Long noteId;
    private String noteTitle;
    private String buyerName;
    private String buyerEmail;
}
