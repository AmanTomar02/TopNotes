package com.topnotes.service;

import com.topnotes.dto.response.UserResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/** Manages the seller onboarding verification flow. */
public interface SellerVerificationService {

    /** Returns MCQ questions stripped of correct answers. */
    List<Map<String, Object>> getTestQuestions(Long sellerId);

    /**
     * Grades submitted answers, persists attempt, and updates seller if passed.
     *
     * @param sellerId seller performing the test
     * @param answers  map of question-id → selected-option-key (e.g. {"1":"A","2":"B"})
     */
    Map<String, Object> submitTest(Long sellerId, Map<Integer, String> answers);

    /** Stores marksheet file and marks seller as having uploaded it. */
    String uploadMarksheet(Long sellerId, MultipartFile marksheet);

    /** Admin approves or rejects a seller's marksheet. */
    UserResponse adminApproveOrReject(Long sellerId, boolean approved, String reason);

    boolean hasPassedTest(Long sellerId);
    boolean hasUploadedMarksheet(Long sellerId);
    boolean isVerified(Long sellerId);
}
