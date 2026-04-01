"use client";
import { useState } from "react";
import { createSupabaseBrowserClient } from "../utils/supabase/browser";

export type ColDef = { key: string; label: string; render?: (val: any, row: any) => React.ReactNode };
export type FieldDef = { key: string; label: string; type?: "text" | "textarea" | "number" | "checkbox" | "email"; required?: boolean };

interface CrudManagerProps {
  title: string;
  tableName: string;
  items: any[];
  columns: ColDef[];
  formFields: FieldDef[];
  idField?: string;
}

const inputStyle: React.CSSProperties = { padding: "7px 10px", borderRadius: 7, border: "1px solid #ddd", fontSize: 13, width: "100%" };
const btn = (variant: "primary" | "secondary" | "danger"): React.CSSProperties => ({
  padding: "6px 12px", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 500,
  background: variant === "primary" ? "#1a1a1a" : variant === "danger" ? "#fee2e2" : "#f0f0f0",
  color: variant === "primary" ? "#fff" : variant === "danger" ? "#dc2626" : "#333",
});

export default function CrudManager({ title, tableName, items: initial, columns, formFields, idField = "id" }: CrudManagerProps) {
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<any>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  function setField(obj: Record<string, string>, key: string, val: string) {
    return { ...obj, [key]: val };
  }

  async function handleCreate() {
    const payload: Record<string, any> = {};
    for (const f of formFields) {
      if (form[f.key] !== undefined && form[f.key] !== "") {
        payload[f.key] = f.type === "number" ? Number(form[f.key]) : f.type === "checkbox" ? form[f.key] === "true" : form[f.key];
      }
    }
    const { data, error } = await supabase.from(tableName).insert(payload).select().single();
    if (error) { setErr(error.message); return; }
    setItems([data, ...items]);
    setForm({});
    setErr(null);
  }

  async function handleUpdate(id: any) {
    const payload: Record<string, any> = {};
    for (const f of formFields) {
      if (editForm[f.key] !== undefined) {
        payload[f.key] = f.type === "number" ? Number(editForm[f.key]) : f.type === "checkbox" ? editForm[f.key] === "true" : editForm[f.key];
      }
    }
    const { data, error } = await supabase.from(tableName).update(payload).eq(idField, id).select().single();
    if (error) { setErr(error.message); return; }
    setItems(items.map(i => i[idField] === id ? data : i));
    setEditingId(null);
    setErr(null);
  }

  async function handleDelete(id: any) {
    if (!confirm("Delete this record?")) return;
    const { error } = await supabase.from(tableName).delete().eq(idField, id);
    if (error) { setErr(error.message); return; }
    setItems(items.filter(i => i[idField] !== id));
    setErr(null);
  }

  function startEdit(item: any) {
    const ef: Record<string, string> = {};
    formFields.forEach(f => { ef[f.key] = item[f.key] != null ? String(item[f.key]) : ""; });
    setEditForm(ef);
    setEditingId(item[idField]);
  }

  function renderInput(f: FieldDef, value: string, onChange: (v: string) => void) {
    if (f.type === "textarea") return <textarea value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} rows={2} />;
    if (f.type === "checkbox") return <input type="checkbox" checked={value === "true"} onChange={e => onChange(String(e.target.checked))} />;
    return <input type={f.type ?? "text"} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />;
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 600 }}>{title} ({items.length})</h2>
      {err && <div style={{ marginBottom: 12, padding: "10px 14px", background: "#fee2e2", borderRadius: 8, color: "#dc2626", fontSize: 13 }}>{err}</div>}

      {/* Create form */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 18, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600 }}>Add New</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          {formFields.map(f => (
            <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
              <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>{f.label}</label>
              {renderInput(f, form[f.key] ?? "", v => setForm(setField(form, f.key, v)))}
            </div>
          ))}
          <button onClick={handleCreate} style={btn("primary")}>Add</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr style={{ background: "#f9f9f9", borderBottom: "1px solid #eee" }}>
                {columns.map(c => (
                  <th key={c.key} style={{ padding: "11px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#555", whiteSpace: "nowrap" }}>{c.label}</th>
                ))}
                <th style={{ padding: "11px 14px", fontSize: 12, fontWeight: 600, color: "#555" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={columns.length + 1} style={{ padding: "20px 14px", textAlign: "center", color: "#aaa", fontSize: 13 }}>No records</td></tr>
              )}
              {items.map(item => (
                <tr key={item[idField]} style={{ borderBottom: "1px solid #f5f5f5" }}>
                  {editingId === item[idField] ? (
                    <>
                      {columns.map(c => {
                        const editable = formFields.find(f => f.key === c.key);
                        return (
                          <td key={c.key} style={{ padding: "10px 14px" }}>
                            {editable
                              ? renderInput(editable, editForm[c.key] ?? "", v => setEditForm(setField(editForm, c.key, v)))
                              : <span style={{ fontSize: 12, color: "#999" }}>{String(item[c.key] ?? "")}</span>}
                          </td>
                        );
                      })}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => handleUpdate(item[idField])} style={btn("primary")}>Save</button>
                          <button onClick={() => setEditingId(null)} style={btn("secondary")}>Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      {columns.map(c => (
                        <td key={c.key} style={{ padding: "11px 14px", fontSize: 13, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.render ? c.render(item[c.key], item) : (item[c.key] != null ? String(item[c.key]) : "—")}
                        </td>
                      ))}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => startEdit(item)} style={btn("secondary")}>Edit</button>
                          <button onClick={() => handleDelete(item[idField])} style={btn("danger")}>Delete</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
