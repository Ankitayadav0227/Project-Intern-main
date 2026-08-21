import InternSidebar from "../components/InternSidebar";
import InternNavbar from "../components/InternNavbar";

function InternLayout({ children }) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f5f7fa",
      }}
    >
      {/* Sidebar */}
      <InternSidebar />

      {/* Right Side */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Navbar */}
        <InternNavbar />

        {/* Page Content */}
        <main
          style={{
            flex: 1,
            padding: "20px",
            overflowX: "hidden",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default InternLayout;