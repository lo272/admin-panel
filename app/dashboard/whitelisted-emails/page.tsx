import { createSupabaseServerClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "../../components/nav-header";
import CrudManager from "../../components/crud-manager";

export default async function WhitelistedEmailsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("is_superadmin").eq("id", user.id).single();
  if (!profile?.is_superadmin) redirect("/");

  // Try whitelisted_emails first, fall back to invitations
  const { data: emails, error } = await supabase.from("whitelisted_emails").select("*").order("created_at", { ascending: false });
  const { data: invitations } = error
    ? await supabase.from("invitations").select("*").order("created_at", { ascending: false })
    : { data: null };

  const rows = emails ?? invitations ?? [];
  const tableName = error ? "invitations" : "whitelisted_emails";

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <NavHeader userEmail={user.email} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <CrudManager
          title="✉️ Whitelisted Emails"
          tableName={tableName}
          items={rows}
          columns={[
            { key: "id", label: "ID" },
            { key: "email", label: "Email" },
            { key: "status", label: "Status" },
            { key: "created_at", label: "Created", render: v => v ? new Date(v).toLocaleDateString() : "—" },
          ]}
          formFields={[
            { key: "email", label: "Email", type: "email", required: true },
            { key: "status", label: "Status" },
          ]}
        />
      </div>
    </main>
  );
}
