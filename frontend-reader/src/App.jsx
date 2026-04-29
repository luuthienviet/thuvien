import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import BookDetail from "./pages/BookDetail";
import MyBorrows from "./pages/MyBorrows";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import Categories from "./pages/Categories";
import Rules from "./pages/Rules";

import SpringEffect from "./components/SpringEffect";

/* =======================
   Route bảo vệ đăng nhập
======================= */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

/* =======================
   Khai báo routes
======================= */
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <Register />}
      />

      {/* ✅ TRANG CÔNG KHAI - KHÔNG CẦN ĐĂNG NHẬP */}
      <Route path="/" element={<Home />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/rules" element={<Rules />} />

      {/* 🔒 CÁC TRANG CẦN ĐĂNG NHẬP */}
      <Route
        path="/books/:id"
        element={
          <PrivateRoute>
            <BookDetail />
          </PrivateRoute>
        }
      />

      <Route
        path="/my-borrows"
        element={
          <PrivateRoute>
            <MyBorrows />
          </PrivateRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />

      <Route
        path="/subscription"
        element={
          <PrivateRoute>
            <Subscription />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* =======================
   App chính
======================= */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* 🌸 HIỆU ỨNG ĐỘNG TOÀN WEBSITE */}
        <SpringEffect />

        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;