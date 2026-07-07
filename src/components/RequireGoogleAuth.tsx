import { type ReactNode } from "react";
import { Navigate, useLocation } from "@tanstack/react-router";
import { PageLoader } from "@/components/PageLoader";
import { isGoogleUser } from "@/lib/auth";
import { db } from "@/lib/db";

type RequireGoogleAuthProps = {
  children: ReactNode;
};

export function RequireGoogleAuth({ children }: RequireGoogleAuthProps) {
  const { isLoading, user } = db.useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user || !isGoogleUser(user)) {
    return (
      <Navigate
        to="/login"
        search={{ redirect: location.pathname }}
        replace
      />
    );
  }

  return <>{children}</>;
}
