"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { apiBaseUrl } from "@/app/lib/api";

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

export type MasterDataBroadcast = AppNotificationBroadcast;

type AppNotificationBroadcast = {
  id: string;
  type: string;
  event: "master_data_added";
  title: string;
  message: string;
  resource_type: "desa" | "lahan";
  resource_id: string;
  kecamatan_id: string;
  desa_id: string | null;
  nama: string;
};

export function subscribeToNotifications(
  token: string,
  userId: string,
  onNotification: (notification: MasterDataBroadcast) => void,
): () => void {
  const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;

  if (!key) {
    throw new Error("NEXT_PUBLIC_REVERB_APP_KEY belum dikonfigurasi.");
  }

  const host = process.env.NEXT_PUBLIC_REVERB_HOST ?? "127.0.0.1";
  const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080);
  const scheme = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http";
  const forceTLS = scheme === "https";

  window.Pusher = Pusher;

  const echo = new Echo({
    broadcaster: "reverb",
    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS,
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${apiBaseUrl}/broadcasting/auth`,
    auth: {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const channel = echo.private(`App.Models.User.${userId}`);
  channel.notification((notification: MasterDataBroadcast) => {
    if (notification.event === "master_data_added") {
      onNotification(notification);
    }
  });

  channel.error((error: unknown) => {
    console.error("Gagal berlangganan notifikasi real-time.", error);
  });

  return () => {
    echo.leave(`App.Models.User.${userId}`);
    echo.disconnect();
  };
}
