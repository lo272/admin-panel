import { createSupabaseServerClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "../../components/nav-header";
import CrudManager from "../../components/crud-manager";

export default async function SignupDomainsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("is_superadmin").eq("id", user.id).single();
  if (!profile?.is_superadmin) redirect("/");

  const { data: domains } = await supabase.from("allowed_signup_domains").select("*").order("created_datetime_utc", { ascending: false });

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <NavHeader userEmail={user.email} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <CrudManager
          title="🌐 Allowed Signup Domains"
          tableName="allowed_signup_domains"
          items={domains ?? []}
          columns={[
            { key: "id", label: "ID" },
            { key: "apex_domain", label: "Domain" },
            { key: "created_datetime_utc", label: "Created", render: v => v ? new Date(v).toLocaleDateString() : "—" },
          ]}
          formFields={[
            { key: "apex_domain", label: "Domain (e.g. example.com)", required: true },
          ]}
        />
      </div>
    </main>
  );
}
