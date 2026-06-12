package com.topnotes.controller;

import com.topnotes.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public payment-gateway webhooks (no JWT — called server-to-server by Cashfree).
 * Configure the URL in the Cashfree dashboard: {backend}/api/payments/webhook/cashfree
 */
@RestController
@RequestMapping("/payments/webhook")
@Tag(name = "Webhooks", description = "Payment gateway server-to-server callbacks")
public class WebhookController {

    private final PaymentService paymentService;

    public WebhookController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/cashfree")
    @Operation(summary = "Cashfree payment webhook — records the purchase even if the buyer's tab closed")
    public ResponseEntity<String> cashfree(
            @RequestBody(required = false) String rawBody,
            @RequestHeader(value = "x-webhook-signature", required = false) String signature,
            @RequestHeader(value = "x-webhook-timestamp", required = false) String timestamp) {

        paymentService.handleWebhook(rawBody, signature, timestamp);
        // Always 200 so Cashfree treats it as delivered and doesn't retry-storm.
        return ResponseEntity.ok("OK");
    }
}
