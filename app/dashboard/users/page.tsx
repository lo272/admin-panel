import { createSupabaseServerClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AuthButton from "../../components/auth-button";

export default async function UsersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("is_superadmin").eq("id", user.id).single();
  if (!profile?.is_superadmin) redirect("/");

  const { data: users } = await supabase.from("profiles").select("id, name, email, is_superadmin, is_enabled, created_at").order("created_at", { ascending: false }).limit(100);

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🔐 Admin Panel</h1>
          <nav style={{ display: "flex", gap: 8 }}>
            {[["Dashboard", "/dashboard"], ["Users", "/dashboard/users"], ["Images", "/dashboard/images"], ["Captions", "/dashboard/captions"]].map(([label, href]) => (
              <Link key={href} href={href} style={{ padding: "6px 14px", borderRadius: 8, background: href === "/dashboard/users" ? "#1a1a1a" : "#f5f5f5", color: href === "/dashboard/users" ? "#fff" : "#333", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>{label}</Link>
            ))}
          </nav>
        </div>
        <AuthButton userEmail={user.email} />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 600 }}>👤 Users / Profiles ({users?.length ?? 0})</h2>
        <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9f9f9", borderBottom: "1px solid #eee" }}>
                {["Name", "Email", "Superadmin", "Enabled", "Joined"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#555" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                  <td style={{ padding: "12px 16px", fontSize: 14 }}>{u.name ?? "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#555" }}>{u.email ?? "—"}</td>
                  <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 99, background: u.is_superadmin ? "#dcfce7" : "#f5f5f5", color: u.is_superadmin ? "#16a34a" : "#888" }}>{u.is_superadmin ? "Yes" : "No"}</span></td>
                  <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 99, background: u.is_enabled ? "#dcfce7" : "#fee2e2", color: u.is_enabled ? "#16a34a" : "#dc2626" }}>{u.is_enabled ? "Active" : "Disabled"}</span></td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#888" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}