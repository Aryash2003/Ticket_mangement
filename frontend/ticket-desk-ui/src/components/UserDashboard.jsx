import { useEffect, useState } from "react";
import { api } from "../api/client";

const STATUS_STYLES = {
  PENDING: "status-open",
  APPROVED: "status-resolved",
  REJECTED: "status-closed",
  REVISION_REQUESTED: "status-progress",
};

export default function UserDashboard() {
  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", asset_ID: "" });
  const [revising, setRevising] = useState(null);
  const [revisionText, setRevisionText] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [t, a] = await Promise.all([api.getTickets(), api.getAssets()]);
      setTickets(t.value);
      setAssets(a.value);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      await api.raiseTicket({
        title: form.title,
        description: form.description,
        ...(form.asset_ID && { asset_ID: form.asset_ID }),
      });
      setForm({ title: "", description: "", asset_ID: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startRevision = (ticket) => {
    setRevising(ticket.ID);
    setRevisionText(ticket.description || "");
  };

  const submitRevision = async (id) => {
    try {
      await api.resubmitTicket(id, revisionText);
      setRevising(null);
      setRevisionText("");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <section className="panel">
        <div className="panel-header">
          <h2>Raise a ticket</h2>
        </div>
        <form className="stacked-form" onSubmit={submit}>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Describe the issue"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
          />
          <div className="form-row">
            <select
              value={form.asset_ID}
              onChange={(e) => setForm({ ...form, asset_ID: e.target.value })}
            >
              <option value="">Asset (optional)</option>
              {assets.map((a) => (
                <option key={a.ID} value={a.ID}>
                  {a.assetTag} — {a.assetType}
                </option>
              ))}
            </select>
            <button type="submit">Submit</button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Your tickets</h2>
          <span className="count-badge">{tickets.length}</span>
        </div>

        {error && <p className="error-text">{error}</p>}
        {loading ? (
          <p className="muted">Loading…</p>
        ) : tickets.length === 0 ? (
          <p className="muted">You haven't raised any tickets yet.</p>
        ) : (
          <ul className="entity-list tickets">
            {tickets.map((t) => (
              <li key={t.ID}>
                <div className="ticket-title-row">
                  <strong>{t.title}</strong>
                  <span className={`status-pill ${STATUS_STYLES[t.status] || ""}`}>
                    {t.status?.replace("_", " ")}
                  </span>
                </div>
                {t.description && <p className="muted">{t.description}</p>}
                {t.adminComment && (
                  <p className="admin-response">
                    <strong>Admin response:</strong> {t.adminComment}
                  </p>
                )}

                {t.status === "REVISION_REQUESTED" &&
                  (revising === t.ID ? (
                    <div className="resolve-box">
                      <input
                        placeholder="Updated details"
                        value={revisionText}
                        onChange={(e) => setRevisionText(e.target.value)}
                        autoFocus
                      />
                      <button onClick={() => submitRevision(t.ID)}>Resubmit</button>
                      <button className="ghost" onClick={() => setRevising(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startRevision(t)}>Update & resubmit</button>
                  ))}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
