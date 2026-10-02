const BASE_URL = "http://localhost:4004/odata/v4/ticket";

function getToken() {
  return localStorage.getItem("td_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `Request failed: ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const auth = {
  register: (username, password, name) =>
    request("/register", {
      method: "POST",
      body: JSON.stringify({ username, password, name }),
    }),
  login: (username, password) =>
    request("/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  saveSession: ({ token, user }) => {
    localStorage.setItem("td_token", token);
    localStorage.setItem("td_user", JSON.stringify(user));
  },
  loadSession: () => {
    const token = getToken();
    const user = localStorage.getItem("td_user");
    return token && user ? { token, user: JSON.parse(user) } : null;
  },
  logout: () => {
    localStorage.removeItem("td_token");
    localStorage.removeItem("td_user");
  },
};

export const api = {
  getTickets: () => request("/Tickets?$expand=raisedBy,asset&$orderby=createdAt desc"),
  getAssets: () => request("/Assets"),
  raiseTicket: (data) => request("/Tickets", { method: "POST", body: JSON.stringify(data) }),
  approveTicket: (ID, comment) =>
    request("/approveTicket", { method: "POST", body: JSON.stringify({ ID, comment }) }),
  rejectTicket: (ID, comment) =>
    request("/rejectTicket", { method: "POST", body: JSON.stringify({ ID, comment }) }),
  requestRevision: (ID, comment) =>
    request("/requestRevision", { method: "POST", body: JSON.stringify({ ID, comment }) }),
  resubmitTicket: (ID, description) =>
    request("/resubmitTicket", { method: "POST", body: JSON.stringify({ ID, description }) }),
};
