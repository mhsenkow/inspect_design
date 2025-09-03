import React from "react";
import Script from "next/script";
import { cookies } from "next/headers";
import { CookiesProvider } from "next-client-cookies/server";
import Image from "next/image";
import Link from "next/link";

import "bootstrap/dist/css/bootstrap.css";

import "./design-system.css";
import "./themes.css";
import "./style.css";
import LoginRegisterLinks from "./components/LoginRegisterLinks";
// import { getUserFromServer } from "./api/functions";

interface Props {
  children: React.ReactNode;
}

const Dashboard = async ({ children }: Props): Promise<React.JSX.Element> => {
  const tokenCookie = (await cookies()).get("token");
  const loggedIn = !!tokenCookie;
  // const authUser = await getAuthUser(headers);
  // const origin = (await headers()).get("x-origin");
  // const user = authUser
  //   ? await getUserFromServer(
  //       origin,
  //       { id: authUser.user_id },
  //       tokenCookie?.value,
  //     )
  //   : null;

  return (
    <html>
      <head>
        <Script src="/bootstrap.bundle.js" />
      </head>
      <body>
        <div className="bg-primary border-b border-secondary shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-6">
                <LoginRegisterLinks loggedIn={loggedIn} />
              </div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-primary flex items-center">
                  Inspect
                  <Image
                    src="/images/icon.png"
                    width="28"
                    height="28"
                    alt="Inspect Logo"
                    className="ml-2"
                  />
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="http://datagotchi.net" target="_blank" className="flex items-center">
                  <Image
                    src="/images/Color1.png"
                    width="32"
                    height="32"
                    alt="Datagotchi Logo"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
        <CookiesProvider>{children}</CookiesProvider>
      </body>
    </html>
  );
};

export default Dashboard;
