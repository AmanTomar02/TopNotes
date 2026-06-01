package com.topnotes.repository;

import com.topnotes.entity.Note;
import com.topnotes.entity.enums.ExamType;
import com.topnotes.entity.enums.NoteStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

    Page<Note> findByStatus(NoteStatus status, Pageable pageable);

    Page<Note> findBySellerIdAndStatusNot(Long sellerId, NoteStatus status, Pageable pageable);

    Page<Note> findBySellerId(Long sellerId, Pageable pageable);

    long countBySellerId(Long sellerId);

    long countByStatus(NoteStatus status);

    Optional<Note> findByIdAndSellerIdAndStatusNot(Long id, Long sellerId, NoteStatus status);

    /** Full-text search across title and description with optional filters. */
    @Query("""
            SELECT n FROM Note n
            WHERE n.status = 'ACTIVE'
              AND (:keyword = '' OR LOWER(n.title)      LIKE CONCAT('%', :keyword, '%')
                                OR LOWER(n.description) LIKE CONCAT('%', :keyword, '%'))
              AND (:classLevel IS NULL OR n.classLevel = :classLevel)
              AND (:subject    IS NULL OR n.subject    = :subject)
              AND (:examType   IS NULL OR n.examType   = :examType)
            """)
    Page<Note> searchNotes(
            @Param("keyword")    String   keyword,
            @Param("classLevel") String   classLevel,
            @Param("subject")    String   subject,
            @Param("examType")   ExamType examType,
            Pageable pageable
    );

    @Query("SELECT DISTINCT n.subject    FROM Note n WHERE n.status = 'ACTIVE' AND n.subject    IS NOT NULL ORDER BY n.subject")
    List<String> findDistinctActiveSubjects();

    @Query("SELECT DISTINCT n.classLevel FROM Note n WHERE n.status = 'ACTIVE' AND n.classLevel IS NOT NULL ORDER BY n.classLevel")
    List<String> findDistinctActiveClassLevels();
}
