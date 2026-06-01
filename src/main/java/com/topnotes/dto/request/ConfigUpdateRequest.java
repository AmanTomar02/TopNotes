package com.topnotes.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/** Payload for PUT /admin/config — update a platform configuration key. */
@Getter
@Setter
public class ConfigUpdateRequest {

    @NotBlank(message = "Config key is required")
    @Size(max = 100, message = "Config key must not exceed 100 characters")
    private String configKey;

    @NotBlank(message = "Config value is required")
    private String configValue;

    @Size(max = 350)
    private String description;
}
