package com.topnotes.entity;

import com.topnotes.entity.enums.ExamType;
import com.topnotes.entity.enums.NoteStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a handwritten note listing created by a verified seller.
 * Contains references to stored PDF and thumbnail files.
 */
@Entity
@Table(
    name = "notes",
    indexes = {
        @Index(name = "idx_note_seller",    columnList = "seller_id"),
        @Index(name = "idx_note_status",    columnList = "status"),
        @Index(name = "idx_note_class",     columnList = "class_level"),
        @Index(name = "idx_note_subject",   columnList = "subject"),
        @Index(name = "idx_note_exam_type", columnList = "exam_type"),
        @Index(name = "idx_note_created",   columnList = "created_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 250)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(length = 60)
    private String classLevel;

    @Column(length = 100)
    private String subject;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private ExamType examType;

    /**
     * Price in INR. BigDecimal used to avoid floating-point errors.
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    /** Relative path to the full PDF in the upload directory. */
    @Column(columnDefinition = "TEXT")
    private String pdfUrl;

    /** Relative path to the cover/thumbnail image. */
    @Column(columnDefinition = "TEXT")
    private String thumbnailUrl;

    /** Same path as pdfUrl — controller restricts page count in response. */
    @Column(columnDefinition = "TEXT")
    private String previewUrl;

    @Column(nullable = false)
    @Builder.Default
    private Integer totalPages = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private NoteStatus status = NoteStatus.ACTIVE;

    /** Denormalised counter — incremented on each successful purchase. */
    @Column(nullable = false)
    @Builder.Default
    private Integer purchaseCount = 0;

    /** Denormalised average — recalculated after each new review. */
    @Column(precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private Integer reviewCount = 0;

    // ── Relationships ─────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @OneToMany(mappedBy = "note", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Purchase> purchases = new ArrayList<>();

    @OneToMany(mappedBy = "note", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Review> reviews = new ArrayList<>();

    // ── Audit ─────────────────────────────────────────────────
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
