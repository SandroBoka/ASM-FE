import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Alert } from "../../../components/ui/Alert";
import { useAuth } from "../../auth/hooks/useAuth";
import {
    useMarkNotificationAsRead,
    useNotifications,
} from "../hooks/useNotifications";
import type { Notification } from "../models/notificationTypes";

function formatDateTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("hr-HR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) {
        return error.message;
    }
    return fallback;
}

export function NotificationsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isCustomer = user?.TipKorisnika === "customer";
    const notificationsQuery = useNotifications(isCustomer);
    const markAsReadMutation = useMarkNotificationAsRead();

    if (!user) {
        return null;
    }

    if (!isCustomer) {
        return (
            <section className="page">
                <h1>{t("notifications.title")}</h1>
                <Alert variant="info">{t("notifications.customerOnly")}</Alert>
            </section>
        );
    }

    const notifications = notificationsQuery.data ?? [];
    const sortedNotifications = [...notifications].sort((a, b) =>
        b.DatumSlanja.localeCompare(a.DatumSlanja),
    );

    function handleClick(notification: Notification) {
        if (!notification.Procitana) {
            markAsReadMutation.mutate(notification.IdObavijesti);
        }
    }

    return (
        <section className="page">
            <header className="page__header">
                <h1>{t("notifications.title")}</h1>
            </header>

            <section className="page__section">
                {notificationsQuery.isLoading ? <p>{t("common.loading")}</p> : null}

                {notificationsQuery.isError ? (
                    <Alert variant="error">
                        {getErrorMessage(
                            notificationsQuery.error,
                            t("common.unknownError"),
                        )}
                    </Alert>
                ) : null}

                {sortedNotifications.length === 0 && !notificationsQuery.isLoading ? (
                    <Alert variant="info">{t("notifications.empty")}</Alert>
                ) : null}

                {sortedNotifications.length > 0 ? (
                    <ul className="notification-list">
                        {sortedNotifications.map((notification) => (
                            <li
                                key={notification.IdObavijesti}
                                className={`notification-list__item ${
                                    notification.Procitana
                                        ? ""
                                        : "notification-list__item--unread"
                                }`}
                                onClick={() => handleClick(notification)}
                            >
                                <div className="notification-list__head">
                                    <strong>{notification.Naslov}</strong>
                                    <span className="notification-list__date">
                                        {formatDateTime(notification.DatumSlanja)}
                                    </span>
                                </div>
                                <p>{notification.Tekst}</p>
                                <Link
                                    to={`/reservations/${notification.IdRezervacije}`}
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    {t("notifications.viewReservation")}
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </section>
        </section>
    );
}
