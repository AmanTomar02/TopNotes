package com.topnotes.service;

import com.topnotes.dto.response.NotificationResponse;
import com.topnotes.entity.User;
import com.topnotes.entity.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** In-app notification delivery and management. */
public interface NotificationService {
    void createNotification(User user, String title, String message, NotificationType type);
    Page<NotificationResponse> getUserNotifications(Long userId, Pageable pageable);
    long getUnreadCount(Long userId);
    void markAllRead(Long userId);
}
