package com.topnotes.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** Payload for PATCH /notes/{id}/price — seller updates note price. */
@Getter
@Setter
public class PriceUpdateRequest {

    @NotNull(message = "Price is required")
    @DecimalMin(value = "1.00", message = "Price must be at least ₹1")
    @DecimalMax(value = "99999.99", message = "Price must not exceed ₹99,999")
    @Digits(integer = 7, fraction = 2, message = "Price format is invalid")
    private BigDecimal price;
}
