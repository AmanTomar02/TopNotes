package com.topnotes.controller;

import com.topnotes.dto.response.ApiResponse;
import com.topnotes.dto.response.AuthResponse;
import com.topnotes.security.CustomUserDetails;
import com.topnotes.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Self-service account actions for the logged-in user.
 *
 * Currently exposes the "become a seller" upgrade, which lets a buyer opt into
 * selling. The account keeps its buying ability; selling still requires the
 * existing verification flow before any note can be published.
 */
@RestController
@RequestMapping("/profile")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Profile", description = "Self-service account operations")
public class ProfileController {

    private final AuthService authService;

    public ProfileController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/become-seller")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Upgrade the current account to a SELLER and re-issue the JWT")
    public ResponseEntity<ApiResponse<AuthResponse>> becomeSeller(
            @AuthenticationPrincipal CustomUserDetails principal) {

        AuthResponse response = authService.becomeSeller(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("You can now start selling", response));
    }

    @PostMapping("/refresh-token")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Re-issue the JWT with the current account state (role, verification)")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @AuthenticationPrincipal CustomUserDetails principal) {

        AuthResponse response = authService.refreshToken(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
