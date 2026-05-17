import { httpClient } from "../../../api/httpClient";
import type { Notification } from "../models/notificationTypes";

export function getNotifications(): Promise<Notification[]> {
    return httpClient<Notification[]>("/notifications");
}

export function getUnreadNotifications(): Promise<Notification[]> {
    return httpClient<Notification[]>("/notifications/unread");
}

export function markNotificationAsRead(notificationId: number): Promise<Notification> {
    return httpClient<Notification>(`/notifications/${notificationId}/read`, {
        method: "POST",
    });
}
