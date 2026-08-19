// API base URL for the chess model backend.
//
// Set VITE_API_URL at build time to point at a deployed backend, e.g.:
//   VITE_API_URL=https://chess-agent.onrender.com npm run build
//
// If unset, calls are relative (/api/...) which works when the frontend is
// served from the same origin as the backend (or proxied in dev by Vite).
const API_BASE = ((import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')) + '/api'

export { API_BASE }