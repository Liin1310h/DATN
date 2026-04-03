import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import Dashboard from "./pages/user/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import RecordPage from "./pages/user/RecordPage";
import History from "./pages/user/History";
import Analytics from "./pages/user/Analytics";
import LayoutSkeleton from "./pages/LayoutSkeleton";
import CategoryManagement from "./pages/user/CategoryManagement";
import AccountManagement from "./pages/user/AccountManagement";
import { Toaster } from "react-hot-toast";

function App() {
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
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/addExpense" element={<RecordPage />}></Route>
        <Route path="/history" element={<History />}></Route>
        <Route path="/categoryManager" element={<CategoryManagement />}></Route>
        <Route path="/accountManager" element={<AccountManagement />}></Route>
        <Route path="/analytics" element={<Analytics />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
