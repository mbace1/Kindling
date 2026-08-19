import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-night px-6 text-bone">
      <img
        src="/art/camp.jpg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-night/70" />
      <div className="relative w-full max-w-sm space-y-5 rounded-lg border border-ash bg-stone/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <p className="text-xs uppercase tracking-[0.22em] text-mute">Kindling</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">Keep the fire on this machine, or carry it with you.</h1>
        <p className="text-sm text-mute">
          Guest play is enough. Sign in only if you want today to follow you to another device.
        </p>
        {authEnabled ? (
          <div className="space-y-2">
            {GROK_PROVIDERS.map((p) => (
              <button
                key={p.providerId}
                type="button"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                className="w-full rounded-md border border-ash bg-night px-4 py-3 text-sm font-medium text-bone transition hover:border-mute"
              >
                Continue with {p.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-mute">Sign-in is disabled.</p>
        )}
        <Link to="/" className="block text-center text-sm text-mute underline-offset-4 hover:text-bone hover:underline">
          Stay a guest
        </Link>
      </div>
    </main>
  );
}
