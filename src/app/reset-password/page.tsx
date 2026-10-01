"use client";

import React, { Suspense } from "react";

import ResetPasswordForm from "./ResetPasswordForm";

const ResetPasswordPage = (): React.JSX.Element => {
  return (
    <Suspense
      fallback={
        <div className="auth-shell">
          <div className="auth-card">
            <p className="text-center">Loading…</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;
