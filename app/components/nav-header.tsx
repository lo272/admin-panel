"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButton from "./auth-button";

const NAV_LINKS: [string, string][] = [
  ["Dashboard", "/dashboard"],
  ["Users", "/dashboard/users"],
  ["Images", "/dashboard/images"],
  ["Captions", "/dashboard/captions"],
  ["Flavors", "/dashboard/humor-flavors"],
  ["Flavor Steps", "/dashboard/humor-flavor-steps"],
  ["Terms", "/dashboard/terms"],
  ["Cap. Requests", "/dashboard/caption-requests"],
  ["Cap. Examples", "/dashboard/caption-examples"],
  ["LLM Models", "/dashboard/llm-models"],
  ["LLM Providers", "/dashboard/llm-providers"],
  ["Prompt Chains", "/dashboard/llm-prompt-chains"],
  ["LLM Responses", "/dashboard/llm-responses"],
  ["Signup Domains", "/dashboard/signup-domains"],
  ["Whitelist", "/dashboard/whitelisted-emails"],
];

export default function NavHeader({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, flexShrink: 0 }}>🔐 Admin</h1>
        <nav style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
          {NAV_LINKS.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              style={{
                padding: "5px 10px",
                borderRadius: 7,
                background: pathname === href ? "#1a1a1a" : "#f5f5f5",
                color: pathname === href ? "#fff" : "#444",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 500,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <AuthButton userEmail={userEmail} />
    </div>
  );
}
