package com.topnotes.service;

import com.topnotes.dto.request.PaymentVerifyRequest;
import com.topnotes.dto.response.PaymentOrderResponse;
import com.topnotes.dto.response.PurchaseResponse;

public interface PaymentService {
    PaymentOrderResponse createOrder(Long noteId, Long buyerId);
    PurchaseResponse verifyAndComplete(PaymentVerifyRequest request, Long buyerId);
}
