package com.topnotes.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

/**
 * Cashfree Payouts integration (disburse side) — the isolated "seam" the rest
 * of the app calls. Standard Transfer to a UPI VPA (Payouts V2).
 *
 * NOTE: Cashfree Payouts requires the server's outbound IP to be whitelisted in
 * the Cashfree dashboard (Payouts → IP Whitelist). Until that's done, transfers
 * return an authentication error.
 */
@Service
@Slf4j
public class CashfreePayoutService {

    private static final String API_VERSION = "2024-01-01";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${cashfree.env:sandbox}")
    private String env;
    @Value("${cashfree.payout.client-id:}")
    private String clientId;
    @Value("${cashfree.payout.client-secret:}")
    private String clientSecret;

    public CashfreePayoutService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    private String base() {
        return "production".equalsIgnoreCase(env)
                ? "https://api.cashfree.com/payout"
                : "https://sandbox.cashfree.com/payout";
    }

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank() && clientSecret != null && !clientSecret.isBlank();
    }

    /** Outcome of a payout attempt. */
    public record PayoutResult(boolean success, String reference, String message) {}

    /**
     * Disburse {@code amount} to a seller's {@code upiId}. Cashfree Payouts V2
     * requires a beneficiary to exist first, so we create a fresh one (unique
     * per payout, so it always reflects the current UPI) then transfer to it.
     */
    public PayoutResult transferToUpi(String transferId, String name, String email,
                                      String phone, String upiId, BigDecimal amount) {
        if (!isConfigured()) {
            return new PayoutResult(false, null, "Payouts are not configured");
        }
        String beneId = "ben" + transferId;
        try {
            // 1) Create the beneficiary (unique id → always new, holds the current UPI).
            String beneBody = objectMapper.writeValueAsString(Map.of(
                    "beneficiary_id", beneId,
                    "beneficiary_name", name,
                    "beneficiary_instrument_details", Map.of("vpa", upiId),
                    "beneficiary_contact_details", Map.of(
                            "beneficiary_phone", (phone == null || phone.isBlank()) ? "9999999999" : phone,
                            "beneficiary_email", (email == null || email.isBlank()) ? "payouts@topnotes.com" : email,
                            "beneficiary_country_code", "+91")
            ));
            HttpResponse<String> beneResp = post("/beneficiary", beneBody, transferId);
            if (beneResp.statusCode() >= 300) {
                JsonNode bj = objectMapper.readTree(beneResp.body());
                String bmsg = bj.path("message").asText("");
                if (!bmsg.toLowerCase().contains("exist")) { // ignore "already exists"
                    log.error("Cashfree create-beneficiary failed [{}]: {}", beneResp.statusCode(), beneResp.body());
                    return new PayoutResult(false, null, "Beneficiary error: " + bmsg);
                }
            }

            // 2) Transfer to the beneficiary.
            String body = objectMapper.writeValueAsString(Map.of(
                    "transfer_id", transferId,
                    "transfer_amount", amount,
                    "transfer_mode", "upi",
                    "beneficiary_details", Map.of("beneficiary_id", beneId)
            ));
            HttpResponse<String> resp = post("/transfers", body, transferId);
            JsonNode json = objectMapper.readTree(resp.body());

            if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
                String status = json.path("status").asText("");
                String cfRef = json.path("cf_transfer_id").asText(transferId);
                boolean ok = !"FAILED".equalsIgnoreCase(status) && !"REJECTED".equalsIgnoreCase(status);
                return new PayoutResult(ok, cfRef,
                        ok ? status : json.path("message").asText("Transfer failed"));
            }

            String msg = json.path("message").asText("Payout failed (" + resp.statusCode() + ")");
            log.error("Cashfree payout failed [{}]: {}", resp.statusCode(), resp.body());
            return new PayoutResult(false, null, msg);

        } catch (Exception e) {
            log.error("Cashfree payout error", e);
            return new PayoutResult(false, null, "Payout gateway not reachable");
        }
    }

    private HttpResponse<String> post(String path, String body, String requestId) throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(base() + path))
                .header("x-client-id", clientId)
                .header("x-client-secret", clientSecret)
                .header("x-api-version", API_VERSION)
                .header("x-request-id", requestId)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        return httpClient.send(req, HttpResponse.BodyHandlers.ofString());
    }
}
