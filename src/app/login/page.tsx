"use client";

import React, { Suspense } from "react";

import LoginForm from "./LoginForm";

const LoginPage = (): React.JSX.Element => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
          <div className="card w-full max-w-lg">
            <div className="card-body p-8 text-center">Loading…</div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;
