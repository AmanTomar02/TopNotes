package com.topnotes.repository;

import com.topnotes.entity.VerificationTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VerificationTestRepository extends JpaRepository<VerificationTest, Long> {
    List<VerificationTest> findBySellerIdOrderByAttemptedAtDesc(Long sellerId);
    long countBySellerId(Long sellerId);
    boolean existsBySellerIdAndPassedTrue(Long sellerId);
}
