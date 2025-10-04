import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { DesignSystemProvider } from "./context/DesignSystemProvider";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <DesignSystemProvider>
      <App />
    </DesignSystemProvider>
  </React.StrictMode>
);
