package com.topnotes.entity;

import com.topnotes.entity.enums.PayoutStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A seller's request to withdraw their accumulated earnings. Admin triggers the
 * actual Cashfree Payouts transfer, which moves it PENDING → PAID (or FAILED).
 */
@Entity
@Table(name = "payout_requests", indexes = {
        @Index(name = "idx_payout_seller", columnList = "seller_id"),
        @Index(name = "idx_payout_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayoutRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /** UPI snapshot at request time (so later UPI edits don't change history). */
    @Column(nullable = false, length = 100)
    private String upiId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PayoutStatus status = PayoutStatus.PENDING;

    /** Cashfree transfer reference once paid. */
    @Column(length = 100)
    private String reference;

    @Column(length = 300)
    private String failureReason;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime requestedAt;

    private LocalDateTime paidAt;
}
