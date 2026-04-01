import { createSupabaseServerClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "../../components/nav-header";

export default async function UsersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("is_superadmin").eq("id", user.id).single();
  if (!profile?.is_superadmin) redirect("/");

  const { data: users } = await supabase.from("profiles").select("id, name, email, is_superadmin, is_enabled, created_at").order("created_at", { ascending: false }).limit(100);

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <NavHeader userEmail={user.email} />

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