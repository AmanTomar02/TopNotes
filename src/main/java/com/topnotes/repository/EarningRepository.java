package com.topnotes.repository;

import com.topnotes.entity.Earning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface EarningRepository extends JpaRepository<Earning, Long> {

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Earning e WHERE e.seller.id = :sellerId")
    BigDecimal sumTotalBySellerId(@Param("sellerId") Long sellerId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Earning e WHERE e.seller.id = :sellerId AND e.earnedAt BETWEEN :start AND :end")
    BigDecimal sumBySellerAndDateRange(
            @Param("sellerId") Long sellerId,
            @Param("start")    LocalDateTime start,
            @Param("end")      LocalDateTime end
    );
}
