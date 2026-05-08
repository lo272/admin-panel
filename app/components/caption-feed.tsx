"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createSupabaseBrowserClient } from "../utils/supabase/browser";
import { useRouter } from "next/navigation";

type Caption = {
  id: string;
  content: string;
  like_count: number;
  created_datetime_utc: string;
  vote_count: number;
};

// ── Toast ──────────────────────────────────────────────────────────────────────

function Toast({ message, onHide }: { message: string; onHide: () => void }) {
  useEffect(() => {
    const t = setTimeout(onHide, 2500);
    return () => clearTimeout(t);
  }, [onHide]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#1a1a1a",
        color: "#fff",
        padding: "12px 24px",
        borderRadius: 99,
        fontSize: 14,
        fontWeight: 500,
        zIndex: 1000,
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        whiteSpace: "nowrap",
        animation: "toastIn 0.2s ease",
      }}
    >
      {message}
    </div>
  );
}

// ── Caption card ───────────────────────────────────────────────────────────────

function CaptionCard({
  caption,
  userId,
  userVote,
  onVote,
}: {
  caption: Caption;
  userId: string | null;
  userVote: "up" | "down" | null;
  onVote: (captionId: string, voteType: "up" | "down") => void;
}) {
  const router = useRouter();
  const notLoggedIn = !userId;

  function handleVoteClick(voteType: "up" | "down") {
    if (notLoggedIn) {
      router.push("/");
      return;
    }
    onVote(caption.id, voteType);
  }

  const voteBtn = (
    type: "up" | "down",
    emoji: string,
    label: string,
    activeBackground: string,
    activeColor: string,
    activeBorder: string
  ) => {
    const isActive = userVote === type;
    return (
      <div
        title={notLoggedIn ? "Log in to vote" : undefined}
        style={{ position: "relative", display: "inline-block" }}
      >
        <button
          onClick={() => handleVoteClick(type)}
          style={{
            padding: "6px 14px",
            borderRadius: 99,
            border: `1px solid ${isActive ? activeBorder : "#e0e0e0"}`,
            background: isActive ? activeBackground : "#fff",
            color: isActive ? activeColor : "#444",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          {emoji} {label}
        </button>
      </div>
    );
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <p style={{ margin: "0 0 16px", fontSize: 15, lineHeight: 1.6, color: "#222" }}>
        {caption.content}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Vote count badge */}
        <span
          style={{
            fontSize: 12,
            padding: "3px 10px",
            borderRadius: 99,
            background: "#f5f5f5",
            color: "#666",
            fontWeight: 500,
          }}
        >
          {caption.vote_count} {caption.vote_count === 1 ? "vote" : "votes"}
        </span>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {voteBtn("up", "👍", "Upvote", "#dcfce7", "#16a34a", "#16a34a")}
          {voteBtn("down", "👎", "Downvote", "#fee2e2", "#dc2626", "#dc2626")}
        </div>
      </div>
    </div>
  );
}

// ── Upload form ────────────────────────────────────────────────────────────────

function UploadForm({
  userId,
  onToast,
}: {
  userId: string | null;
  onToast: (msg: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createSupabaseBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file || uploading) return;

    setUploading(true);
    setUploadError(null);

    try {
      // Upload file to Supabase Storage
      const ext = file.name.split(".").pop();
      const path = `uploads/${Date.now()}.${ext}`;
      const { error: storageError } = await supabase.storage
        .from("images")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (storageError) throw storageError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(path);

      // Create image record
      const { data: imageRow, error: imageError } = await supabase
        .from("images")
        .insert({ url: publicUrl, is_public: true, profile_id: userId })
        .select()
        .single();
      if (imageError) throw imageError;

      // Request caption generation
      await supabase
        .from("caption_requests")
        .insert({ image_id: imageRow.id, profile_id: userId, status: "pending" });

      onToast("Image uploaded! Captions are being generated...");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }

  if (!userId) {
    return (
      <p style={{ color: "#888", fontSize: 14, margin: 0 }}>
        <a href="/" style={{ color: "#1a1a1a", fontWeight: 600 }}>Sign in</a>
        {" "}to upload images and generate captions.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        disabled={uploading}
        required
        style={{ flex: 1, fontSize: 14, minWidth: 200 }}
      />
      <button
        type="submit"
        disabled={uploading}
        style={{
          padding: "8px 20px",
          background: uploading ? "#888" : "#1a1a1a",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: uploading ? "not-allowed" : "pointer",
          fontSize: 14,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 140,
          justifyContent: "center",
        }}
      >
        {uploading ? (
          <>
            <span
              style={{
                width: 14,
                height: 14,
                border: "2px solid rgba(255,255,255,0.35)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.7s linear infinite",
                flexShrink: 0,
              }}
            />
            Uploading...
          </>
        ) : (
          "Upload Image"
        )}
      </button>
      {uploadError && (
        <p style={{ width: "100%", color: "#dc2626", fontSize: 13, margin: 0 }}>
          {uploadError}
        </p>
      )}
    </form>
  );
}

// ── Feed ───────────────────────────────────────────────────────────────────────

export default function CaptionFeed({
  initialCaptions,
  userId,
}: {
  initialCaptions: Caption[];
  userId: string | null;
}) {
  const [captions, setCaptions] = useState(initialCaptions);
  const [userVotes, setUserVotes] = useState<Record<string, "up" | "down">>({});
  const [toast, setToast] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  // Load current user's existing votes on mount
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("caption_votes")
      .select("caption_id, vote_type")
      .eq("profile_id", userId)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, "up" | "down"> = {};
        data.forEach((v) => {
          map[v.caption_id] = v.vote_type;
        });
        setUserVotes(map);
      });
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = useCallback((msg: string) => setToast(msg), []);

  async function handleVote(captionId: string, voteType: "up" | "down") {
    if (!userId) return;

    const existingVote = userVotes[captionId];
    const isSameVote = existingVote === voteType;

    if (isSameVote) {
      // Toggle off: remove the vote
      setCaptions((prev) =>
        prev.map((c) =>
          c.id === captionId ? { ...c, vote_count: Math.max(0, c.vote_count - 1) } : c
        )
      );
      const next = { ...userVotes };
      delete next[captionId];
      setUserVotes(next);

      await supabase
        .from("caption_votes")
        .delete()
        .eq("caption_id", captionId)
        .eq("profile_id", userId);

      showToast("Vote removed");
      return;
    }

    // Optimistic update
    setCaptions((prev) =>
      prev.map((c) =>
        c.id === captionId
          ? { ...c, vote_count: c.vote_count + (existingVote ? 0 : 1) }
          : c
      )
    );
    setUserVotes((prev) => ({ ...prev, [captionId]: voteType }));

    let error;
    if (existingVote) {
      ({ error } = await supabase
        .from("caption_votes")
        .update({ vote_type: voteType })
        .eq("caption_id", captionId)
        .eq("profile_id", userId));
    } else {
      ({ error } = await supabase
        .from("caption_votes")
        .insert({ caption_id: captionId, profile_id: userId, vote_type: voteType }));
    }

    if (error) {
      // Revert optimistic update
      setCaptions((prev) =>
        prev.map((c) =>
          c.id === captionId
            ? { ...c, vote_count: c.vote_count - (existingVote ? 0 : 1) }
            : c
        )
      );
      const reverted = { ...userVotes };
      if (existingVote) {
        reverted[captionId] = existingVote;
      } else {
        delete reverted[captionId];
      }
      setUserVotes(reverted);
      showToast("Something went wrong. Please try again.");
      return;
    }

    showToast("Vote submitted! ✓");
  }

  return (
    <div>
      {/* Global keyframe styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {toast && <Toast message={toast} onHide={() => setToast(null)} />}

      {/* Upload section */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>
          📸 Upload an Image for Captions
        </h2>
        <UploadForm userId={userId} onToast={showToast} />
      </div>

      {/* Caption cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {captions.length === 0 && (
          <p style={{ textAlign: "center", color: "#888", padding: 48 }}>
            No captions yet.
          </p>
        )}
        {captions.map((caption) => (
          <CaptionCard
            key={caption.id}
            caption={caption}
            userId={userId}
            userVote={userVotes[caption.id] ?? null}
            onVote={handleVote}
          />
        ))}
      </div>
    </div>
  );
}
