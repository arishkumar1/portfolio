import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const renderApiUrl = "https://arishportfolio.onrender.com/api";
const isRenderPortfolioSite =
  typeof window !== "undefined" &&
  window.location.hostname === "arish-portfolio-web.onrender.com";

// The Render frontend and API are separate services. Ignore a stale static-site
// VITE_API_URL on this known frontend host so API and upload URLs use the API.
const apiBaseUrl = isRenderPortfolioSite
  ? renderApiUrl
  : configuredApiUrl ||
    (import.meta.env.PROD ? renderApiUrl : "http://localhost:5000/api");

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});
export default api;
