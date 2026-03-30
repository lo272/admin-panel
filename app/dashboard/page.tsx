import { createSupabaseServerClient } from "../utils/supabase/server";
import { redirect } from "next/navigation";
import AuthButton from "../components/auth-button";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("is_superadmin").eq("id", user.id).single();
  if (!profile?.is_superadmin) redirect("/");

  // Stats
  const [{ count: profileCount }, { count: imageCount }, { count: captionCount }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("images").select("*", { count: "exact", head: true }),
    supabase.from("captions").select("*", { count: "exact", head: true }),
  ]);

  const { data: topCaptions } = await supabase
    .from("captions")
    .select("content, like_count")
    .not("content", "is", null)
    .order("like_count", { ascending: false })
    .limit(5);

  const { data: recentCaptions } = await supabase
    .from("captions")
    .select("content, created_datetime_utc")
    .not("content", "is", null)
    .order("created_datetime_utc", { ascending: false })
    .limit(5);

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🔐 Admin Panel</h1>
          <nav style={{ display: "flex", gap: 8 }}>
            {[["Dashboard", "/dashboard"], ["Users", "/dashboard/users"], ["Images", "/dashboard/images"], ["Captions", "/dashboard/captions"]].map(([label, href]) => (
              <Link key={href} href={href} style={{ padding: "6px 14px", borderRadius: 8, background: href === "/dashboard" ? "#1a1a1a" : "#f5f5f5", color: href === "/dashboard" ? "#fff" : "#333", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>{label}</Link>
            ))}
          </nav>
        </div>
        <AuthButton userEmail={user.email} />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Users", value: profileCount ?? 0, emoji: "👤" },
            { label: "Total Images", value: imageCount ?? 0, emoji: "🖼️" },
            { label: "Total Captions", value: captionCount ?? 0, emoji: "💬" },
          ].map(({ label, value, emoji }) => (
            <div key={label} style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{emoji}</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#1a1a1a" }}>{value.toLocaleString()}</div>
              <div style={{ fontSize: 14, color: "#888", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Top captions */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>🏆 Top Captions by Likes</h2>
            {topCaptions?.map((c, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                <p style={{ margin: "0 0 4px", fontSize: 14 }}>{c.content}</p>
                <span style={{ fontSize: 12, color: "#888" }}>👍 {c.like_count} likes</span>
              </div>
            ))}
          </div>

          {/* Recent captions */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>🕐 Most Recent Captions</h2>
            {recentCaptions?.map((c, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                <p style={{ margin: "0 0 4px", fontSize: 14 }}>{c.content}</p>
                <span style={{ fontSize: 12, color: "#888" }}>{new Date(c.created_datetime_utc).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}