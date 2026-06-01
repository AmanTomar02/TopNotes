package com.topnotes.dto.response;

import com.topnotes.entity.enums.ExamType;
import com.topnotes.entity.enums.NoteStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Note listing payload returned to buyers, sellers, and admin. */
@Getter
@Builder
public class NoteResponse {
    private Long              id;
    private String            title;
    private String            description;
    private String            classLevel;
    private String            subject;
    private ExamType          examType;
    private BigDecimal        price;
    private String            thumbnailUrl;
    private String            previewUrl;
    private Integer           totalPages;
    private NoteStatus        status;
    private Integer           purchaseCount;
    private BigDecimal        averageRating;
    private Integer           reviewCount;
    private SellerPublicProfile seller;
    private LocalDateTime     createdAt;
    /** Context flag — true if requesting buyer has purchased this note. */
    private Boolean           isPurchased;
}
