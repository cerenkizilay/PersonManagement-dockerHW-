import { useEffect, useMemo, useState } from "react";
import { deletePerson, listPeople, updatePerson } from "../api.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function EditModal({ person, onClose, onSave }) {
  const [fullName, setFullName] = useState(person.full_name);
  const [email, setEmail] = useState(person.email);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const validation = useMemo(() => {
    const next = {};
    if (!fullName.trim()) next.fullName = "Full Name is required.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(email.trim())) next.email = "Email format is invalid.";
    return next;
  }, [fullName, email]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (Object.keys(validation).length) {
      setError("Please fix validation errors.");
      return;
    }
    setSaving(true);
    try {
      const updated = await onSave({ full_name: fullName.trim(), email: email.trim() });
      return updated;
    } catch (err) {
      setError(err?.message || "REQUEST_FAILED");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal__header">
          <h2>Edit Person</h2>
          <button className="btn btn--ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        {error ? <div className="alert alert--error">{error}</div> : null}

        <form className="form" onSubmit={submit}>
          <label className="field">
            <span className="field__label">Full Name</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            {validation.fullName ? <span className="field__error">{validation.fullName}</span> : null}
          </label>

          <label className="field">
            <span className="field__label">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
            {validation.email ? <span className="field__error">{validation.email}</span> : null}
          </label>

          <div className="actions">
            <button className="btn btn--primary" disabled={saving} type="submit">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PeoplePage() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null);

  async function refresh() {
    setNotice(null);
    setLoading(true);
    try {
      const rows = await listPeople();
      setPeople(rows);
    } catch (err) {
      setNotice({ type: "error", text: err?.message || "REQUEST_FAILED" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onDelete(p) {
    const ok = window.confirm(`Delete ${p.full_name}?`);
    if (!ok) return;
    setNotice(null);
    try {
      await deletePerson(p.id);
      setPeople((prev) => prev.filter((x) => x.id !== p.id));
      setNotice({ type: "success", text: "Deleted successfully." });
    } catch (err) {
      setNotice({ type: "error", text: err?.message || "REQUEST_FAILED" });
    }
  }

  async function onSaveEdit(payload) {
    const updated = await updatePerson(editing.id, payload);
    setPeople((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setNotice({ type: "success", text: "Updated successfully." });
    setEditing(null);
    return updated;
  }

  return (
    <section className="card">
      <div className="row">
        <div>
          <h1>People</h1>
          <p className="muted">View, update, or delete registered people.</p>
        </div>
        <button className="btn" type="button" onClick={refresh} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {notice ? (
        <div className={`alert ${notice.type === "success" ? "alert--success" : "alert--error"}`}>
          {notice.text}
        </div>
      ) : null}

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th className="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {people.length === 0 && !loading ? (
              <tr>
                <td colSpan={4} className="muted">
                  No people yet.
                </td>
              </tr>
            ) : null}
            {people.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.full_name}</td>
                <td>{p.email}</td>
                <td className="right">
                  <div className="btnRow">
                    <button className="btn" type="button" onClick={() => setEditing(p)}>
                      Edit
                    </button>
                    <button className="btn btn--danger" type="button" onClick={() => onDelete(p)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing ? <EditModal person={editing} onClose={() => setEditing(null)} onSave={onSaveEdit} /> : null}
    </section>
  );
}

