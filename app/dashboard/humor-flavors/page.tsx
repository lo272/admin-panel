import { createSupabaseServerClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "../../components/nav-header";

export default async function HumorFlavorsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("is_superadmin").eq("id", user.id).single();
  if (!profile?.is_superadmin) redirect("/");

  const { data: flavors } = await supabase.from("humor_flavors").select("*").order("created_at", { ascending: false });

  const keys = flavors && flavors.length > 0 ? Object.keys(flavors[0]) : ["id", "name", "description", "created_at"];

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <NavHeader userEmail={user.email} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 600 }}>🎭 Humor Flavors ({flavors?.length ?? 0})</h2>
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9f9f9", borderBottom: "1px solid #eee" }}>
                  {keys.map(k => (
                    <th key={k} style={{ padding: "11px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#555", whiteSpace: "nowrap" }}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flavors?.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    {keys.map(k => (
                      <td key={k} style={{ padding: "11px 14px", fontSize: 13, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row[k] != null ? String(row[k]) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
