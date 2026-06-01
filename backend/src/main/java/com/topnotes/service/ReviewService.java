package com.topnotes.service;

import com.topnotes.dto.request.ReviewRequest;
import com.topnotes.dto.response.ReviewResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** Review submission and query for purchased notes. */
public interface ReviewService {
    ReviewResponse submitReview(Long noteId, Long buyerId, ReviewRequest request);
    Page<ReviewResponse> getNoteReviews(Long noteId, Pageable pageable);
}
