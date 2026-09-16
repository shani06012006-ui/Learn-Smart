import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { store } from "./app/store.js";
import ErrorBoundary from "./components/feedback/ErrorBoundary.jsx";
import "./index.css";

// The ONLY place VITE_USE_MOCKS is read. Everything else (RTK Query slices,
// components) is written exactly as it will be against the real backend --
// this function is the single seam that gets removed later.
async function enableMocksIfNeeded() {
  if (import.meta.env.VITE_USE_MOCKS !== "true") return;

  const { worker } = await import("./mocks/browser.js");
  await worker.start({
    onUnhandledRequest: "bypass", // let non-API requests (fonts, vite HMR) through untouched
  });
}

enableMocksIfNeeded().then(() => {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <ErrorBoundary>
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      </ErrorBoundary>
    </StrictMode>
  );
});
