package com.topnotes.dto.response;

import com.topnotes.entity.enums.UserRole;
import lombok.Builder;
import lombok.Getter;

/** Returned on successful registration or login. */
@Getter
@Builder
public class AuthResponse {

    private Long     userId;
    private String   email;
    private String   fullName;
    private UserRole role;
    private Boolean  isVerified;
    private String   token;

    @Builder.Default
    private String tokenType = "Bearer";
}
