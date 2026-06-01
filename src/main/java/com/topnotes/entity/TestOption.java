package com.topnotes.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * One answer option for a TestQuestion.
 * optionKey = "A", "B", "C", "D"
 * isCorrect  = true for the correct answer (only one per question)
 *
 * isCorrect is NEVER sent to the frontend —
 * the service strips it before returning questions to sellers.
 */
@Entity
@Table(name = "test_options",
    indexes = {
        @Index(name = "idx_option_question", columnList = "question_id")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TestOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private TestQuestion question;

    /** "A", "B", "C", or "D" */
    @Column(nullable = false, length = 5)
    private String optionKey;

    /** The option text displayed to the seller. */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String optionText;

    /**
     * True for the correct answer.
     * This field is NEVER exposed in the seller-facing API response.
     * Only admin endpoints return this.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isCorrect = false;
}
