import { createSupabaseServerClient } from "./utils/supabase/server";
import AuthButton from "./components/auth-button";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 48, maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Admin Panel</h1>
          <p style={{ color: "#666", marginBottom: 24, lineHeight: 1.6 }}>Sign in with your Google account to access the admin area.</p>
          <AuthButton />
        </div>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_superadmin) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Access Denied</h1>
          <p style={{ color: "#666" }}>You don't have superadmin access.</p>
          <AuthButton userEmail={user.email} />
        </div>
      </main>
    );
  }

  redirect("/dashboard");
}
