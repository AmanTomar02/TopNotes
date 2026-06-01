package com.topnotes.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/** Seller dashboard analytics payload. */
@Getter
@Builder
public class SellerDashboardResponse {
    private BigDecimal           totalEarnings;
    private BigDecimal           monthEarnings;
    private BigDecimal           todayEarnings;
    private Long                 totalNotes;
    private Long                 totalSales;
    private BigDecimal           averageRating;
    /** Daily sales chart: [{date, revenue}] */
    private List<Map<String, Object>> salesChart;
    private List<NoteResponse>   recentNotes;
    private Boolean              isVerified;
    private Boolean              testPassed;
    private Boolean              marksheetUploaded;
}
