import { createSupabaseServerClient } from "../utils/supabase/server";
import CaptionFeed from "../components/caption-feed";
import AuthButton from "../components/auth-button";

export default async function BrowsePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch recent public captions
  const { data: captions } = await supabase
    .from("captions")
    .select("id, content, like_count, created_datetime_utc")
    .eq("is_public", true)
    .not("content", "is", null)
    .order("created_datetime_utc", { ascending: false })
    .limit(50);

  // Fetch vote counts from caption_votes
  const captionIds = (captions ?? []).map((c) => c.id);
  let voteCounts: Record<string, number> = {};

  if (captionIds.length > 0) {
    const { data: votes } = await supabase
      .from("caption_votes")
      .select("caption_id")
      .in("caption_id", captionIds);

    (votes ?? []).forEach((v) => {
      voteCounts[v.caption_id] = (voteCounts[v.caption_id] ?? 0) + 1;
    });
  }

  const captionsWithCounts = (captions ?? []).map((c) => ({
    ...c,
    vote_count: voteCounts[c.id] ?? 0,
  }));

  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Header */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #eee",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🎭 Caption Feed</h1>
        <AuthButton userEmail={user?.email} />
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        <CaptionFeed
          initialCaptions={captionsWithCounts}
          userId={user?.id ?? null}
        />
      </div>
    </main>
  );
}
