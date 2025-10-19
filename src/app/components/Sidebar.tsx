"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import sidebarStyles from "../../styles/components/sidebar.module.css";

import useUser from "../hooks/useUser";
import ThemeSwitcher from "./ThemeSwitcher";

const Sidebar = ({ loggedIn }: { loggedIn: boolean }): React.JSX.Element => {
  const [origin, setOrigin] = useState<string>();
  const [returnPath, setReturnPath] = useState<string>();
  const pathname = usePathname();

  useEffect(() => {
    setOrigin(window.location.origin);
    setReturnPath(window.location.pathname);
  }, []);

  const { logout, user_id, username } = useUser();

  const navigationItems = [
    {
      name: "Insights",
      href: "/insights",
      icon: "📊",
      active: pathname === "/insights" || pathname.startsWith("/insights/"),
      enabled: true,
    },
    {
      name: "Comments",
      href: "/comments",
      icon: "💬",
      active: pathname === "/comments",
      enabled: false,
    },
    {
      name: "Collections",
      href: "/collections",
      icon: "📁",
      active: pathname === "/collections",
      enabled: false,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: "📈",
      active: pathname === "/analytics",
      enabled: false,
    },
  ];

  return (
    <aside className={sidebarStyles.sidebar}>
      {/* Logo Section */}
      <div className={sidebarStyles.logoSection}>
        <Link
          href="/"
          className={sidebarStyles.logoLink}
          onClick={() => open(origin, "_self")}
        >
          <div className={sidebarStyles.logoIcon}>
            <span style={{ fontSize: "20px" }}>🔍</span>
          </div>
          <span className={sidebarStyles.logoText}>INSPECT</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className={sidebarStyles.navigation}>
        {navigationItems.map((item) => (
          <div
            key={item.name}
            className={`${sidebarStyles.navItem} ${item.active ? sidebarStyles.navItemActive : ""} ${!item.enabled ? sidebarStyles.navItemDisabled : ""}`}
            title={item.name}
          >
            {item.enabled ? (
              <Link href={item.href} className={sidebarStyles.navLink}>
                <span className={sidebarStyles.navIcon}>{item.icon}</span>
              </Link>
            ) : (
              <span className={sidebarStyles.navIcon}>{item.icon}</span>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className={sidebarStyles.bottomSection}>
        {/* Theme Switcher */}
        <div className={sidebarStyles.themeSwitcher}>
          <ThemeSwitcher />
        </div>

        {/* User Section */}
        <div className={sidebarStyles.userSection}>
          {loggedIn ? (
            <div className={sidebarStyles.userMenu}>
              <div className={sidebarStyles.userAvatar}>
                {user_id ? (
                  <span className={sidebarStyles.avatarInitials}>
                    {username?.charAt(0).toUpperCase() || "U"}
                  </span>
                ) : (
                  <span className={sidebarStyles.avatarInitials}>U</span>
                )}
              </div>
              <div className={sidebarStyles.userActions}>
                <button
                  onClick={() => {
                    logout();
                    window.location.href = returnPath || "/";
                  }}
                  className={sidebarStyles.userAction}
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className={sidebarStyles.authButtons}>
              <Link
                href={`/login?return=${returnPath}`}
                className={`${sidebarStyles.authButton} ${pathname === "/login" ? sidebarStyles.authButtonActive : ""}`}
              >
                Login
              </Link>
              <Link
                href={`/register?return=${returnPath}`}
                className={`${sidebarStyles.authButton} ${pathname === "/register" ? sidebarStyles.authButtonActive : ""}`}
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Datagotchi Link */}
        <div className={sidebarStyles.brandSection}>
          <Link
            href="https://datagotchi.net"
            target="_blank"
            rel="noreferrer"
            className={sidebarStyles.brandLink}
            title="Datagotchi Labs"
          >
            <Image
              src="/images/Color1.png"
              width="24"
              height="24"
              alt="Datagotchi Labs logo"
            />
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
