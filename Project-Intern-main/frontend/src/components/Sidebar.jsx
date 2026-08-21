import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaHome,
  FaUsers,
  FaCalendarCheck,
  FaPlaneDeparture,
  FaChartBar,
  FaComments,
  FaSignOutAlt,
  FaBars,
} from "react-icons/fa";

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const menu = [
    {
      name: "Dashboard",
      icon: <FaHome />,
      link: "/admin",
    },
    {
      name: "Manage Interns",
      icon: <FaUsers />,
      link: "/manage-interns",
    },
    {
      name: "Attendance",
      icon: <FaCalendarCheck />,
      link: "/attendance",
    },
    {
      name: "Leave",
      icon: <FaPlaneDeparture />,
      link: "/leave",
    },
    {
      name: "Analytics",
      icon: <FaChartBar />,
      link: "/analytics",
    },
    {
      name: "Messages",
      icon: <FaComments />,
      link: "/admin/messages",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("admin");
    navigate("/");
  };

  return (
    <div
      style={{
        width: collapsed ? "80px" : "260px",
        minHeight: "100vh",
        background: "#1E293B",
        color: "white",
        transition: "0.3s",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* ============================= */}
      {/* Toggle Button */}
      {/* ============================= */}

      <div
        className="d-flex justify-content-end p-2"
        style={{
          height: "50px",
        }}
      >
        <button
          className="btn btn-sm btn-light"
          onClick={() => setCollapsed(!collapsed)}
          style={{
            width: "40px",
            height: "35px",
            borderRadius: "8px",
          }}
        >
          <FaBars />
        </button>
      </div>

      {/* ============================= */}
      {/* Logo */}
      {/* ============================= */}

      <div className="text-center py-3 border-bottom">
        <h3 className="fw-bold mb-1">MB</h3>

        {!collapsed && (
          <small className="text-light">
            Midbrains Technologies
          </small>
        )}
      </div>

      {/* ============================= */}
      {/* Menu */}
      {/* ============================= */}

      <div className="p-3">
        {menu.map((item) => (
          <button
            key={item.name}
            className="btn w-100 text-start mb-2"
            style={{
              color: "white",
              borderRadius: "12px",
              padding: "12px",
              background: "transparent",
              border: "none",
              transition: "0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#334155";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            onClick={() => navigate(item.link)}
            title={collapsed ? item.name : ""}
          >
            <span
              className={collapsed ? "" : "me-3"}
              style={{
                fontSize: "18px",
              }}
            >
              {item.icon}
            </span>

            {!collapsed && item.name}
          </button>
        ))}
      </div>

      {/* ============================= */}
      {/* Logout */}
      {/* ============================= */}

      <div
        className="p-3"
        style={{
          position: "absolute",
          bottom: 20,
          left: 0,
          width: "100%",
        }}
      >
        <button
          className="btn btn-danger w-100"
          onClick={handleLogout}
          style={{
            borderRadius: "10px",
            padding: "10px",
          }}
          title={collapsed ? "Logout" : ""}
        >
          <FaSignOutAlt />

          {!collapsed && (
            <span className="ms-2">
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;