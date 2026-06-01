package com.topnotes.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Full question response for ADMIN — includes correct answer key.
 */
@Getter @Builder
public class TestQuestionAdminResponse {
    private Long   id;
    private String questionText;
    private String subject;
    private Integer displayOrder;
    private Boolean isActive;
    private String  correctAnswerKey;
    private List<TestOptionResponse> options;
    private LocalDateTime createdAt;

    @Getter @Builder
    public static class TestOptionResponse {
        private Long    id;
        private String  optionKey;
        private String  optionText;
        private Boolean isCorrect;
    }
}
