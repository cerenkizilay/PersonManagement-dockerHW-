import { useMemo, useState } from "react";
import { createPerson } from "../api.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'success'|'error', text: string }

  const errors = useMemo(() => {
    const next = {};
    if (!fullName.trim()) next.fullName = "Full Name is required.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(email.trim())) next.email = "Email format is invalid.";
    return next;
  }, [fullName, email]);

  async function onSubmit(e) {
    e.preventDefault();
    setNotice(null);
    if (Object.keys(errors).length) {
      setNotice({ type: "error", text: "Please fix validation errors." });
      return;
    }

    setSubmitting(true);
    try {
      await createPerson({ full_name: fullName.trim(), email: email.trim() });
      setNotice({ type: "success", text: "Person created successfully." });
      setFullName("");
      setEmail("");
    } catch (err) {
      const msg = err?.message || "REQUEST_FAILED";
      setNotice({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <h1>Registration</h1>
      <p className="muted">Add a new person to the database.</p>

      {notice ? (
        <div className={`alert ${notice.type === "success" ? "alert--success" : "alert--error"}`}>
          {notice.text}
        </div>
      ) : null}

      <form className="form" onSubmit={onSubmit}>
        <label className="field">
          <span className="field__label">Full Name</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Ada Lovelace"
            aria-invalid={Boolean(errors.fullName)}
          />
          {errors.fullName ? <span className="field__error">{errors.fullName}</span> : null}
        </label>

        <label className="field">
          <span className="field__label">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. ada@example.com"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? <span className="field__error">{errors.email}</span> : null}
        </label>

        <div className="actions">
          <button className="btn btn--primary" disabled={submitting} type="submit">
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </section>
  );
}

