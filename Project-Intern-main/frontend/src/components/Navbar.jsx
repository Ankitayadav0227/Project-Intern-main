import { useLocation } from "react-router-dom";
import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import logo from "../assets/midbrains_technologies_logo.jpg";

function Navbar() {
  const location = useLocation();

  const [showCalendar, setShowCalendar] = useState(false);
  const [date, setDate] = useState(new Date());

  const pageTitles = {
    "/admin": "Admin Dashboard",
    "/ManageInterns": "Manage Interns",
    "/attendance": "Absence Record",
    "/leave": "Leave Management",
    "/analytics": "Analytics Dashboard"
  };

  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="bg-white shadow-sm px-4 py-3 d-flex justify-content-between align-items-center position-relative">
      <div className="d-flex flex-column">
  {location.pathname === "/admin" ? (
    <img
      src={logo}
      alt="Midbrains Logo"
      style={{
        height: "55px",
        width: "auto"
      }}
    />
  ) : (
    <h4 className="mb-0 fw-bold">
      {pageTitles[location.pathname] || "Dashboard"}
    </h4>
  )}

  <small className="text-muted mt-1">
    Welcome Back Admin
  </small>
</div>
      <div>
        <div className="text-end">
          <small className="text-muted d-block">
            📅 Today
          </small>

          <span
            className="fw-semibold"
            style={{ cursor: "pointer" }}
            onClick={() => setShowCalendar(!showCalendar)}
          >
            {currentDate}
          </span>
        </div>

        {showCalendar && (
          <div
            className="position-absolute bg-white shadow rounded p-3"
            style={{
              top: "75px",
              right: "20px",
              zIndex: 1000
            }}
          >
            <Calendar
              onChange={setDate}
              value={date}
            />

            <div className="mt-3">
              <input
                type="text"
                className="form-control"
                placeholder="Add event/reminder"
              />

              <button className="btn btn-primary btn-sm mt-2">
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Navbar;