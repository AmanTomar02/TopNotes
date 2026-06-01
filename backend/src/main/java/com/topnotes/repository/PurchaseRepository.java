package com.topnotes.repository;

import com.topnotes.entity.Purchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    Page<Purchase> findByBuyerIdOrderByPurchasedAtDesc(Long buyerId, Pageable pageable);

    Page<Purchase> findBySellerIdOrderByPurchasedAtDesc(Long sellerId, Pageable pageable);

    boolean existsByBuyerIdAndNoteId(Long buyerId, Long noteId);

    Optional<Purchase> findByBuyerIdAndNoteId(Long buyerId, Long noteId);

    // ── Revenue aggregation queries ───────────────────────────

    @Query("SELECT COALESCE(SUM(p.amount),        0) FROM Purchase p WHERE p.purchasedAt BETWEEN :start AND :end AND p.status = 'COMPLETED'")
    BigDecimal sumTotalRevenueBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(p.platformShare), 0) FROM Purchase p WHERE p.purchasedAt BETWEEN :start AND :end AND p.status = 'COMPLETED'")
    BigDecimal sumPlatformRevenueBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(p.sellerShare),   0) FROM Purchase p WHERE p.seller.id = :sellerId AND p.purchasedAt BETWEEN :start AND :end AND p.status = 'COMPLETED'")
    BigDecimal sumSellerRevenueBetween(@Param("sellerId") Long sellerId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(p.amount),        0) FROM Purchase p WHERE p.status = 'COMPLETED'")
    BigDecimal sumTotalRevenueAllTime();

    @Query("SELECT COALESCE(SUM(p.platformShare), 0) FROM Purchase p WHERE p.status = 'COMPLETED'")
    BigDecimal sumPlatformRevenueAllTime();

    // ── Chart data queries ────────────────────────────────────

    @Query("""
            SELECT CAST(p.purchasedAt AS date) AS dt, COALESCE(SUM(p.amount), 0) AS rev
            FROM Purchase p
            WHERE p.purchasedAt BETWEEN :start AND :end AND p.status = 'COMPLETED'
            GROUP BY CAST(p.purchasedAt AS date)
            ORDER BY CAST(p.purchasedAt AS date)
            """)
    List<Object[]> getDailyRevenue(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("""
            SELECT MONTH(p.purchasedAt) AS mo, YEAR(p.purchasedAt) AS yr, COALESCE(SUM(p.amount), 0) AS rev
            FROM Purchase p
            WHERE YEAR(p.purchasedAt) = :year AND p.status = 'COMPLETED'
            GROUP BY YEAR(p.purchasedAt), MONTH(p.purchasedAt)
            ORDER BY MONTH(p.purchasedAt)
            """)
    List<Object[]> getMonthlyRevenue(@Param("year") int year);
}
