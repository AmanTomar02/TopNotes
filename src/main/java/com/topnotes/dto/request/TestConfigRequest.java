package com.topnotes.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

/** Admin updates global test configuration. */
@Getter @Setter
public class TestConfigRequest {

    @NotNull(message = "Pass score percent is required")
    @Min(value = 1,   message = "Pass score must be at least 1%")
    @Max(value = 100, message = "Pass score must not exceed 100%")
    private Integer passScorePercent;

    @NotNull(message = "Time limit is required")
    @Min(value = 0,   message = "Time limit cannot be negative")
    @Max(value = 240, message = "Time limit cannot exceed 240 minutes")
    private Integer timeLimitMinutes;

    @NotNull(message = "Max attempts is required")
    @Min(value = 0,   message = "Max attempts cannot be negative")
    private Integer maxAttempts;

    @NotNull(message = "Questions per test is required")
    @Min(value = 1,   message = "Must serve at least 1 question")
    private Integer questionsPerTest;

    @NotNull(message = "shuffleQuestions is required")
    private Boolean shuffleQuestions;

    @NotNull(message = "shuffleOptions is required")
    private Boolean shuffleOptions;

    @NotNull(message = "isActive is required")
    private Boolean isActive;
}
