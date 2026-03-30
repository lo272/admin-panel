import { createSupabaseServerClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AuthButton from "../../components/auth-button";
import ImageManager from "../../components/image-manager";

export default async function ImagesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("is_superadmin").eq("id", user.id).single();
  if (!profile?.is_superadmin) redirect("/");

  const { data: images } = await supabase.from("images").select("id, url, is_public, created_at").order("created_at", { ascending: false }).limit(100);

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>🔐 Admin Panel</h1>
          <nav style={{ display: "flex", gap: 8 }}>
            {[["Dashboard", "/dashboard"], ["Users", "/dashboard/users"], ["Images", "/dashboard/images"], ["Captions", "/dashboard/captions"]].map(([label, href]) => (
              <Link key={href} href={href} style={{ padding: "6px 14px", borderRadius: 8, background: href === "/dashboard/images" ? "#1a1a1a" : "#f5f5f5", color: href === "/dashboard/images" ? "#fff" : "#333", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>{label}</Link>
            ))}
          </nav>
        </div>
        <AuthButton userEmail={user.email} />
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <ImageManager images={images ?? []} userId={user.id} />
      </div>
    </main>
  );
}