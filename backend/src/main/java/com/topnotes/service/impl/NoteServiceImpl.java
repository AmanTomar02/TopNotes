package com.topnotes.service.impl;

import com.topnotes.dto.request.NoteCreateRequest;
import com.topnotes.dto.request.PriceUpdateRequest;
import com.topnotes.dto.response.NoteResponse;
import com.topnotes.dto.response.SellerPublicProfile;
import com.topnotes.entity.Note;
import com.topnotes.entity.User;
import com.topnotes.entity.enums.ExamType;
import com.topnotes.entity.enums.NoteStatus;
import com.topnotes.exception.BadRequestException;
import com.topnotes.exception.ResourceNotFoundException;
import com.topnotes.exception.UnauthorizedException;
import com.topnotes.repository.NoteRepository;
import com.topnotes.repository.PurchaseRepository;
import com.topnotes.repository.UserRepository;
import com.topnotes.service.NoteService;
import com.topnotes.util.FileUploadUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class NoteServiceImpl implements NoteService {

    private final NoteRepository     noteRepository;
    private final UserRepository     userRepository;
    private final PurchaseRepository purchaseRepository;
    private final FileUploadUtil     fileUploadUtil;

    public NoteServiceImpl(NoteRepository noteRepository,
                           UserRepository userRepository,
                           PurchaseRepository purchaseRepository,
                           FileUploadUtil fileUploadUtil) {
        this.noteRepository     = noteRepository;
        this.userRepository     = userRepository;
        this.purchaseRepository = purchaseRepository;
        this.fileUploadUtil     = fileUploadUtil;
    }

    // ── Create ────────────────────────────────────────────────

    @Override
    @Transactional
    public NoteResponse createNote(NoteCreateRequest request,
                                   MultipartFile pdf,
                                   MultipartFile thumbnail,
                                   Long sellerId) {
        User seller = fetchUser(sellerId);

        if (!seller.getIsVerified()) {
            throw new UnauthorizedException(
                    "Your account must be verified before uploading notes");
        }

        String pdfUrl;
        try {
            pdfUrl = fileUploadUtil.storePdf(pdf);
        } catch (IOException e) {
            log.error("Failed to store PDF for seller {}: {}", sellerId, e.getMessage());
            throw new BadRequestException("Failed to upload PDF: " + e.getMessage());
        }

        String thumbnailUrl = null;
        if (thumbnail != null && !thumbnail.isEmpty()) {
            try {
                thumbnailUrl = fileUploadUtil.storeThumbnail(thumbnail);
            } catch (IOException e) {
                log.warn("Failed to store thumbnail for seller {}: {}", sellerId, e.getMessage());
                // Non-fatal — proceed without thumbnail
            }
        }

        Note note = Note.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .classLevel(request.getClassLevel())
                .subject(request.getSubject())
                .examType(request.getExamType())
                .price(request.getPrice())
                .pdfUrl(pdfUrl)
                .previewUrl(pdfUrl)   // Backend serves page 1 in controller
                .thumbnailUrl(thumbnailUrl)
                .seller(seller)
                .build();

        Note saved = noteRepository.save(note);
        log.info("Note id={} created by seller id={}", saved.getId(), sellerId);
        return toResponse(saved, null);
    }

    // ── Search / Read ─────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<NoteResponse> searchNotes(String keyword,
                                          String classLevel,
                                          String subject,
                                          ExamType examType,
                                          Pageable pageable,
                                          Long viewerId) {
        return noteRepository
                .searchNotes(keyword, classLevel, subject, examType, pageable)
                .map(note -> toResponse(note, viewerId));
    }

    @Override
    @Transactional(readOnly = true)
    public NoteResponse getNoteById(Long noteId, Long viewerId) {
        Note note = noteRepository.findById(noteId)
                .filter(n -> n.getStatus() != NoteStatus.DELETED)
                .orElseThrow(() -> new ResourceNotFoundException("Note", noteId));
        return toResponse(note, viewerId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NoteResponse> getSellerNotes(Long sellerId, Pageable pageable) {
        return noteRepository
                .findBySellerIdAndStatusNot(sellerId, NoteStatus.DELETED, pageable)
                .map(note -> toResponse(note, null));
    }

    // ── Update ────────────────────────────────────────────────

    @Override
    @Transactional
    public NoteResponse updatePrice(Long noteId, PriceUpdateRequest request, Long sellerId) {
        Note note = fetchSellerOwnedNote(noteId, sellerId);
        note.setPrice(request.getPrice());
        log.info("Note id={} price updated to {} by seller id={}", noteId, request.getPrice(), sellerId);
        return toResponse(noteRepository.save(note), null);
    }

    // ── Delete ────────────────────────────────────────────────

    @Override
    @Transactional
    public void deleteNote(Long noteId, Long sellerId) {
        Note note = fetchSellerOwnedNote(noteId, sellerId);
        note.setStatus(NoteStatus.DELETED);
        noteRepository.save(note);
        log.info("Note id={} soft-deleted by seller id={}", noteId, sellerId);
    }

    // ── Filters ───────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Map<String, List<String>> getFilterOptions() {
        return Map.of(
                "subjects",    noteRepository.findDistinctActiveSubjects(),
                "classLevels", noteRepository.findDistinctActiveClassLevels()
        );
    }

    // ── DTO mapping (public — reused by DashboardServiceImpl) ─

    @Override
    @Transactional(readOnly = true)
    public NoteResponse toResponse(Note note, Long viewerId) {
        boolean isPurchased = viewerId != null
                && purchaseRepository.existsByBuyerIdAndNoteId(viewerId, note.getId());

        User seller = note.getSeller();

        SellerPublicProfile sellerProfile = SellerPublicProfile.builder()
                .id(seller.getId())
                .fullName(seller.getFullName())
                .classLevel(seller.getClassLevel())
                .institution(seller.getInstitution())
                .bio(seller.getBio())
                .profileImageUrl(seller.getProfileImageUrl())
                .totalNotes(noteRepository.countBySellerId(seller.getId()))
                .build();

        return NoteResponse.builder()
                .id(note.getId())
                .title(note.getTitle())
                .description(note.getDescription())
                .classLevel(note.getClassLevel())
                .subject(note.getSubject())
                .examType(note.getExamType())
                .price(note.getPrice())
                .thumbnailUrl(note.getThumbnailUrl())
                .previewUrl(note.getPreviewUrl())
                .totalPages(note.getTotalPages())
                .status(note.getStatus())
                .purchaseCount(note.getPurchaseCount())
                .averageRating(note.getAverageRating())
                .reviewCount(note.getReviewCount())
                .seller(sellerProfile)
                .createdAt(note.getCreatedAt())
                .isPurchased(isPurchased)
                .build();
    }

    // ── Private helpers ───────────────────────────────────────

    private User fetchUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }

    private Note fetchSellerOwnedNote(Long noteId, Long sellerId) {
        Note note = noteRepository.findByIdAndSellerIdAndStatusNot(
                noteId, sellerId, NoteStatus.DELETED)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Note not found or you don't have permission to modify it"));
        return note;
    }
}
