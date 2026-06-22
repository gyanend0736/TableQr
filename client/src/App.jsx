import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Menu from "./pages/Menu.jsx";
import Cart from "./pages/Cart.jsx";
import Receipt from "./pages/Receipt.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/order/:tableNumber" element={<Menu />} />
      <Route path="/order/:tableNumber/cart" element={<Cart />} />
      <Route path="/order/:tableNumber/receipt/:orderId" element={<Receipt />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
