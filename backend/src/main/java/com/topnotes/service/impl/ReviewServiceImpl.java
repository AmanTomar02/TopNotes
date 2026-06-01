package com.topnotes.service.impl;

import com.topnotes.dto.request.ReviewRequest;
import com.topnotes.dto.response.ReviewResponse;
import com.topnotes.entity.Note;
import com.topnotes.entity.Review;
import com.topnotes.entity.User;
import com.topnotes.exception.BadRequestException;
import com.topnotes.exception.ResourceNotFoundException;
import com.topnotes.repository.NoteRepository;
import com.topnotes.repository.PurchaseRepository;
import com.topnotes.repository.ReviewRepository;
import com.topnotes.repository.UserRepository;
import com.topnotes.service.ReviewService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@Slf4j
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository   reviewRepository;
    private final NoteRepository     noteRepository;
    private final UserRepository     userRepository;
    private final PurchaseRepository purchaseRepository;

    public ReviewServiceImpl(ReviewRepository reviewRepository,
                             NoteRepository noteRepository,
                             UserRepository userRepository,
                             PurchaseRepository purchaseRepository) {
        this.reviewRepository   = reviewRepository;
        this.noteRepository     = noteRepository;
        this.userRepository     = userRepository;
        this.purchaseRepository = purchaseRepository;
    }

    @Override
    @Transactional
    public ReviewResponse submitReview(Long noteId, Long buyerId, ReviewRequest request) {
        // Must have purchased the note first
        if (!purchaseRepository.existsByBuyerIdAndNoteId(buyerId, noteId)) {
            throw new BadRequestException("You must purchase this note before reviewing it");
        }
        // One review per buyer per note
        if (reviewRepository.existsByBuyerIdAndNoteId(buyerId, noteId)) {
            throw new BadRequestException("You have already reviewed this note");
        }

        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", noteId));
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", buyerId));

        Review review = Review.builder()
                .note(note)
                .buyer(buyer)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review saved = reviewRepository.save(review);

        // Recalculate and persist denormalised average rating
        recalculateRating(note);

        log.info("Review id={} submitted for note id={} by buyer id={}", saved.getId(), noteId, buyerId);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getNoteReviews(Long noteId, Pageable pageable) {
        return reviewRepository
                .findByNoteIdOrderByCreatedAtDesc(noteId, pageable)
                .map(this::toResponse);
    }

    // ── Private helpers ───────────────────────────────────────

    private void recalculateRating(Note note) {
        BigDecimal avg   = reviewRepository.calculateAverageRatingForNote(note.getId());
        long       count = reviewRepository.countByNoteId(note.getId());

        note.setAverageRating(avg != null ? avg.setScale(2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO);
        note.setReviewCount((int) count);
        noteRepository.save(note);
    }

    private ReviewResponse toResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .buyerName(r.getBuyer().getFullName())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
