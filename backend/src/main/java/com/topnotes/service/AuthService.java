package com.topnotes.service;

import com.topnotes.dto.request.LoginRequest;
import com.topnotes.dto.request.RegisterRequest;
import com.topnotes.dto.response.AuthResponse;

/** Authentication operations — registration, login, and role upgrade. */
public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);

    /**
     * Upgrade an existing BUYER into a SELLER so they can start selling
     * (still requires completing the verification flow before publishing).
     * Returns a freshly-minted JWT reflecting the new role. Idempotent for
     * users who are already sellers; rejected for admins.
     */
    AuthResponse becomeSeller(Long userId);

    /**
     * Re-issue a fresh JWT for the current user reflecting their latest account
     * state (role, verification). Lets a just-approved seller pick up
     * {@code isVerified=true} on reload without logging out and back in.
     */
    AuthResponse refreshToken(Long userId);

    /** Current seller payout UPI (null if not set yet). */
    String getUpiId(Long userId);

    /** Validate and save the seller's payout UPI VPA. */
    void updateUpiId(Long userId, String upiId);
}
