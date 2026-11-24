"use client";

import { useState } from "react";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { User } from "@/app/lib/auth";
import { AdminResource } from "@/app/lib/admin";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Brand, Icon } from "./shared";
import {
  adminNavigationItems,
  DashboardNavigationItem,
  DashboardSection,
} from "./types";

type NavigationProps = {
  items: DashboardNavigationItem[];
  section: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  adminResource: AdminResource;
  onAdminResourceChange: (resource: AdminResource) => void;
};

type SidebarProps = NavigationProps & {
  user: User;
  isLoggingOut: boolean;
  onLogout: () => void;
  onOpenNotifications: () => void;
};

function AccountMenu({
  user,
  isLoggingOut,
  onLogout,
  onOpenNotifications,
  placement,
}: {
  user: User;
  isLoggingOut: boolean;
  onLogout: () => void;
  onOpenNotifications: () => void;
  placement: "sidebar" | "header";
}) {
  const isSidebar = placement === "sidebar";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={
            isSidebar
              ? "h-auto w-full justify-between px-3 py-2 text-left"
              : "h-auto max-w-48 justify-start gap-2 px-2 py-1.5 sm:max-w-56"
          }
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">
              {user.nama}
            </span>
            <span className="block text-left text-[11px] font-medium text-muted-foreground">
              {user.role === "ppl" ? "Penyuluh Lapangan" : "Administrator"}
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={isSidebar ? "top" : "bottom"}
        align={isSidebar ? "start" : "end"}
        className="w-56"
      >
        {user.role === "ppl" && (
          <DropdownMenuItem onSelect={onOpenNotifications}>
            <Bell className="size-4" />
            Notifikasi
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          disabled={isLoggingOut}
          onSelect={onLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavigationButton({
  item,
  active,
  onClick,
  mobile = false,
  expandable = false,
  expanded = false,
}: {
  item: DashboardNavigationItem;
  active: boolean;
  onClick: () => void;
  mobile?: boolean;
  expandable?: boolean;
  expanded?: boolean;
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
      {expandable && (
        <ChevronDown
          className={cn(
            "ml-auto size-4 transition-transform",
            expanded && "rotate-180",
            active ? "text-primary-foreground" : "text-muted-foreground",
          )}
        />
      )}
    </button>
  );
}

function AdminResourceLinks({
  section,
  resource,
  onResourceChange,
  mobile = false,
}: {
  section: DashboardSection;
  resource: AdminResource;
  onResourceChange: (resource: AdminResource) => void;
  mobile?: boolean;
}) {
  return (
    <div
      className={
        mobile
          ? "flex gap-2 overflow-x-auto py-2 pl-3"
          : "ml-5 mt-1 flex flex-col gap-1 border-l border-border pl-3"
      }
    >
      {adminNavigationItems.map((item) => {
        const active = section === "admin" && resource === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onResourceChange(item.id)}
            className={cn(
              "shrink-0 rounded-lg text-left text-sm transition-colors",
              mobile ? "px-3 py-2" : "px-3 py-2",
              active
                ? "bg-secondary font-semibold text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function DashboardSidebar({
  items,
  section,
  onSectionChange,
  user,
  isLoggingOut,
  onLogout,
  onOpenNotifications,
  adminResource,
  onAdminResourceChange,
}: SidebarProps) {
  const [isAdminExpanded, setIsAdminExpanded] = useState(section === "admin");

  return (
    <aside className="hide-scrollbar sticky top-0 hidden h-screen w-64 shrink-0 self-start flex-col overflow-y-auto border-r border-border bg-card px-5 py-6 lg:flex">
      <Brand />
      <div className="mt-8">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
          Menu Utama
        </p>
        <nav aria-label="Navigasi utama" className="mt-3 flex flex-col gap-1.5">
          {items.map((item) =>
            item.id === "admin" ? (
              <div key={item.id}>
                <NavigationButton
                  item={item}
                  active={section === item.id}
                  expandable
                  expanded={isAdminExpanded}
                  onClick={() => {
                    if (section !== "admin") {
                      onSectionChange("admin");
                      setIsAdminExpanded(true);
                    } else {
                      setIsAdminExpanded((expanded) => !expanded);
                    }
                  }}
                />
                {isAdminExpanded && (
                  <AdminResourceLinks
                    section={section}
                    resource={adminResource}
                    onResourceChange={onAdminResourceChange}
                  />
                )}
              </div>
            ) : (
              <NavigationButton
                key={item.id}
                item={item}
                active={section === item.id}
                onClick={() => onSectionChange(item.id)}
              />
            ),
          )}
        </nav>
      </div>
      <div className="mt-auto border-t border-border pt-5">
        <AccountMenu
          user={user}
          isLoggingOut={isLoggingOut}
          onLogout={onLogout}
          onOpenNotifications={onOpenNotifications}
          placement="sidebar"
        />
      </div>
    </aside>
  );
}

export function MobileNavigation({
  items,
  section,
  onSectionChange,
  user,
  isLoggingOut,
  onLogout,
  onOpenNotifications,
  adminResource,
  onAdminResourceChange,
}: SidebarProps) {
  const [isAdminExpanded, setIsAdminExpanded] = useState(section === "admin");

  return (
    <div className="border-b border-border bg-card px-4 py-2.5 lg:hidden">
      <nav
        aria-label="Navigasi mobile"
        className="flex items-center gap-2 overflow-x-auto scrollbar-none"
      >
        <Brand />
        {items.map((item) =>
          item.id === "admin" ? (
            <NavigationButton
              key={item.id}
              item={item}
              active={section === item.id}
              mobile
              expandable
              expanded={isAdminExpanded}
              onClick={() => {
                if (section !== "admin") {
                  onSectionChange("admin");
                  setIsAdminExpanded(true);
                } else {
                  setIsAdminExpanded((expanded) => !expanded);
                }
              }}
            />
          ) : (
            <NavigationButton
              key={item.id}
              item={item}
              active={section === item.id}
              onClick={() => onSectionChange(item.id)}
              mobile
            />
          ),
        )}
        <div className="ml-auto shrink-0 border-l border-border pl-2">
          <AccountMenu
            user={user}
            isLoggingOut={isLoggingOut}
            onLogout={onLogout}
            onOpenNotifications={onOpenNotifications}
            placement="header"
          />
        </div>
      </nav>
      {isAdminExpanded && section === "admin" && (
        <AdminResourceLinks
          section={section}
          resource={adminResource}
          onResourceChange={onAdminResourceChange}
          mobile
        />
      )}
    </div>
  );
}
