import { createSupabaseServerClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "../../components/nav-header";
import CrudManager from "../../components/crud-manager";

export default async function LlmProvidersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("is_superadmin").eq("id", user.id).single();
  if (!profile?.is_superadmin) redirect("/");

  const { data: providers } = await supabase.from("llm_providers").select("*").order("created_at", { ascending: false });

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <NavHeader userEmail={user.email} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <CrudManager
          title="🔌 LLM Providers"
          tableName="llm_providers"
          items={providers ?? []}
          columns={[
            { key: "id", label: "ID" },
            { key: "name", label: "Name" },
            { key: "api_base_url", label: "API Base URL" },
            { key: "is_active", label: "Active", render: v => (
              <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 99, background: v ? "#dcfce7" : "#f5f5f5", color: v ? "#16a34a" : "#888" }}>
                {v ? "Yes" : "No"}
              </span>
            )},
            { key: "created_at", label: "Created", render: v => v ? new Date(v).toLocaleDateString() : "—" },
          ]}
          formFields={[
            { key: "name", label: "Name", required: true },
            { key: "api_base_url", label: "API Base URL" },
            { key: "is_active", label: "Active", type: "checkbox" },
          ]}
        />
      </div>
    </main>
  );
}
