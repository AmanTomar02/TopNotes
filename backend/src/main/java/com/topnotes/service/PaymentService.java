package com.topnotes.service;

import com.topnotes.dto.request.PaymentVerifyRequest;
import com.topnotes.dto.response.PaymentOrderResponse;
import com.topnotes.dto.response.PurchaseResponse;

public interface PaymentService {
    PaymentOrderResponse createOrder(Long noteId, Long buyerId);
    PurchaseResponse verifyAndComplete(PaymentVerifyRequest request, Long buyerId);

    /**
     * Server-to-server payment notification from Cashfree. Records the purchase
     * even if the buyer's browser never returned to call verify. Idempotent.
     */
    void handleWebhook(String rawBody, String signature, String timestamp);
}
