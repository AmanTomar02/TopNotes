package com.topnotes.repository;

import com.topnotes.entity.PayoutRequest;
import com.topnotes.entity.enums.PayoutStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface PayoutRepository extends JpaRepository<PayoutRequest, Long> {

    /** Sum of amounts in any of the given states for a seller (e.g. PENDING+PAID = already committed). */
    @Query("""
            SELECT COALESCE(SUM(p.amount), 0) FROM PayoutRequest p
            WHERE p.seller.id = :sellerId AND p.status IN :statuses
            """)
    BigDecimal sumBySellerAndStatuses(@Param("sellerId") Long sellerId,
                                      @Param("statuses") List<PayoutStatus> statuses);

    boolean existsBySellerIdAndStatus(Long sellerId, PayoutStatus status);

    Page<PayoutRequest> findByStatusOrderByRequestedAtAsc(PayoutStatus status, Pageable pageable);

    Page<PayoutRequest> findBySellerIdOrderByRequestedAtDesc(Long sellerId, Pageable pageable);
}
