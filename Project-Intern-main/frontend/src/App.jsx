import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ================= AUTH =================
import Login from "./pages/login";
import InternSignup from "./pages/InternSignup";

// ================= ADMIN =================
import AdminDashboard from "./pages/AdminDashboard";
import ManageInterns from "./pages/ManageInterns";
import AttendanceAdmin from "./pages/AttendanceAdmin";
import LeaveAdmin from "./pages/LeaveAdmin";
import Analytics from "./pages/Analytics";

// ================= INTERN =================
import InternDashboard from "./pages/InternDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* FIRST PAGE = REGISTER */}
        <Route
          path="/"
          element={<Navigate to="/register" replace />}
        />

        {/* REGISTER */}
        <Route
          path="/register"
          element={<InternSignup />}
        />

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* ================= ADMIN ================= */}

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        <Route
          path="/ManageInterns"
          element={<ManageInterns />}
        />

        <Route
          path="/attendance"
          element={<AttendanceAdmin />}
        />

        <Route
          path="/leave"
          element={<LeaveAdmin />}
        />

        <Route
          path="/Analytics"
          element={<Analytics />}
        />

        {/* ================= INTERN ================= */}

        <Route
          path="/intern"
          element={<InternDashboard />}
        />

        {/* INVALID URL */}
        <Route
          path="*"
          element={<Navigate to="/register" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;