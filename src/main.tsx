import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./tools/i18n";

// Monkey patch fetch for logging - DISABLED by default to avoid loops
// logic removed...

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
