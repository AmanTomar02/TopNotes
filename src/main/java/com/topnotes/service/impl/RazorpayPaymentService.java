package com.topnotes.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.topnotes.dto.request.PaymentVerifyRequest;
import com.topnotes.dto.response.PaymentOrderResponse;
import com.topnotes.dto.response.PurchaseResponse;
import com.topnotes.entity.Note;
import com.topnotes.entity.User;
import com.topnotes.exception.BadRequestException;
import com.topnotes.exception.ResourceNotFoundException;
import com.topnotes.repository.NoteRepository;
import com.topnotes.repository.PurchaseRepository;
import com.topnotes.repository.UserRepository;
import com.topnotes.service.PaymentService;
import com.topnotes.service.PurchaseService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
public class RazorpayPaymentService implements PaymentService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final PurchaseRepository purchaseRepository;
    private final PurchaseService purchaseService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${payment.razorpay.key-id:}")
    private String keyId;

    @Value("${payment.razorpay.key-secret:}")
    private String keySecret;

    @Value("${payment.razorpay.currency:INR}")
    private String currency;

    public RazorpayPaymentService(NoteRepository noteRepository,
                                  UserRepository userRepository,
                                  PurchaseRepository purchaseRepository,
                                  PurchaseService purchaseService,
                                  ObjectMapper objectMapper) {
        this.noteRepository = noteRepository;
        this.userRepository = userRepository;
        this.purchaseRepository = purchaseRepository;
        this.purchaseService = purchaseService;
        this.objectMapper = objectMapper;
    }

    @Override
    public PaymentOrderResponse createOrder(Long noteId, Long buyerId) {
        if (purchaseRepository.existsByBuyerIdAndNoteId(buyerId, noteId)) {
            throw new BadRequestException("You have already purchased this note");
        }

        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", noteId));
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", buyerId));

        Long amountPaise = toPaise(note.getPrice());
        String orderId = isRazorpayConfigured()
                ? createRazorpayOrder(note, amountPaise)
                : "demo_order_" + UUID.randomUUID();

        return PaymentOrderResponse.builder()
                .provider(isRazorpayConfigured() ? "RAZORPAY" : "DEMO")
                .keyId(keyId)
                .orderId(orderId)
                .amountPaise(amountPaise)
                .amount(note.getPrice())
                .currency(currency)
                .noteId(note.getId())
                .noteTitle(note.getTitle())
                .buyerName(buyer.getFullName())
                .buyerEmail(buyer.getEmail())
                .build();
    }

    @Override
    public PurchaseResponse verifyAndComplete(PaymentVerifyRequest request, Long buyerId) {
        if (request.getRazorpayOrderId().startsWith("demo_order_")) {
            return purchaseService.purchaseNoteWithTransaction(
                    request.getNoteId(), buyerId, request.getRazorpayPaymentId());
        }

        if (!isRazorpayConfigured()) {
            throw new BadRequestException("Razorpay keys are not configured");
        }

        String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
        String expectedSignature = hmacSha256(payload, keySecret);
        if (!constantTimeEquals(expectedSignature, request.getRazorpaySignature())) {
            throw new BadRequestException("Payment verification failed");
        }

        return purchaseService.purchaseNoteWithTransaction(
                request.getNoteId(), buyerId, request.getRazorpayPaymentId());
    }

    private String createRazorpayOrder(Note note, Long amountPaise) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "amount", amountPaise,
                    "currency", currency,
                    "receipt", "note_" + note.getId() + "_" + UUID.randomUUID(),
                    "notes", Map.of("noteId", String.valueOf(note.getId()), "title", note.getTitle())
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.razorpay.com/v1/orders"))
                    .header("Authorization", "Basic " + basicAuth())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new BadRequestException("Could not create Razorpay order");
            }

            JsonNode json = objectMapper.readTree(response.body());
            return json.path("id").asText();
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Payment gateway is not reachable");
        }
    }

    private boolean isRazorpayConfigured() {
        return keyId != null && !keyId.isBlank()
                && keySecret != null && !keySecret.isBlank();
    }

    private String basicAuth() {
        return Base64.getEncoder()
                .encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
    }

    private Long toPaise(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();
    }

    private String hmacSha256(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            throw new BadRequestException("Could not verify payment signature");
        }
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null || a.length() != b.length()) return false;
        int result = 0;
        for (int i = 0; i < a.length(); i++) result |= a.charAt(i) ^ b.charAt(i);
        return result == 0;
    }
}
