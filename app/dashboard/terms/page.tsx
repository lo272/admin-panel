import { createSupabaseServerClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "../../components/nav-header";
import CrudManager from "../../components/crud-manager";

export default async function TermsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("is_superadmin").eq("id", user.id).single();
  if (!profile?.is_superadmin) redirect("/");

  const { data: terms } = await supabase.from("terms").select("*").order("created_at", { ascending: false });

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <NavHeader userEmail={user.email} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <CrudManager
          title="📝 Terms"
          tableName="terms"
          items={terms ?? []}
          columns={[
            { key: "id", label: "ID" },
            { key: "name", label: "Name" },
            { key: "description", label: "Description" },
            { key: "created_at", label: "Created", render: v => v ? new Date(v).toLocaleDateString() : "—" },
          ]}
          formFields={[
            { key: "name", label: "Name", required: true },
            { key: "description", label: "Description", type: "textarea" },
          ]}
        />
      </div>
    </main>
  );
}
