package com.topnotes.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Tracks seller earnings per purchase — supports future payout workflows.
 */
@Entity
@Table(
    name = "earnings",
    indexes = {
        @Index(name = "idx_earning_seller",   columnList = "seller_id"),
        @Index(name = "idx_earning_purchase", columnList = "purchase_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Earning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_id", nullable = false, unique = true)
    private Purchase purchase;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /** False until admin marks as paid in a future payout system. */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isPaid = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime earnedAt;
}
