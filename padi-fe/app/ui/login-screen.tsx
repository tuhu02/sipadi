"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Info, Loader2, Sprout } from "lucide-react";
import { ApiError } from "@/app/lib/api";
import {
  clearToken,
  getCurrentUser,
  login,
  logout,
  readToken,
  saveToken,
  User,
} from "@/app/lib/auth";
import Dashboard from "@/app/ui/dashboard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthState =
  | { status: "checking" }
  | { status: "guest"; notice?: string }
  | { status: "authenticated"; user: User; token: string };

function BrandLogo() {
  return (
    <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary shadow-xs">
      <Sprout className="size-6 text-primary" />
    </div>
  );
}

export default function LoginScreen() {
  const [auth, setAuth] = useState<AuthState>({ status: "checking" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const token = readToken();
      if (!token) return null;

      return { token, user: await getCurrentUser(token) };
    }

    restoreSession()
      .then((session) => {
        if (!isMounted) return;
        setAuth(
          session
            ? { status: "authenticated", ...session }
            : { status: "guest" }
        );
      })
      .catch((requestError: unknown) => {
        const isUnauthorized =
          requestError instanceof ApiError && requestError.status === 401;
        if (isUnauthorized) {
          clearToken();
        }

        if (isMounted) {
          const notice = isUnauthorized
            ? undefined
            : requestError instanceof Error
              ? requestError.message
              : "Sesi tidak dapat diperiksa.";
          setAuth(notice ? { status: "guest", notice } : { status: "guest" });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await login(email.trim(), password);
      saveToken(result.token);
      setAuth({
        status: "authenticated",
        user: result.user,
        token: result.token,
      });
      setPassword("");
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Login gagal. Silakan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    if (auth.status !== "authenticated") return;

    setError("");
    setIsSubmitting(true);

    try {
      await logout(auth.token);
      clearToken();
      setAuth({ status: "guest" });
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Logout gagal. Silakan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (auth.status === "authenticated") {
    return (
      <Dashboard
        user={auth.user}
        token={auth.token}
        error={error}
        isLoggingOut={isSubmitting}
        onLogout={handleLogout}
      />
    );
  }

  if (auth.status === "checking") {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-sm font-medium text-muted-foreground"
        role="status"
      >
        <Loader2 className="size-6 animate-spin text-primary" />
        <p>Memeriksa sesi...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_#e8f0e2_0%,_transparent_45%),linear-gradient(145deg,_var(--color-background)_0%,_#eef4ec_100%)]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-12">
        <section className="mx-auto w-full max-w-xl">
          <div className="flex items-center gap-3.5">
            <BrandLogo />
            <div>
              <p className="text-xl font-bold tracking-tight text-foreground">
                SiPadi
              </p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sistem Informasi Padi
              </p>
            </div>
          </div>

          <h1 className="mt-8 max-w-lg text-4xl font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-5xl">
            Data padi tersusun, pekerjaan lapangan lebih mudah.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
            Aplikasi pencatatan produktivitas dan luas areal padi terpadu. Dilengkapi kemampuan penyimpanan offline untuk wilayah dengan keterbatasan jaringan.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 max-w-md pt-2">
            <div className="rounded-xl border border-border bg-card/60 p-4 shadow-xs backdrop-blur-xs">
              <p className="text-sm font-bold text-foreground">Offline-first</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Tetap catat data saat di sawah tanpa koneksi internet.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-4 shadow-xs backdrop-blur-xs">
              <p className="text-sm font-bold text-foreground">Sinkron Otomatis</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Data terkirim otomatis saat perangkat kembali online.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <Card className="border-border shadow-xl backdrop-blur-xs">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Masuk ke akun
              </CardTitle>
              <CardDescription>
                Gunakan kredensial akun PPL atau Administrator yang telah terdaftar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auth.notice && (
                <Alert variant="warning" className="mb-5">
                  <Info className="size-4" />
                  <AlertDescription>{auth.notice}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="mb-5">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nama@sipadi.test"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Kata sandi</Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-base font-semibold py-5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Memeriksa akun...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
