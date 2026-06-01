package com.topnotes.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/** Admin dashboard analytics payload. */
@Getter
@Builder
public class DashboardResponse {

    // ── Totals ────────────────────────────────────────────────
    private BigDecimal totalRevenue;
    private BigDecimal platformRevenue;
    private BigDecimal sellerRevenue;
    private Long       totalUsers;
    private Long       totalSellers;
    private Long       totalBuyers;
    private Long       totalNotes;
    private Long       totalPurchases;

    // ── Period revenue ────────────────────────────────────────
    private BigDecimal todayRevenue;
    private BigDecimal monthRevenue;
    private BigDecimal yearRevenue;

    // ── Chart data ────────────────────────────────────────────
    /** Daily revenue for the last 30 days: [{date, revenue}] */
    private List<Map<String, Object>> dailyRevenue;
    /** Monthly revenue for the current year: [{month, year, revenue}] */
    private List<Map<String, Object>> monthlyRevenue;

    // ── Action required ───────────────────────────────────────
    private Long pendingSellerApprovals;
}
