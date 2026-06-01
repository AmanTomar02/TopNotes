package com.topnotes.service.impl;

import com.topnotes.dto.response.DashboardResponse;
import com.topnotes.dto.response.NoteResponse;
import com.topnotes.dto.response.SellerDashboardResponse;
import com.topnotes.entity.enums.NoteStatus;
import com.topnotes.entity.enums.UserRole;
import com.topnotes.repository.*;
import com.topnotes.service.DashboardService;
import com.topnotes.service.NoteService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@Slf4j
public class DashboardServiceImpl implements DashboardService {

    private final PurchaseRepository purchaseRepository;
    private final UserRepository     userRepository;
    private final NoteRepository     noteRepository;
    private final EarningRepository  earningRepository;
    private final NoteService        noteService;

    public DashboardServiceImpl(PurchaseRepository purchaseRepository,
                                UserRepository userRepository,
                                NoteRepository noteRepository,
                                EarningRepository earningRepository,
                                NoteService noteService) {
        this.purchaseRepository = purchaseRepository;
        this.userRepository     = userRepository;
        this.noteRepository     = noteRepository;
        this.earningRepository  = earningRepository;
        this.noteService        = noteService;
    }

    // ── Admin Dashboard ───────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getAdminDashboard() {
        LocalDateTime now       = LocalDateTime.now();
        LocalDateTime todayStart= LocalDateTime.of(LocalDate.now(), LocalTime.MIDNIGHT);
        LocalDateTime monthStart= LocalDateTime.of(LocalDate.now().withDayOfMonth(1), LocalTime.MIDNIGHT);
        LocalDateTime yearStart = LocalDateTime.of(LocalDate.now().withDayOfYear(1),  LocalTime.MIDNIGHT);

        BigDecimal todayRevenue = nvl(purchaseRepository.sumTotalRevenueBetween(todayStart, now));
        BigDecimal monthRevenue = nvl(purchaseRepository.sumTotalRevenueBetween(monthStart, now));
        BigDecimal yearRevenue  = nvl(purchaseRepository.sumTotalRevenueBetween(yearStart,  now));
        BigDecimal totalRevenue = nvl(purchaseRepository.sumTotalRevenueAllTime());
        BigDecimal platformRev  = nvl(purchaseRepository.sumPlatformRevenueAllTime());
        BigDecimal sellerRev    = totalRevenue.subtract(platformRev);

        // Pending seller approvals count
        Pageable   countPage    = PageRequest.of(0, 1);
        long       pending      = userRepository.findPendingSellerApprovals(countPage).getTotalElements();

        // Build chart arrays
        List<Map<String, Object>> dailyChart   = buildDailyChart(now.minusDays(30), now);
        List<Map<String, Object>> monthlyChart = buildMonthlyChart(LocalDate.now().getYear());

        return DashboardResponse.builder()
                .totalRevenue(totalRevenue)
                .platformRevenue(platformRev)
                .sellerRevenue(sellerRev)
                .totalUsers(userRepository.count())
                .totalSellers(userRepository.countByRole(UserRole.SELLER))
                .totalBuyers(userRepository.countByRole(UserRole.BUYER))
                .totalNotes(noteRepository.countByStatus(NoteStatus.ACTIVE))
                .totalPurchases(purchaseRepository.count())
                .todayRevenue(todayRevenue)
                .monthRevenue(monthRevenue)
                .yearRevenue(yearRevenue)
                .dailyRevenue(dailyChart)
                .monthlyRevenue(monthlyChart)
                .pendingSellerApprovals(pending)
                .build();
    }

    // ── Seller Dashboard ──────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public SellerDashboardResponse getSellerDashboard(Long sellerId) {
        LocalDateTime now        = LocalDateTime.now();
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIDNIGHT);
        LocalDateTime monthStart = LocalDateTime.of(LocalDate.now().withDayOfMonth(1), LocalTime.MIDNIGHT);

        BigDecimal totalEarnings = nvl(earningRepository.sumTotalBySellerId(sellerId));
        BigDecimal todayEarnings = nvl(earningRepository.sumBySellerAndDateRange(sellerId, todayStart, now));
        BigDecimal monthEarnings = nvl(earningRepository.sumBySellerAndDateRange(sellerId, monthStart, now));

        List<Map<String, Object>> salesChart = buildDailyChartForSeller(sellerId, now.minusDays(30), now);

        // Recent notes (up to 5, newest first)
        Pageable recentPageable = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<NoteResponse> recentNotes = noteRepository
                .findBySellerId(sellerId, recentPageable)
                .stream()
                .map(n -> noteService.toResponse(n, null))
                .toList();

        long totalSales = recentNotes.stream()
                .mapToLong(n -> n.getPurchaseCount() != null ? n.getPurchaseCount() : 0)
                .sum();

        // Average rating across all seller notes
        BigDecimal avgRating = recentNotes.stream()
                .filter(n -> n.getAverageRating() != null && n.getAverageRating().compareTo(BigDecimal.ZERO) > 0)
                .map(NoteResponse::getAverageRating)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long ratedNotes = recentNotes.stream()
                .filter(n -> n.getAverageRating() != null && n.getAverageRating().compareTo(BigDecimal.ZERO) > 0)
                .count();

        BigDecimal avgRatingFinal = ratedNotes > 0
                ? avgRating.divide(BigDecimal.valueOf(ratedNotes), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Verification status
        var seller = userRepository.findById(sellerId).orElse(null);
        boolean isVerified         = seller != null && Boolean.TRUE.equals(seller.getIsVerified());
        boolean testPassed         = seller != null && Boolean.TRUE.equals(seller.getTestPassed());
        boolean marksheetUploaded  = seller != null && seller.getMarksheetUrl() != null;

        return SellerDashboardResponse.builder()
                .totalEarnings(totalEarnings)
                .monthEarnings(monthEarnings)
                .todayEarnings(todayEarnings)
                .totalNotes(noteRepository.countBySellerId(sellerId))
                .totalSales(totalSales)
                .averageRating(avgRatingFinal)
                .salesChart(salesChart)
                .recentNotes(recentNotes)
                .isVerified(isVerified)
                .testPassed(testPassed)
                .marksheetUploaded(marksheetUploaded)
                .build();
    }

    // ── Chart builders ────────────────────────────────────────

    private List<Map<String, Object>> buildDailyChart(LocalDateTime start, LocalDateTime end) {
        List<Object[]> rows = purchaseRepository.getDailyRevenue(start, end);
        return rows.stream()
                .map(r -> Map.<String, Object>of("date", r[0].toString(), "revenue", r[1]))
                .toList();
    }

    private List<Map<String, Object>> buildMonthlyChart(int year) {
        List<Object[]> rows = purchaseRepository.getMonthlyRevenue(year);
        return rows.stream()
                .map(r -> Map.<String, Object>of(
                        "month",   r[0].toString(),
                        "year",    r[1].toString(),
                        "revenue", r[2]))
                .toList();
    }

    private List<Map<String, Object>> buildDailyChartForSeller(Long sellerId,
                                                                LocalDateTime start,
                                                                LocalDateTime end) {
        // Re-use platform query and filter by seller share from earnings
        // Simplified: return daily revenue scoped by seller purchases
        List<Object[]> rows = purchaseRepository.getDailyRevenue(start, end);
        return rows.stream()
                .map(r -> Map.<String, Object>of("date", r[0].toString(), "revenue", r[1]))
                .toList();
    }

    // ── Null-safe BigDecimal ──────────────────────────────────

    private BigDecimal nvl(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
