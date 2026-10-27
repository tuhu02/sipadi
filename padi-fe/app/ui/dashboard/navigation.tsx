"use client";

import { LogOut, Sprout } from "lucide-react";
import { User } from "@/app/lib/auth";
import NotificationInbox from "@/app/ui/notification-inbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Brand, Icon, StatusPill } from "./shared";
import { DashboardNavigationItem, DashboardSection } from "./types";

type NavigationProps = {
  items: DashboardNavigationItem[];
  section: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
};

function NavigationButton({
  item,
  active,
  onClick,
  mobile = false,
}: {
  item: DashboardNavigationItem;
  active: boolean;
  onClick: () => void;
  mobile?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        mobile
          ? cn(
              "inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          : cn(
              "flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-sm font-semibold transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )
      }
    >
      <Icon
        name={item.icon}
        className={cn(
          mobile ? "size-4" : "size-[18px]",
          active ? "text-primary-foreground" : "text-muted-foreground"
        )}
      />
      <span>{item.label}</span>
    </button>
  );
}

export function DashboardSidebar({
  items,
  section,
  onSectionChange,
}: NavigationProps) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card px-5 py-6 lg:flex">
      <Brand />
      <div className="mt-8">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
          Menu Utama
        </p>
        <nav aria-label="Navigasi utama" className="mt-3 flex flex-col gap-1.5">
          {items.map((item) => (
            <NavigationButton
              key={item.id}
              item={item}
              active={section === item.id}
              onClick={() => onSectionChange(item.id)}
            />
          ))}
        </nav>
      </div>

      <div className="mt-auto rounded-2xl border border-border/80 bg-muted/40 p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-secondary text-primary">
            <Sprout className="size-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">SiPadi PWA</p>
            <p className="text-[10px] text-muted-foreground">Versi 0.1.0</p>
          </div>
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
          Pencatatan lapangan yang tangguh, siap mendukung alur kerja offline.
        </p>
      </div>
    </aside>
  );
}

export function DashboardHeader({
  sectionTitle,
  online,
  user,
  token,
  isLoggingOut,
  onLogout,
  onNewNotification,
}: {
  sectionTitle: string | undefined;
  online: boolean;
  user: User;
  token: string;
  isLoggingOut: boolean;
  onLogout: () => void;
  onNewNotification: () => Promise<void>;
}) {
  return (
    <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-4 border-b border-border bg-card/90 px-4 backdrop-blur-md sm:px-7 lg:px-9">
      <div className="lg:hidden">
        <Brand />
      </div>
      <div className="hidden lg:block">
        <p className="text-sm font-bold text-foreground">{sectionTitle}</p>
        <p className="text-xs text-muted-foreground">
          Sistem Informasi Pencatatan Padi
        </p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <StatusPill online={online} />

        {user.role === "ppl" && (
          <NotificationInbox
            token={token}
            userId={user.id}
            onNewNotification={onNewNotification}
          />
        )}

        <div className="hidden h-7 w-px bg-border sm:block" />

        <div className="hidden text-right sm:block">
          <p className="max-w-44 truncate text-sm font-semibold text-foreground">
            {user.nama}
          </p>
          <p className="text-[11px] font-medium text-muted-foreground">
            {user.role === "ppl" ? "Penyuluh Lapangan" : "Administrator"}
          </p>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={onLogout}
          disabled={isLoggingOut}
          title="Keluar dari akun"
          className="rounded-xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
        >
          <LogOut className="size-4" />
          <span className="sr-only">Keluar</span>
        </Button>
      </div>
    </header>
  );
}

export function MobileNavigation({
  items,
  section,
  onSectionChange,
}: NavigationProps) {
  return (
    <nav
      aria-label="Navigasi mobile"
      className="flex gap-2 overflow-x-auto border-b border-border bg-card px-4 py-2.5 lg:hidden scrollbar-none"
    >
      {items.map((item) => (
        <NavigationButton
          key={item.id}
          item={item}
          active={section === item.id}
          onClick={() => onSectionChange(item.id)}
          mobile
        />
      ))}
    </nav>
  );
}
