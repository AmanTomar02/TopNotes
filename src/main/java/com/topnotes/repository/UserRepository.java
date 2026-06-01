package com.topnotes.repository;

import com.topnotes.entity.User;
import com.topnotes.entity.enums.UserRole;
import com.topnotes.entity.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<User> findByRole(UserRole role, Pageable pageable);

    Page<User> findByRoleAndStatus(UserRole role, UserStatus status, Pageable pageable);

    long countByRole(UserRole role);

    long countByStatus(UserStatus status);

    /** Sellers who have passed the test and uploaded a marksheet but not yet approved. */
    @Query("""
            SELECT u FROM User u
            WHERE u.role = 'SELLER'
              AND u.testPassed = true
              AND u.marksheetUrl IS NOT NULL
              AND u.marksheetApproved = false
              AND u.status = 'ACTIVE'
            """)
    Page<User> findPendingSellerApprovals(Pageable pageable);

    long countByRoleAndIsVerifiedTrue(UserRole role);

    @Query("""
            SELECT u FROM User u
            WHERE u.role = :role
              AND u.status != 'DELETED'
            """)
    Page<User> findActiveByRole(@Param("role") UserRole role, Pageable pageable);
}
