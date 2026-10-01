import React from "react";
import { cookies } from "next/headers";
import { CookiesProvider } from "next-client-cookies/server";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

import "../styles/index.css";
import LoginRegisterLinks from "./components/LoginRegisterLinks";
import ThemeToggle from "./components/ThemeToggle";
import BootstrapClient from "./components/BootstrapClient";

interface Props {
  children: React.ReactNode;
}

const themeBootScript = `
(function(){
  try {
    var t = localStorage.getItem('inspect-theme') || 'light';
    var legacy = {
      hc:'contrast', electric:'frost', forest:'tank',
      'theme-blue':'light','theme-green':'tank','theme-purple':'frost',
      'theme-orange':'paper','theme-red':'brutal','theme-teal':'tank','theme-dark':'dark'
    };
    if (legacy[t]) t = legacy[t];
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

const Dashboard = async ({ children }: Props): Promise<React.JSX.Element> => {
  const tokenCookie = (await cookies()).get("token");
  const loggedIn = !!tokenCookie;

  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <Script id="inspect-theme-boot" strategy="beforeInteractive">
          {themeBootScript}
        </Script>
      </head>
      <body>
        <BootstrapClient />
        <header className="inspect-header">
          <div className="inspect-header__inner">
            <Link href={loggedIn ? "/insights" : "/"} className="inspect-brand">
              <span className="inspect-brand__mark">
                <Image
                  src="/images/icon.png"
                  width={16}
                  height={16}
                  alt=""
                />
              </span>
              <span className="inspect-brand__text">Inspect</span>
            </Link>

            <nav className="inspect-nav" aria-label="Primary">
              {loggedIn && (
                <Link href="/insights" className="inspect-nav__link">
                  Insights
                </Link>
              )}
              {!loggedIn && (
                <>
                  <Link href="/login" className="inspect-nav__link inspect-nav__link--desktop">
                    Login
                  </Link>
                  <Link href="/register" className="inspect-nav__link inspect-nav__link--desktop">
                    Register
                  </Link>
                </>
              )}
            </nav>

            <div className="inspect-header__actions">
              <ThemeToggle />
              <LoginRegisterLinks loggedIn={loggedIn} />
              <Link
                href="http://datagotchi.net"
                target="_blank"
                className="inspect-brand__mark inspect-brand__mark--quiet"
                title="Datagotchi Labs"
              >
                <Image
                  src="/images/Color1.png"
                  width={16}
                  height={16}
                  alt="Datagotchi"
                />
              </Link>
            </div>
          </div>
        </header>

        <main className="inspect-main">
          <CookiesProvider>{children}</CookiesProvider>
        </main>
      </body>
    </html>
  );
};

export default Dashboard;
