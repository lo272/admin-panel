"use client";
import { createSupabaseBrowserClient } from "../utils/supabase/browser";

export default function AuthButton({ userEmail }: { userEmail?: string }) {
  const supabase = createSupabaseBrowserClient();

  if (userEmail) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, color: "#666" }}>{userEmail}</span>
        <button
          onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
          style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 13 }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })}
      style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#1a1a1a", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
    >
      Sign in with Google
    </button>
  );
}