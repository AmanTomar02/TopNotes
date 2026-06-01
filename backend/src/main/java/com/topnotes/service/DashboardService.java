package com.topnotes.service;

import com.topnotes.dto.response.DashboardResponse;
import com.topnotes.dto.response.SellerDashboardResponse;

/** Analytics aggregation for admin and seller dashboards. */
public interface DashboardService {
    DashboardResponse       getAdminDashboard();
    SellerDashboardResponse getSellerDashboard(Long sellerId);
}
