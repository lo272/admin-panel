"use client";
import { useState } from "react";
import { createSupabaseBrowserClient } from "../utils/supabase/browser";

export default function ImageManager({ images: initial, userId }: { images: any[]; userId: string }) {
  const [images, setImages] = useState(initial);
  const [newUrl, setNewUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const supabase = createSupabaseBrowserClient();

  async function handleCreate() {
    if (!newUrl.trim()) return;
    const { data, error } = await supabase.from("images").insert({ url: newUrl, is_public: isPublic, profile_id: userId }).select().single();
    if (!error && data) { setImages([data, ...images]); setNewUrl(""); }
  }

  async function handleUpdate(id: string) {
    const { data, error } = await supabase.from("images").update({ url: editUrl }).eq("id", id).select().single();
    if (!error && data) { setImages(images.map(i => i.id === id ? data : i)); setEditingId(null); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this image?")) return;
    const { error } = await supabase.from("images").delete().eq("id", id);
    if (!error) setImages(images.filter(i => i.id !== id));
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 600 }}>🖼️ Images ({images.length})</h2>

      {/* Create */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600 }}>Add New Image</h3>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="Image URL" style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} /> Public
          </label>
          <button onClick={handleCreate} style={{ padding: "8px 20px", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>Add</button>
        </div>
      </div>

      {/* List */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {images.map(img => (
          <div key={img.id} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            {img.url && <img src={img.url} alt="" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} onError={e => (e.currentTarget.style.display = "none")} />}
            <div style={{ padding: 14 }}>
              {editingId === img.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input value={editUrl} onChange={e => setEditUrl(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleUpdate(img.id)} style={{ flex: 1, padding: "6px 0", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: "6px 0", background: "#f5f5f5", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: "#888", wordBreak: "break-all" }}>{img.url?.slice(0, 60)}...</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setEditingId(img.id); setEditUrl(img.url); }} style={{ flex: 1, padding: "6px 0", background: "#f5f5f5", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Edit</button>
                    <button onClick={() => handleDelete(img.id)} style={{ flex: 1, padding: "6px 0", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Delete</button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}