package com.topnotes.service;

import com.topnotes.dto.response.PayoutResponse;
import com.topnotes.dto.response.SellerEarningsResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** Seller earnings + admin-triggered payout operations. */
public interface PayoutService {

    SellerEarningsResponse getEarnings(Long sellerId);

    /** Seller requests a withdrawal of their available balance. */
    PayoutResponse requestPayout(Long sellerId);

    Page<PayoutResponse> getPendingPayouts(Pageable pageable);

    Page<PayoutResponse> getSellerPayouts(Long sellerId, Pageable pageable);

    /** Admin disburses a pending payout via Cashfree Payouts. */
    PayoutResponse payPayout(Long payoutId);
}
