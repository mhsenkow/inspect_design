"use client";

import React, { Suspense } from "react";

import LoginForm from "./LoginForm";

const AuthFallback = (): React.JSX.Element => (
  <div className="auth-shell">
    <div className="auth-card auth-card--quiet">
      <p className="auth-lead">Loading…</p>
    </div>
  </div>
);

const LoginPage = (): React.JSX.Element => {
  return (
    <Suspense fallback={<AuthFallback />}>
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;
