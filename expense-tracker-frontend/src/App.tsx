import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import Dashboard from "./pages/user/Dashboard";
import RecordPage from "./pages/user/RecordPage";
import History from "./pages/user/History";
import Analytics from "./pages/user/Analytics";
import LayoutSkeleton from "./pages/LayoutSkeleton";
import CategoryManagement from "./pages/user/CategoryManagement";
import AccountManagement from "./pages/user/AccountManagement";
import { Toaster } from "react-hot-toast";
import BudgetPage from "./pages/user/BudgetPage";
import LoanPage from "./pages/user/LoanPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUserPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "NAVIGATE") {
          // Lưu vào sessionStorage để sau login đọc lại
          sessionStorage.setItem("pendingRedirect", event.data.url);
        }
      });
    }
  }, []);
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "1rem",
            background: "#333",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "bold",
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />}></Route>
        <Route path="/loading" element={<LayoutSkeleton />}></Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/addExpense" element={<RecordPage />}></Route>
          <Route path="/history" element={<History />}></Route>
          <Route
            path="/categoryManager"
            element={<CategoryManagement />}
          ></Route>
          <Route path="/accountManager" element={<AccountManagement />}></Route>
          <Route path="/budget" element={<BudgetPage />}></Route>
          <Route path="/loan" element={<LoanPage />}></Route>
          <Route path="/analytics" element={<Analytics />}></Route>
        </Route>

        {/* Admin */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
