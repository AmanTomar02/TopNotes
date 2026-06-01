package com.topnotes.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

/** Payload for submitting a star review on a purchased note. */
@Getter
@Setter
public class ReviewRequest {

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must not exceed 5")
    private Integer rating;

    @Size(max = 2000, message = "Comment must not exceed 2000 characters")
    private String comment;
}
