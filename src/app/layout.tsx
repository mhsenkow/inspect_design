import React from "react";
import Script from "next/script";
import { cookies } from "next/headers";
import { CookiesProvider } from "next-client-cookies/server";
import Image from "next/image";
import Link from "next/link";

import "bootstrap/dist/css/bootstrap.css";

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
        <div style={{ borderBottom: "1px solid #ccc", padding: "10px" }}>
          <nav
            className="navbar navbar-expand-lg bg-body-tertiary"
            style={{ float: "left" }}
          >
            <ul className="navbar-nav me-auto mb-lg-0">
              <LoginRegisterLinks loggedIn={loggedIn} />
            </ul>
          </nav>
          <h1 style={{ textAlign: "center" }}>
            Inspect
            <Image
              src="/images/icon.png"
              width="50"
              height="50"
              alt="Inspect Logo"
            />
          </h1>
          <div style={{ float: "right", marginTop: "-70px" }}>
            <Link href="http://datagotchi.net" target="_blank">
              <Image
                src="/images/Color1.png"
                width="80"
                height="80"
                alt="Datagotchi Logo"
              />
            </Link>
          </div>
        </div>
        <CookiesProvider>{children}</CookiesProvider>
      </body>
    </html>
  );
};

export default Dashboard;
