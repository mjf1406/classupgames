import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { Gamepad2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { joinSearchDefaults } from "@/lib/routes";
import { db } from "@/lib/db";

const googleClientId = import.meta.env.VITE_GOOGLE_ID;
const googleClientName = import.meta.env.VITE_GOOGLE_CLIENT_NAME;

type LoginPageProps = {
  redirect?: string;
};

export function LoginPage({ redirect = "/" }: LoginPageProps) {
  const navigate = useNavigate();
  const [nonce] = useState(() => crypto.randomUUID());
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const missingConfig = !googleClientId || !googleClientName;

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-10">
      <Card className="w-full">
        <CardHeader className="text-center">
          <Gamepad2 className="mx-auto mb-2 size-10 text-primary" />
          <CardTitle className="text-2xl">Squad Games</CardTitle>
          <CardDescription>
            Sign in to host games, or join a squad with a code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {missingConfig ? (
            <p className="text-center text-sm text-destructive">
              Missing VITE_GOOGLE_ID or VITE_GOOGLE_CLIENT_NAME in .env
            </p>
          ) : (
            <div className="space-y-3">
              {error ? (
                <p className="text-center text-sm text-destructive">{error}</p>
              ) : null}
              <div className="flex justify-center">
                <GoogleOAuthProvider clientId={googleClientId}>
                  <GoogleLogin
                    nonce={nonce}
                    onError={() =>
                      setError("Google sign-in failed. Please try again.")
                    }
                    onSuccess={({ credential }) => {
                      if (!credential) {
                        setError("Google sign-in failed. Please try again.");
                        return;
                      }

                      setError(null);
                      setIsSigningIn(true);

                      db.auth
                        .signInWithIdToken({
                          clientName: googleClientName,
                          idToken: credential,
                          nonce,
                        })
                        .then(() => {
                          void navigate({ href: redirect });
                        })
                        .catch(() => {
                          setError("Sign-in failed. Please try again.");
                        })
                        .finally(() => {
                          setIsSigningIn(false);
                        });
                    }}
                  />
                </GoogleOAuthProvider>
              </div>
              {isSigningIn ? (
                <p className="text-center text-xs text-muted-foreground">
                  Signing in...
                </p>
              ) : null}
            </div>
          )}

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              or
            </span>
          </div>

          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to="/join" search={joinSearchDefaults}>
              <LogIn className="size-4" />
              Join a game
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
