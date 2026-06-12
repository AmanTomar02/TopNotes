package com.topnotes.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

/** Seller earnings ledger summary for the dashboard / withdraw screen. */
@Getter
@Builder
public class SellerEarningsResponse {
    private BigDecimal totalEarned;   // lifetime seller share
    private BigDecimal paidOut;       // already disbursed
    private BigDecimal inProgress;    // requested, awaiting admin payout
    private BigDecimal available;     // withdrawable now
    private BigDecimal minWithdraw;
    private boolean    upiSet;        // is a payout UPI configured
}
