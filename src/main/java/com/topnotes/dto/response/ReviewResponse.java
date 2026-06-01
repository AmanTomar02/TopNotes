package com.topnotes.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/** Review displayed on a note detail page. Buyer name shown, email hidden. */
@Getter
@Builder
public class ReviewResponse {
    private Long          id;
    private String        buyerName;
    private Integer       rating;
    private String        comment;
    private LocalDateTime createdAt;
}
