package com.topnotes.service;

import com.topnotes.dto.response.PurchaseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** Purchase flow — buy a note and query history. */
public interface PurchaseService {
    PurchaseResponse purchaseNote(Long noteId, Long buyerId);
    PurchaseResponse purchaseNoteWithTransaction(Long noteId, Long buyerId, String transactionId);
    Page<PurchaseResponse> getBuyerPurchases(Long buyerId, Pageable pageable);
    Page<PurchaseResponse> getSellerSales(Long sellerId, Pageable pageable);
    boolean hasBuyerPurchasedNote(Long buyerId, Long noteId);
}
