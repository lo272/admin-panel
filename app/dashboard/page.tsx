import { createSupabaseServerClient } from "../utils/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "../components/nav-header";

export default async function Dashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("is_superadmin").eq("id", user.id).single();
  if (!profile?.is_superadmin) redirect("/");

  // Stats
  const [
    { count: profileCount },
    { count: imageCount },
    { count: captionCount },
    { count: totalVoteCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("images").select("*", { count: "exact", head: true }),
    supabase.from("captions").select("*", { count: "exact", head: true }),
    supabase.from("caption_votes").select("*", { count: "exact", head: true }),
  ]);

  // Vote breakdown
  const [{ count: upvoteCount }, { count: downvoteCount }] = await Promise.all([
    supabase.from("caption_votes").select("*", { count: "exact", head: true }).eq("vote_type", "up"),
    supabase.from("caption_votes").select("*", { count: "exact", head: true }).eq("vote_type", "down"),
  ]);

  // Captions with vote counts for ranking
  const { data: allVotes } = await supabase
    .from("caption_votes")
    .select("caption_id, vote_type");

  // Aggregate votes per caption
  const voteMap: Record<string, { up: number; down: number }> = {};
  (allVotes ?? []).forEach(({ caption_id, vote_type }) => {
    if (!voteMap[caption_id]) voteMap[caption_id] = { up: 0, down: 0 };
    if (vote_type === "up") voteMap[caption_id].up++;
    else voteMap[caption_id].down++;
  });

  const votedCaptionIds = Object.keys(voteMap);

  // Fetch content for voted captions
  const { data: votedCaptions } = votedCaptionIds.length > 0
    ? await supabase.from("captions").select("id, content").in("id", votedCaptionIds)
    : { data: [] };

  const captionContentMap: Record<string, string> = {};
  (votedCaptions ?? []).forEach((c) => { captionContentMap[c.id] = c.content; });

  // Top upvoted captions
  const topUpvoted = Object.entries(voteMap)
    .map(([id, v]) => ({ id, content: captionContentMap[id] ?? "", up: v.up, down: v.down, net: v.up - v.down }))
    .filter((c) => c.content)
    .sort((a, b) => b.up - a.up)
    .slice(0, 5);

  // Most controversial (most total votes)
  const mostVoted = Object.entries(voteMap)
    .map(([id, v]) => ({ id, content: captionContentMap[id] ?? "", up: v.up, down: v.down, total: v.up + v.down }))
    .filter((c) => c.content)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const { data: recentCaptions } = await supabase
    .from("captions")
    .select("content, created_datetime_utc")
    .not("content", "is", null)
    .order("created_datetime_utc", { ascending: false })
    .limit(5);

  const upPct = totalVoteCount ? Math.round(((upvoteCount ?? 0) / totalVoteCount) * 100) : 0;

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <NavHeader userEmail={user.email} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* Primary stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Users", value: profileCount ?? 0, emoji: "👤" },
            { label: "Total Images", value: imageCount ?? 0, emoji: "🖼️" },
            { label: "Total Captions", value: captionCount ?? 0, emoji: "💬" },
            { label: "Total Votes", value: totalVoteCount ?? 0, emoji: "🗳️" },
          ].map(({ label, value, emoji }) => (
            <div key={label} style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#1a1a1a" }}>{value.toLocaleString()}</div>
              <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Rating breakdown */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>📊 Caption Rating Breakdown</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div style={{ textAlign: "center", padding: 16, background: "#dcfce7", borderRadius: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#16a34a" }}>{(upvoteCount ?? 0).toLocaleString()}</div>
              <div style={{ fontSize: 13, color: "#16a34a", marginTop: 4 }}>👍 Upvotes</div>
            </div>
            <div style={{ textAlign: "center", padding: 16, background: "#fee2e2", borderRadius: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#dc2626" }}>{(downvoteCount ?? 0).toLocaleString()}</div>
              <div style={{ fontSize: 13, color: "#dc2626", marginTop: 4 }}>👎 Downvotes</div>
            </div>
            <div style={{ textAlign: "center", padding: 16, background: "#f0f9ff", borderRadius: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#0369a1" }}>{upPct}%</div>
              <div style={{ fontSize: 13, color: "#0369a1", marginTop: 4 }}>Positive Rate</div>
            </div>
          </div>
          {/* Vote bar */}
          {(totalVoteCount ?? 0) > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ height: 8, borderRadius: 99, background: "#fee2e2", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${upPct}%`, background: "#16a34a", borderRadius: 99, transition: "width 0.4s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "#888" }}>
                <span>👍 {upPct}% positive</span>
                <span>{100 - upPct}% negative 👎</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Top upvoted captions */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>🏆 Most Upvoted Captions</h2>
            {topUpvoted.length === 0 && <p style={{ color: "#888", fontSize: 14 }}>No votes yet.</p>}
            {topUpvoted.map((c, i) => (
              <div key={c.id} style={{ padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                <p style={{ margin: "0 0 6px", fontSize: 14 }}>{c.content}</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 99, background: "#dcfce7", color: "#16a34a" }}>👍 {c.up}</span>
                  <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 99, background: "#fee2e2", color: "#dc2626" }}>👎 {c.down}</span>
                  <span style={{ fontSize: 12, color: "#888" }}>net {c.net >= 0 ? "+" : ""}{c.net}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Most voted captions */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>🔥 Most Voted Captions</h2>
            {mostVoted.length === 0 && <p style={{ color: "#888", fontSize: 14 }}>No votes yet.</p>}
            {mostVoted.map((c, i) => (
              <div key={c.id} style={{ padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                <p style={{ margin: "0 0 6px", fontSize: 14 }}>{c.content}</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 99, background: "#f5f5f5", color: "#555" }}>🗳️ {c.total} votes</span>
                  <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 99, background: "#dcfce7", color: "#16a34a" }}>👍 {c.up}</span>
                  <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 99, background: "#fee2e2", color: "#dc2626" }}>👎 {c.down}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent captions */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>🕐 Most Recent Captions</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {recentCaptions?.map((c, i) => (
              <div key={i} style={{ padding: "12px 16px", background: "#f9f9f9", borderRadius: 10 }}>
                <p style={{ margin: "0 0 6px", fontSize: 14 }}>{c.content}</p>
                <span style={{ fontSize: 12, color: "#888" }}>{new Date(c.created_datetime_utc).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}