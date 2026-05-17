import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as notificationsApi from "../api/notificationsApi";
import type { Notification } from "../models/notificationTypes";

const NOTIFICATIONS_QUERY_KEY = "notifications";

export function useNotifications(enabled = true) {
    return useQuery<Notification[]>({
        queryKey: [NOTIFICATIONS_QUERY_KEY, "all"],
        queryFn: () => notificationsApi.getNotifications(),
        enabled,
    });
}

export function useUnreadNotifications(enabled = true) {
    return useQuery<Notification[]>({
        queryKey: [NOTIFICATIONS_QUERY_KEY, "unread"],
        queryFn: () => notificationsApi.getUnreadNotifications(),
        enabled,
        refetchInterval: 10_000,
    });
}

export function useMarkNotificationAsRead() {
    const queryClient = useQueryClient();
    return useMutation<Notification, Error, number>({
        mutationFn: (notificationId) => notificationsApi.markNotificationAsRead(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
        },
    });
}
