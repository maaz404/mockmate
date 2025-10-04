import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// Install global axios request id interceptor (adds X-Request-Id headers)
import "./services/axiosRequestId";
import { DesignSystemProvider } from "./context/DesignSystemProvider";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <DesignSystemProvider>
      <App />
    </DesignSystemProvider>
  </React.StrictMode>
);
