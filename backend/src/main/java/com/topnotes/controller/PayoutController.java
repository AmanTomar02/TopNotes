package com.topnotes.controller;

import com.topnotes.dto.response.ApiResponse;
import com.topnotes.dto.response.PayoutResponse;
import com.topnotes.dto.response.SellerEarningsResponse;
import com.topnotes.security.CustomUserDetails;
import com.topnotes.service.PayoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Seller earnings + withdrawals, and the admin payout queue.
 * Paths stay under /seller/** and /admin/** to inherit the SecurityConfig role rules.
 */
@RestController
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Payouts", description = "Seller earnings and admin-triggered payouts")
public class PayoutController {

    private final PayoutService payoutService;

    public PayoutController(PayoutService payoutService) {
        this.payoutService = payoutService;
    }

    // ── Seller ────────────────────────────────────────────────

    @GetMapping("/seller/earnings")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "Seller earnings ledger (earned / paid / available)")
    public ResponseEntity<ApiResponse<SellerEarningsResponse>> earnings(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(payoutService.getEarnings(principal.getId())));
    }

    @PostMapping("/seller/payouts")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "Request a withdrawal of the available balance")
    public ResponseEntity<ApiResponse<PayoutResponse>> requestPayout(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(
                ApiResponse.success("Withdrawal requested", payoutService.requestPayout(principal.getId())));
    }

    @GetMapping("/seller/payouts")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "Seller's own payout history")
    public ResponseEntity<ApiResponse<Page<PayoutResponse>>> sellerPayouts(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails principal) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(
                payoutService.getSellerPayouts(principal.getId(), pageable)));
    }

    // ── Admin ─────────────────────────────────────────────────

    @GetMapping("/admin/payouts/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Pending payout requests awaiting disbursement")
    public ResponseEntity<ApiResponse<Page<PayoutResponse>>> pendingPayouts(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size); // method name already orders by requestedAt asc
        return ResponseEntity.ok(ApiResponse.success(payoutService.getPendingPayouts(pageable)));
    }

    @PostMapping("/admin/payouts/{id}/pay")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Disburse a payout to the seller's UPI via Cashfree Payouts")
    public ResponseEntity<ApiResponse<PayoutResponse>> pay(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Payout processed", payoutService.payPayout(id)));
    }
}
