import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { FirebaseAuthProvider } from "./auth/FirebaseAuthContext";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <FirebaseAuthProvider>
      <App />
    </FirebaseAuthProvider>
  </React.StrictMode>
);
