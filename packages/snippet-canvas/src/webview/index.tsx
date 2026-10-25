import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-600.css";
import "@fontsource/fira-code/latin-400.css";
import "@fontsource/source-code-pro/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/roboto-mono/latin-400.css";
import "@fontsource/space-mono/latin-400.css";
import { VSCodeProvider } from "./context/vscode/VSCodeContext";
import "./theme.css";
import "./styles.css";
import "./controls.css";
import "./snippet-syntax-theme.css";
import "./interactions.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <VSCodeProvider>
      <App />
    </VSCodeProvider>
  </React.StrictMode>,
);
