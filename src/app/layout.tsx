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
        <div className="bg-base-500 border-b border-base-600 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-6">
                <LoginRegisterLinks loggedIn={loggedIn} />
              </div>
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-inverse flex items-center tracking-tight">
                  Inspect
                  <div className="ml-4 w-10 h-10 bg-inverse rounded-xl flex items-center justify-center shadow-sm border border-base-400">
                    <Image
                      src="/images/icon.png"
                      width="22"
                      height="22"
                      alt="Inspect Logo"
                      className="opacity-80"
                    />
                  </div>
                </h1>
              </div>
              <div className="flex items-center space-x-6">
                <Link href="http://datagotchi.net" target="_blank" className="flex items-center p-3 bg-base-600 rounded-xl hover:bg-base-700 transition-all duration-200 shadow-sm hover:shadow-md">
                  <Image
                    src="/images/Color1.png"
                    width="24"
                    height="24"
                    alt="Datagotchi Logo"
                    className="opacity-85"
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
