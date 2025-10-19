import React from "react";
import Script from "next/script";
import { cookies } from "next/headers";
import { CookiesProvider } from "next-client-cookies/server";

import "bootstrap/dist/css/bootstrap.css";

import "../styles/index.css";
import Sidebar from "./components/Sidebar";

interface Props {
  children: React.ReactNode;
}

const Dashboard = async ({ children }: Props): Promise<React.JSX.Element> => {
  const tokenCookie = (await cookies()).get("token");
  const loggedIn = !!tokenCookie;

  return (
    <html>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔍</text></svg>"
        />
        <Script src="/bootstrap.bundle.js" />
      </head>
      <body className="min-h-screen">
        {/* Sidebar */}
        <Sidebar loggedIn={loggedIn} />

        {/* Main Content */}
        <main className="ml-20 flex-1 min-h-screen">
          <CookiesProvider>{children}</CookiesProvider>
        </main>
      </body>
    </html>
  );
};

export default Dashboard;
