import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/lib/auth";

export const metadata = { title: "Sign in — Terravion OS" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;
  const session = await auth();
  if (session?.user) redirect(from ?? "/");

  async function authenticate(formData: FormData) {
    "use server";
    let target = (formData.get("from") as string) || "/";
    if (!target.startsWith("/") || target === "/l" || target === "/login") {
      target = "/";
    }
    try {
      await signIn("credentials", {
        email: String(formData.get("email") ?? "").toLowerCase().trim(),
        password: String(formData.get("password") ?? ""),
        redirectTo: target,
      });
    } catch (e) {
      if (e instanceof AuthError) {
        redirect(
          `/login?error=1${target !== "/" ? `&from=${encodeURIComponent(target)}` : ""}`
        );
      }
      throw e;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-6">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 relative h-16 w-52 overflow-hidden">
            <img
              src="/terravion-logo.jpeg"
              alt="Terravion Properties"
              className="h-full w-full object-contain filter drop-shadow-sm"
            />
          </div>
          <h1 className="text-[1.3rem] font-serif font-bold tracking-tight text-slate-900 flex items-center justify-center gap-2">
            <span>Enterprise Workspace</span>
            <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-[#946c0b] border border-amber-200">CRM</span>
          </h1>
          <p className="mt-1 text-[0.8125rem] text-slate-500 font-medium">
            Multi-Project Real Estate Operating System
          </p>
        </div>

        <form action={authenticate} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
          <input type="hidden" name="from" value={from ?? "/"} />

          <div>
            <label htmlFor="email" className="label mb-1.5 block text-slate-600">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              autoFocus
              className="field"
              placeholder="admin@terravionproperties.in"
            />
          </div>

          <div>
            <label htmlFor="password" className="label mb-1.5 block text-slate-600">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              className="field"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="text-[0.8125rem] font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              Invalid credentials. Please check your email or password.
            </p>
          )}

          <button type="submit" className="btn btn-primary w-full shadow-md mt-2">
            Sign In to CRM
          </button>
        </form>

        <p className="mt-6 text-center text-[0.75rem] text-slate-400">
          Authorised staff only. All activity is audited.
        </p>
      </div>
    </main>
  );
}
