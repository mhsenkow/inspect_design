"use client";

import React, { Suspense } from "react";

import RegisterForm from "./RegisterForm";

const RegisterPage = (): React.JSX.Element => {
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
      <RegisterForm />
    </Suspense>
  );
};

export default RegisterPage;
