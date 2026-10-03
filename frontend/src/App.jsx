import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import ShopPage from "./features/shop/ShopPage";
import RootRoute from "./routes/RootRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/shop" element={<ShopPage />} />

      {/* Everything else redirects home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}