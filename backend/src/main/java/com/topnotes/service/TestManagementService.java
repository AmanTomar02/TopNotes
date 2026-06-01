package com.topnotes.service;

import com.topnotes.dto.request.TestConfigRequest;
import com.topnotes.dto.request.TestQuestionRequest;
import com.topnotes.dto.response.TestConfigResponse;
import com.topnotes.dto.response.TestQuestionAdminResponse;
import com.topnotes.entity.TestConfig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Admin-only service for managing the configurable verification test.
 * All CRUD for questions + global test config lives here.
 */
public interface TestManagementService {

    // ── Config ────────────────────────────────────────────────
    TestConfigResponse getConfig();
    TestConfigResponse updateConfig(TestConfigRequest request);

    /**
     * Internal use — returns the raw entity so SellerVerificationService
     * can read pass score, shuffle flags, etc. without a second DB hit.
     */
    TestConfig getConfigEntity();

    // ── Questions ─────────────────────────────────────────────
    Page<TestQuestionAdminResponse> getAllQuestions(String keyword, Pageable pageable);
    TestQuestionAdminResponse       getQuestionById(Long id);
    TestQuestionAdminResponse       createQuestion(TestQuestionRequest request);
    TestQuestionAdminResponse       updateQuestion(Long id, TestQuestionRequest request);
    void                            deleteQuestion(Long id);
    TestQuestionAdminResponse       toggleActive(Long id, boolean isActive);

    /** Reorder all questions in bulk — admin drag-and-drop UI. */
    void reorderQuestions(java.util.List<Long> orderedIds);
}
