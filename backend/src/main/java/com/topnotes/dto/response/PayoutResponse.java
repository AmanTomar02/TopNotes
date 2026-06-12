package com.topnotes.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** A payout/withdrawal row — used in the admin queue and seller history. */
@Getter
@Builder
public class PayoutResponse {
    private Long id;
    private Long sellerId;
    private String sellerName;
    private String upiId;
    private BigDecimal amount;
    private String status;
    private String reference;
    private String failureReason;
    private LocalDateTime requestedAt;
    private LocalDateTime paidAt;
}
