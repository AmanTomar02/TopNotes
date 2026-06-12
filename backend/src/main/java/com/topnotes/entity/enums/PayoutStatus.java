package com.topnotes.entity.enums;

/** Lifecycle of a seller payout (withdrawal) request. */
public enum PayoutStatus {
    PENDING,  // requested by seller, awaiting admin payout
    PAID,     // disbursed via Cashfree Payouts
    FAILED    // Cashfree transfer failed — amount returns to the seller's balance
}
