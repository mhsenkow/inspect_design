"use client";

import React, { Suspense } from "react";

import RegisterForm from "./RegisterForm";

const AuthFallback = (): React.JSX.Element => (
  <div className="auth-shell">
    <div className="auth-card auth-card--quiet">
      <p className="auth-lead">Loading…</p>
    </div>
  </div>
);

const RegisterPage = (): React.JSX.Element => {
  return (
    <Suspense fallback={<AuthFallback />}>
      <RegisterForm />
    </Suspense>
  );
};

export default RegisterPage;
