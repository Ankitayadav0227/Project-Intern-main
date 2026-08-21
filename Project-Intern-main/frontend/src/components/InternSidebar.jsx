import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  FaHome,
  FaPlaneDeparture,
  FaUser,
  FaSignOutAlt,
  FaBars,
  FaComments,
} from "react-icons/fa";

function InternSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    {
      name: "Dashboard",
      icon: <FaHome />,
      link: "/intern",
    },
    {
      name: "Leave Planner",
      icon: <FaPlaneDeparture />,
      link: "/intern/leave",
    },
    {
      name: "Profile",
      icon: <FaUser />,
      link: "/intern/profile",
    },
    {
      name: "Messages",
      icon: <FaComments />,
      link: "/intern/messages",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("intern");
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
      {/* Toggle Button */}
      <div
        style={{
          position: "absolute",
          top: "15px",
          right: collapsed ? "18px" : "15px",
          zIndex: 10,
        }}
      >
        <button
          className="btn btn-sm btn-light"
          onClick={() => setCollapsed(!collapsed)}
        >
          <FaBars />
        </button>
      </div>

      {/* Logo */}
      <div
        className="text-center py-4 border-bottom"
        style={{
          borderColor: "#475569",
        }}
      >
        <h3 className="fw-bold mb-1">MB</h3>

        {!collapsed && (
          <small className="text-light">
            Midbrains Technologies
          </small>
        )}
      </div>

      {/* Menu */}
      <div className="p-3">
        {menu.map((item) => {
          const isActive = location.pathname === item.link;

          return (
            <button
              key={item.name}
              className="btn w-100 text-start mb-2"
              style={{
                color: "white",
                borderRadius: "12px",
                padding: "12px",
                background: isActive
                  ? "#334155"
                  : "transparent",
                border: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#334155";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isActive
                  ? "#334155"
                  : "transparent";
              }}
              onClick={() => navigate(item.link)}
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
          );
        })}
      </div>

      {/* Logout */}
      <div
        className="p-3"
        style={{
          position: "absolute",
          bottom: "20px",
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

export default InternSidebar;