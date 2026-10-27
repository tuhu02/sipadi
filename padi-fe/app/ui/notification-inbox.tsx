"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import {
  AppNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/lib/auth";
import {
  MasterDataBroadcast,
  subscribeToNotifications,
} from "@/app/lib/realtime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type NotificationInboxProps = {
  token: string;
  userId: string;
  onNewNotification: () => Promise<void>;
};

function formatNotificationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Waktu tidak tersedia";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function toAppNotification(
  notification: MasterDataBroadcast
): AppNotification {
  return {
    id: notification.id,
    type: notification.type,
    data: {
      event: notification.event,
      title: notification.title,
      message: notification.message,
      resource_type: notification.resource_type,
      resource_id: notification.resource_id,
      kecamatan_id: notification.kecamatan_id,
      desa_id: notification.desa_id,
      nama: notification.nama,
    },
    read_at: null,
    created_at: new Date().toISOString(),
  };
}

export default function NotificationInbox({
  token,
  userId,
  onNewNotification,
}: NotificationInboxProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const notificationsRef = useRef<AppNotification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    const response = await getNotifications(token);
    notificationsRef.current = response.data;
    setNotifications(response.data);
    setUnreadCount(response.unread_count);
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    void getNotifications(token)
      .then((response) => {
        if (!isMounted) return;
        notificationsRef.current = response.data;
        setNotifications(response.data);
        setUnreadCount(response.unread_count);
      })
      .catch((error: unknown) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Inbox notifikasi belum dapat dimuat."
        );
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = subscribeToNotifications(token, userId, (payload) => {
        const notification = toAppNotification(payload);
        const alreadyExists = notificationsRef.current.some(
          (item) => item.id === notification.id
        );

        if (!alreadyExists) {
          const nextNotifications = [
            notification,
            ...notificationsRef.current,
          ].slice(0, 20);
          notificationsRef.current = nextNotifications;
          setNotifications(nextNotifications);
          setUnreadCount((count) => count + 1);
        }

        toast.success(notification.data.title, {
          description: notification.data.message,
          action: {
            label: "Buka inbox",
            onClick: () => setIsOpen(true),
          },
        });
        void onNewNotification();
      });
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Koneksi notifikasi real-time gagal dibuat."
      );
    }

    return () => {
      unsubscribe?.();
    };
  }, [onNewNotification, token, userId]);

  async function handleMarkRead(notification: AppNotification) {
    if (notification.read_at) return;

    try {
      const response = await markNotificationRead(token, notification.id);
      const updatedNotification = response.data;
      const nextNotifications = notificationsRef.current.map((item) =>
        item.id === notification.id ? updatedNotification : item
      );

      notificationsRef.current = nextNotifications;
      setNotifications(nextNotifications);
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Notifikasi belum dapat ditandai dibaca."
      );
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead(token);
      const readAt = new Date().toISOString();
      const nextNotifications = notificationsRef.current.map((item) => ({
        ...item,
        read_at: item.read_at ?? readAt,
      }));

      notificationsRef.current = nextNotifications;
      setNotifications(nextNotifications);
      setUnreadCount(0);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Notifikasi belum dapat ditandai dibaca."
      );
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          setIsOpen((open) => !open);
          if (!isOpen) {
            void loadNotifications().catch((error: unknown) => {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Inbox notifikasi belum dapat dimuat."
              );
            });
          }
        }}
        aria-label={`Buka inbox notifikasi${unreadCount ? `, ${unreadCount} belum dibaca` : ""}`}
        aria-expanded={isOpen}
        className="relative rounded-xl"
      >
        <Bell className="size-4 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-in zoom-in-50">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <section
          aria-label="Inbox notifikasi"
          className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-0 zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">
                  Pemberitahuan
                </h2>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                    {unreadCount} baru
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Data master dan pembaruan sistem
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleMarkAllRead()}
                className="h-8 gap-1 px-2 text-xs font-semibold text-primary"
              >
                <CheckCheck className="size-3.5" />
                <span>Baca semua</span>
              </Button>
            )}
          </header>

          <div className="max-h-[min(65vh,28rem)] overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <Inbox className="size-8 mx-auto text-muted-foreground/60" />
                <p className="text-xs font-medium">Belum ada notifikasi baru.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void handleMarkRead(notification)}
                  className={`block w-full p-4 text-left transition-colors hover:bg-muted/50 ${
                    notification.read_at
                      ? "bg-card text-muted-foreground"
                      : "bg-secondary/40 text-foreground"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {!notification.read_at && (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs font-bold text-foreground">
                        {notification.data.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {notification.data.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 pt-1">
                        {formatNotificationDate(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
