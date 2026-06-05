package com.topnotes.controller;

import com.topnotes.dto.request.NoteCreateRequest;
import com.topnotes.dto.request.PriceUpdateRequest;
import com.topnotes.dto.response.ApiResponse;
import com.topnotes.dto.response.NoteResponse;
import com.topnotes.entity.enums.ExamType;
import com.topnotes.exception.UnauthorizedException;
import com.topnotes.security.CustomUserDetails;
import com.topnotes.service.NoteService;
import com.topnotes.service.PurchaseService;
import com.topnotes.util.FileUploadUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Note CRUD, search, preview, and secure full-view endpoints.
 *
 * Public:  GET /notes, GET /notes/{id}, GET /notes/{id}/preview, GET /notes/filters
 * SELLER:  POST /notes, PATCH /notes/{id}/price, DELETE /notes/{id}
 * BUYER:   GET /notes/{id}/view  (requires purchase)
 */
@RestController
@RequestMapping("/notes")
@Tag(name = "Notes", description = "Note listing management and secure content serving")
public class NoteController {

    private final NoteService     noteService;
    private final PurchaseService purchaseService;
    private final FileUploadUtil  fileUploadUtil;

    public NoteController(NoteService noteService,
                          PurchaseService purchaseService,
                          FileUploadUtil fileUploadUtil) {
        this.noteService     = noteService;
        this.purchaseService = purchaseService;
        this.fileUploadUtil  = fileUploadUtil;
    }

    // ── Public: Browse ────────────────────────────────────────

    @GetMapping
    @Operation(summary = "Search/browse notes with optional filters and pagination")
    public ResponseEntity<ApiResponse<Page<NoteResponse>>> searchNotes(
            @RequestParam(required = false) String    keyword,
            @RequestParam(required = false) String    classLevel,
            @RequestParam(required = false) String    subject,
            @RequestParam(required = false) ExamType  examType,
            @RequestParam(defaultValue = "0")  int   page,
            @RequestParam(defaultValue = "12") int   size,
            @AuthenticationPrincipal CustomUserDetails principal) {

        Long viewerId = (principal != null) ? principal.getId() : null;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<NoteResponse> result = noteService.searchNotes(
                keyword, classLevel, subject, examType, pageable, viewerId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get single note details by ID")
    public ResponseEntity<ApiResponse<NoteResponse>> getNote(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {

        Long viewerId = (principal != null) ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(noteService.getNoteById(id, viewerId)));
    }

    @GetMapping("/filters")
    @Operation(summary = "Get available filter options for subjects and class levels")
    public ResponseEntity<ApiResponse<Map<String, List<String>>>> getFilterOptions() {
        return ResponseEntity.ok(ApiResponse.success(noteService.getFilterOptions()));
    }

    // ── Public: First-page PDF Preview ───────────────────────

    @GetMapping("/{id}/preview")
    @Operation(summary = "Stream first-page PDF preview inline (no download)")
    public ResponseEntity<byte[]> getPreview(@PathVariable Long id) {
        NoteResponse note = noteService.getNoteById(id, null);
        if (note.getPreviewUrl() == null) {
            return ResponseEntity.notFound().build();
        }
        return servePdfInline(note.getPreviewUrl());
    }

    // ── BUYER: Secure full-note view ──────────────────────────

    @GetMapping("/{id}/view")
    @PreAuthorize("hasRole('BUYER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Securely stream purchased note PDF inline (BUYER only)")
    public ResponseEntity<byte[]> viewPurchasedNote(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {

        Long buyerId = principal.getId();

        if (!purchaseService.hasBuyerPurchasedNote(buyerId, id)) {
            throw new UnauthorizedException("You have not purchased this note");
        }

        NoteResponse note = noteService.getNoteById(id, buyerId);
        if (note.getPreviewUrl() == null) {
            return ResponseEntity.notFound().build();
        }
        return servePdfInline(note.getPreviewUrl());
    }

    // ── SELLER: Upload new note ───────────────────────────────

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SELLER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Upload a new handwritten note (SELLER only)")
    public ResponseEntity<ApiResponse<NoteResponse>> createNote(
            @RequestPart("data")                       @Valid NoteCreateRequest request,
            @RequestPart("pdf")                               MultipartFile     pdf,
            @RequestPart(value = "thumbnail", required = false) MultipartFile   thumbnail,
            @AuthenticationPrincipal CustomUserDetails principal) {

        NoteResponse created = noteService.createNote(request, pdf, thumbnail, principal.getId());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Note uploaded successfully", created));
    }

    // ── SELLER: Update price ──────────────────────────────────

    @PatchMapping("/{id}/price")
    @PreAuthorize("hasRole('SELLER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update note price (SELLER — own notes only)")
    public ResponseEntity<ApiResponse<NoteResponse>> updatePrice(
            @PathVariable Long id,
            @Valid @RequestBody PriceUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        NoteResponse updated = noteService.updatePrice(id, request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Price updated successfully", updated));
    }

    // ── SELLER: Delete note ───────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Soft-delete a note (SELLER — own notes only)")
    public ResponseEntity<ApiResponse<Void>> deleteNote(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {

        noteService.deleteNote(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Note deleted successfully"));
    }

    // ── Private: Secure PDF response builder ──────────────────

    /**
     * Serves PDF bytes as an inline response with headers that prevent
     * browser download, caching, and iframe embedding on other origins.
     */
    private ResponseEntity<byte[]> servePdfInline(String relativeUrl) {
        try {
            byte[] bytes = fileUploadUtil.readFileBytes(relativeUrl);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.inline().build());
            // Content protection headers
            headers.set("Cache-Control",        "no-store, no-cache, must-revalidate, max-age=0");
            headers.set("Pragma",               "no-cache");
            headers.set("X-Content-Type-Options","nosniff");
            headers.set("X-Frame-Options",      "SAMEORIGIN");
            headers.set("X-Download-Options",   "noopen");
            headers.set("Content-Security-Policy","default-src 'none'");

            return ResponseEntity.ok().headers(headers).body(bytes);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
