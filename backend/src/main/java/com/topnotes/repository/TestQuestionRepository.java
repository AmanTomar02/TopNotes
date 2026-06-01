package com.topnotes.repository;

import com.topnotes.entity.TestQuestion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestQuestionRepository extends JpaRepository<TestQuestion, Long> {

    /** All active questions ordered by displayOrder — used when building a test. */
    List<TestQuestion> findByIsActiveTrueOrderByDisplayOrderAsc();

    /** Paginated list for admin management table. */
    Page<TestQuestion> findAllByOrderByDisplayOrderAsc(Pageable pageable);

    /** Count of active questions — shown in admin UI alongside config. */
    long countByIsActiveTrue();

    /** Check if any question exists with this display order (for validation). */
    boolean existsByDisplayOrder(Integer displayOrder);

    /** Find all questions for a specific subject tag. */
    Page<TestQuestion> findBySubjectIgnoreCaseOrderByDisplayOrderAsc(String subject, Pageable pageable);

    /** Full-text search across question text — admin search bar. */
    @Query("""
            SELECT q FROM TestQuestion q
            WHERE LOWER(q.questionText) LIKE CONCAT('%', :keyword, '%')
               OR LOWER(q.subject)      LIKE CONCAT('%', :keyword, '%')
            ORDER BY q.displayOrder ASC
            """)
    Page<TestQuestion> searchByKeyword(String keyword, Pageable pageable);
}
