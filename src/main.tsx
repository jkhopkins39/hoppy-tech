import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import App from "./routes/App";
import GtagPageView from "./components/GtagPageView";
import { ThemeProvider } from "./context/ThemeContext";
import { CrackModeProvider } from "./context/CrackModeContext";
import CrackModeExit from "./components/CrackModeExit";
import { initAdminAuth } from "./lib/auth";
import "./styles/index.css";
import "./styles/crack-mode.css";

initAdminAuth();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GtagPageView />
      <ThemeProvider>
        <CrackModeProvider>
          <App />
          <CrackModeExit />
        </CrackModeProvider>
      </ThemeProvider>
      <Analytics />
    </BrowserRouter>
  </React.StrictMode>
);
