import { useEffect, useState } from "react";
import { api } from "../api/client";

const STATUS_STYLES = {
  PENDING: "status-open",
  APPROVED: "status-resolved",
  REJECTED: "status-closed",
  REVISION_REQUESTED: "status-progress",
};

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [acting, setActing] = useState(null); // { id, kind }
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const t = await api.getTickets();
      setTickets(t.value);
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

  const openAction = (id, kind) => {
    setActing({ id, kind });
    setComment("");
  };

  const submitAction = async () => {
    const { id, kind } = acting;
    try {
      if (kind === "approve") await api.approveTicket(id, comment);
      if (kind === "reject") await api.rejectTicket(id, comment);
      if (kind === "revise") await api.requestRevision(id, comment);
      setActing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>All tickets</h2>
        <span className="count-badge">{tickets.length}</span>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : tickets.length === 0 ? (
        <p className="muted">No tickets raised yet.</p>
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
              <p className="ticket-meta">
                {t.raisedBy?.name ? `Raised by ${t.raisedBy.name}` : "Unknown user"}
                {t.asset?.assetTag ? ` · Asset ${t.asset.assetTag}` : ""}
              </p>
              {t.adminComment && (
                <p className="admin-response">
                  <strong>Your last response:</strong> {t.adminComment}
                </p>
              )}

              {t.status === "PENDING" && (
                <div className="ticket-actions">
                  <button onClick={() => openAction(t.ID, "approve")}>Approve</button>
                  <button className="ghost" onClick={() => openAction(t.ID, "revise")}>
                    Request revision
                  </button>
                  <button className="link-danger" onClick={() => openAction(t.ID, "reject")}>
                    Reject
                  </button>
                </div>
              )}

              {acting?.id === t.ID && (
                <div className="resolve-box">
                  <input
                    placeholder="Comment for the user"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    autoFocus
                  />
                  <button onClick={submitAction}>Confirm</button>
                  <button className="ghost" onClick={() => setActing(null)}>
                    Cancel
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
