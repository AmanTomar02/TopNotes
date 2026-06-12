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
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * Cashfree Payment Gateway integration (collect side).
 *  - createOrder  → POST /pg/orders, returns a payment_session_id for the JS SDK.
 *  - verifyAndComplete → GET /pg/orders/{id}, confirms PAID, then records the
 *    Purchase (with the platform/seller revenue split) server-side.
 * No IP whitelist is required for the PG product (unlike Payouts).
 */
@Service
@Slf4j
public class CashfreePaymentService implements PaymentService {

    private static final String API_VERSION = "2023-08-01";

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final PurchaseRepository purchaseRepository;
    private final PurchaseService purchaseService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${cashfree.env:sandbox}")
    private String env;
    @Value("${cashfree.pg.app-id:}")
    private String appId;
    @Value("${cashfree.pg.secret:}")
    private String secret;
    @Value("${app.business.currency:INR}")
    private String currency;

    public CashfreePaymentService(NoteRepository noteRepository,
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

    private String pgBase() {
        return "production".equalsIgnoreCase(env)
                ? "https://api.cashfree.com/pg"
                : "https://sandbox.cashfree.com/pg";
    }

    private boolean isConfigured() {
        return appId != null && !appId.isBlank() && secret != null && !secret.isBlank();
    }

    @Override
    public PaymentOrderResponse createOrder(Long noteId, Long buyerId) {
        if (!isConfigured()) {
            throw new BadRequestException("Payment gateway is not configured");
        }
        if (purchaseRepository.existsByBuyerIdAndNoteId(buyerId, noteId)) {
            throw new BadRequestException("You have already purchased this note");
        }

        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", noteId));
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", buyerId));
        if (note.getSeller().getId().equals(buyerId)) {
            throw new BadRequestException("You cannot purchase your own note");
        }

        String orderId = "tn_" + noteId + "_" + buyerId + "_" + System.currentTimeMillis();
        String phone = (buyer.getPhone() != null && !buyer.getPhone().isBlank())
                ? buyer.getPhone() : "9999999999";

        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "order_id", orderId,
                    "order_amount", note.getPrice(),
                    "order_currency", currency,
                    "customer_details", Map.of(
                            "customer_id", "u" + buyerId,
                            "customer_email", buyer.getEmail(),
                            "customer_phone", phone),
                    "order_note", "TopNotes note #" + noteId
            ));

            HttpResponse<String> resp = send(HttpRequest.newBuilder()
                    .uri(URI.create(pgBase() + "/orders"))
                    .header("x-client-id", appId)
                    .header("x-client-secret", secret)
                    .header("x-api-version", API_VERSION)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build());

            JsonNode json = objectMapper.readTree(resp.body());
            if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
                log.error("Cashfree create-order failed [{}]: {}", resp.statusCode(), resp.body());
                throw new BadRequestException("Could not start payment: " + json.path("message").asText());
            }

            return PaymentOrderResponse.builder()
                    .provider("CASHFREE")
                    .mode(env)
                    .orderId(json.path("order_id").asText())
                    .paymentSessionId(json.path("payment_session_id").asText())
                    .amount(note.getPrice())
                    .currency(currency)
                    .noteId(note.getId())
                    .noteTitle(note.getTitle())
                    .buyerName(buyer.getFullName())
                    .buyerEmail(buyer.getEmail())
                    .build();

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Cashfree order error", e);
            throw new BadRequestException("Payment gateway is not reachable");
        }
    }

    @Override
    public PurchaseResponse verifyAndComplete(PaymentVerifyRequest request, Long buyerId) {
        if (!isConfigured()) {
            throw new BadRequestException("Payment gateway is not configured");
        }
        String orderId = request.getOrderId();

        try {
            HttpResponse<String> resp = send(HttpRequest.newBuilder()
                    .uri(URI.create(pgBase() + "/orders/" + orderId))
                    .header("x-client-id", appId)
                    .header("x-client-secret", secret)
                    .header("x-api-version", API_VERSION)
                    .GET()
                    .build());

            JsonNode json = objectMapper.readTree(resp.body());
            if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
                throw new BadRequestException("Could not verify payment");
            }

            String status = json.path("order_status").asText();
            if (!"PAID".equalsIgnoreCase(status)) {
                throw new BadRequestException("Payment not completed (status: " + status + ")");
            }

            // Anti-tamper: the order must be for this note's price.
            Note note = noteRepository.findById(request.getNoteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Note", request.getNoteId()));
            BigDecimal paid = new BigDecimal(json.path("order_amount").asText("0"));
            if (paid.compareTo(note.getPrice()) < 0) {
                throw new BadRequestException("Paid amount does not match the note price");
            }

            // Records the Purchase + revenue split + seller Earning (idempotent on duplicate).
            return purchaseService.purchaseNoteWithTransaction(request.getNoteId(), buyerId, orderId);

        } catch (BadRequestException | ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Cashfree verify error", e);
            throw new BadRequestException("Payment verification failed");
        }
    }

    private HttpResponse<String> send(HttpRequest req) throws Exception {
        return httpClient.send(req, HttpResponse.BodyHandlers.ofString());
    }

    @Override
    public void handleWebhook(String rawBody, String signature, String timestamp) {
        if (rawBody == null || rawBody.isBlank()) return;

        // Verify the webhook is genuinely from Cashfree: HMAC-SHA256(timestamp + body).
        if (!verifySignature(rawBody, signature, timestamp)) {
            log.warn("Cashfree webhook: invalid/missing signature — ignoring");
            return;
        }

        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String type = root.path("type").asText("");
            if (!type.contains("PAYMENT_SUCCESS")) {
                return; // only act on successful payments
            }

            String orderId = root.path("data").path("order").path("order_id").asText("");
            // order_id format is "tn_{noteId}_{buyerId}_{timestamp}"
            String[] parts = orderId.split("_");
            if (parts.length < 4 || !"tn".equals(parts[0])) {
                log.warn("Cashfree webhook: unrecognised order_id '{}'", orderId);
                return;
            }
            Long noteId = Long.parseLong(parts[1]);
            Long buyerId = Long.parseLong(parts[2]);

            try {
                purchaseService.purchaseNoteWithTransaction(noteId, buyerId, orderId);
                log.info("Cashfree webhook recorded purchase note={} buyer={} order={}", noteId, buyerId, orderId);
            } catch (Exception alreadyDone) {
                // Frontend verify likely recorded it already — idempotent, ignore.
                log.debug("Cashfree webhook: purchase already recorded for order={}", orderId);
            }
        } catch (Exception e) {
            log.error("Cashfree webhook parse error", e);
        }
    }

    private boolean verifySignature(String rawBody, String signature, String timestamp) {
        if (signature == null || timestamp == null || secret == null || secret.isBlank()) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal((timestamp + rawBody).getBytes(StandardCharsets.UTF_8));
            String computed = Base64.getEncoder().encodeToString(digest);
            return computed.equals(signature);
        } catch (Exception e) {
            return false;
        }
    }
}
