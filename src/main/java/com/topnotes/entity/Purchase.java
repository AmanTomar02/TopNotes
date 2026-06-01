package com.topnotes.entity;

import com.topnotes.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Records a completed purchase transaction between a buyer and a note.
 * Revenue split (platform/seller) is captured at purchase time and
 * is immutable — not recalculated if commission config changes later.
 */
@Entity
@Table(
    name = "purchases",
    indexes = {
        @Index(name = "idx_purchase_buyer",  columnList = "buyer_id"),
        @Index(name = "idx_purchase_note",   columnList = "note_id"),
        @Index(name = "idx_purchase_seller", columnList = "seller_id"),
        @Index(name = "idx_purchase_txn",    columnList = "transaction_id", unique = true)
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_buyer_note", columnNames = {"buyer_id", "note_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    /**
     * Denormalised for fast seller-dashboard queries
     * without joining through Note every time.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    /** Full price paid by buyer. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /** Platform's cut, calculated at purchase time. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal platformShare;

    /** Seller's earnings, calculated at purchase time. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal sellerShare;

    /** Unique transaction ID: TXN-{UUID-segment}. */
    @Column(unique = true, length = 100)
    private String transactionId;

    /** Invoice reference: INV-{YYYYMMDD}-{UUID-segment}. */
    @Column(length = 100)
    private String invoiceNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.COMPLETED;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime purchasedAt;
}
