import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Menu from "./pages/Menu.jsx";
import Cart from "./pages/Cart.jsx";
import Receipt from "./pages/Receipt.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

export default function App() {
  return (
    <Routes>
      {/* Customer ordering flow */}
      <Route path="/" element={<Landing />} />
      <Route path="/order/:tableNumber" element={<Menu />} />
      <Route path="/order/:tableNumber/cart" element={<Cart />} />
      <Route path="/order/:tableNumber/receipt/:orderId" element={<Receipt />} />

      {/* Admin / kitchen dashboard */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />

      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
