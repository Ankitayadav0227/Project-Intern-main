import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function AdminLayout({ children }) {
  return (
    <div
      className="d-flex"
      style={{
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {/* Admin Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          background: "#F8FAFC",
          minHeight: "100vh",
          overflowX: "hidden",
        }}
      >
        {/* Admin Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;