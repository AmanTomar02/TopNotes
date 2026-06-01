package com.topnotes.dto.request;

import com.topnotes.entity.enums.ExamType;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** Payload (JSON part of multipart) for the POST /notes endpoint. */
@Getter
@Setter
public class NoteCreateRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 250, message = "Title must be between 5 and 250 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 20, max = 5000, message = "Description must be between 20 and 5000 characters")
    private String description;

    @Size(max = 60, message = "Class level must not exceed 60 characters")
    private String classLevel;

    @Size(max = 100, message = "Subject must not exceed 100 characters")
    private String subject;

    private ExamType examType;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "1.00", message = "Price must be at least ₹1")
    @DecimalMax(value = "99999.99", message = "Price must not exceed ₹99,999")
    @Digits(integer = 7, fraction = 2, message = "Price format is invalid")
    private BigDecimal price;
}
