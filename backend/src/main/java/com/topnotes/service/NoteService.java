package com.topnotes.service;

import com.topnotes.dto.request.NoteCreateRequest;
import com.topnotes.dto.request.PriceUpdateRequest;
import com.topnotes.dto.response.NoteResponse;
import com.topnotes.entity.enums.ExamType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/** CRUD and search operations for note listings. */
public interface NoteService {

    /** Upload a new note — PDF and optional thumbnail are required. */
    NoteResponse createNote(NoteCreateRequest request,
                            MultipartFile pdf,
                            MultipartFile thumbnail,
                            Long sellerId);

    /** Paginated search with optional filters. viewerId used to set isPurchased flag. */
    Page<NoteResponse> searchNotes(String keyword,
                                   String classLevel,
                                   String subject,
                                   ExamType examType,
                                   Pageable pageable,
                                   Long viewerId);

    /** Single note detail. viewerId may be null for anonymous access. */
    NoteResponse getNoteById(Long noteId, Long viewerId);

    /** All notes owned by a seller (includes INACTIVE, excludes DELETED). */
    Page<NoteResponse> getSellerNotes(Long sellerId, Pageable pageable);

    /** Seller updates price only — no other fields. */
    NoteResponse updatePrice(Long noteId, PriceUpdateRequest request, Long sellerId);

    /** Soft-delete — sets status to DELETED. */
    void deleteNote(Long noteId, Long sellerId);

    /** Available filter options for the browse dropdowns. */
    Map<String, List<String>> getFilterOptions();

    /**
     * Maps a Note entity to NoteResponse DTO.
     * Exposed so DashboardService can reuse the mapping logic.
     */
    NoteResponse toResponse(com.topnotes.entity.Note note, Long viewerId);
}
