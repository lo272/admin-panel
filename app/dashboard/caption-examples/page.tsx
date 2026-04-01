import { createSupabaseServerClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "../../components/nav-header";
import CrudManager from "../../components/crud-manager";

export default async function CaptionExamplesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("is_superadmin").eq("id", user.id).single();
  if (!profile?.is_superadmin) redirect("/");

  const { data: examples } = await supabase.from("caption_examples").select("*").order("created_at", { ascending: false });

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <NavHeader userEmail={user.email} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <CrudManager
          title="💡 Caption Examples"
          tableName="caption_examples"
          items={examples ?? []}
          columns={[
            { key: "id", label: "ID" },
            { key: "content", label: "Content" },
            { key: "humor_flavor_id", label: "Flavor ID" },
            { key: "created_at", label: "Created", render: v => v ? new Date(v).toLocaleDateString() : "—" },
          ]}
          formFields={[
            { key: "content", label: "Content", type: "textarea", required: true },
            { key: "humor_flavor_id", label: "Flavor ID" },
          ]}
        />
      </div>
    </main>
  );
}
