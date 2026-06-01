package com.topnotes.dto.response;

import com.topnotes.entity.enums.PaymentStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Purchase receipt returned after a successful buy. */
@Getter
@Builder
public class PurchaseResponse {
    private Long          id;
    private NoteResponse  note;
    private BigDecimal    amount;
    private BigDecimal    platformShare;
    private BigDecimal    sellerShare;
    private String        transactionId;
    private String        invoiceNumber;
    private PaymentStatus status;
    private LocalDateTime purchasedAt;
}
