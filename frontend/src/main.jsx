import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { store } from "./app/store.js";
import ErrorBoundary from "./components/feedback/ErrorBoundary.jsx";
import "./index.css";

// Mock data now routes through `mocks/dispatcher.js` (in-process, no
// service worker). There is no MSW bootstrap step; the RTK Query slice
// talks to the dispatcher directly. When swapping to the real Django
// backend, set VITE_USE_MOCKS=false and change `apiSlice.js` to use
// `fetchBaseQuery` -- this file doesn't need to change.
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
