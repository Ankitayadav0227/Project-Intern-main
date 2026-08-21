import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../api";

function AttendanceAdmin() {
  const [attendance, setAttendance] = useState([]);
  const [interns, setInterns] = useState([]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    intern_id: "",
    attendance_date: "",
    status: "Present",
  });

  // ---------------- FETCH ATTENDANCE ----------------
  const fetchAttendance = async () => {
    try {
      const res = await api.get("/attendance");

      setAttendance(res.data.data || []);
    } catch (err) {
      console.error("FETCH ATTENDANCE ERROR:", err);
    }
  };

  // ---------------- FETCH INTERNS ----------------
  const fetchInterns = async () => {
    try {
      const res = await api.get("/interns");

      setInterns(res.data.data || []);
    } catch (err) {
      console.error("FETCH INTERNS ERROR:", err);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchInterns();
  }, []);

  // ---------------- HANDLE FORM CHANGE ----------------
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ---------------- MARK ATTENDANCE ----------------
  const markAttendance = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/attendance", form);

      alert(res.data.message || "Attendance marked successfully!");

      setForm({
        intern_id: "",
        attendance_date: "",
        status: "Present",
      });

      fetchAttendance();
    } catch (err) {
      console.error("MARK ATTENDANCE ERROR:", err);

      alert(
        err.response?.data?.message ||
          "Unable to mark attendance"
      );
    }
  };

  // ---------------- SEARCH ----------------
  const filteredAttendance = attendance.filter(
    (item) =>
      item.full_name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      item.department
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="container mt-4">

        <h2>Attendance Record</h2>

        {/* MARK ATTENDANCE */}
        <div className="card shadow p-4 mb-4">

          <h4>Mark Attendance</h4>

          <form onSubmit={markAttendance}>

            {/* SELECT INTERN */}
            <select
              name="intern_id"
              className="form-control mb-3"
              value={form.intern_id}
              onChange={handleChange}
              required
            >
              <option value="">
                Select Intern
              </option>

              {interns.map((intern) => (
                <option
                  key={intern.intern_id}
                  value={intern.intern_id}
                >
                  {intern.full_name}
                </option>
              ))}
            </select>

            {/* DATE */}
            <input
              type="date"
              name="attendance_date"
              className="form-control mb-3"
              value={form.attendance_date}
              onChange={handleChange}
              required
            />

            {/* STATUS */}
            <select
              name="status"
              className="form-control mb-3"
              value={form.status}
              onChange={handleChange}
            >
              <option value="Present">
                Present
              </option>

              <option value="Absent">
                Absent
              </option>
            </select>

            <button
              type="submit"
              className="btn btn-success"
            >
              Mark Attendance
            </button>

          </form>
        </div>

        {/* ATTENDANCE RECORDS */}
        <div className="card shadow">

          <div className="card-header">
            <h4>Attendance Records</h4>
          </div>

          <div className="card-body">

            {/* SEARCH */}
            <div className="d-flex justify-content-between align-items-center mb-3">

              <h2 className="mb-0">
                Manage Attendance
              </h2>

              <input
                type="text"
                placeholder="Search Intern..."
                className="form-control"
                style={{ width: "300px" }}
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

            {/* TABLE */}
            <div className="table-responsive">

              <table className="table table-hover align-middle shadow rounded overflow-hidden">

                <thead
                  className="text-white"
                  style={{ background: "#2563EB" }}
                >
                  <tr>
                    <th>Intern</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredAttendance.length > 0 ? (

                    filteredAttendance.map((item) => (

                      <tr key={item.attendance_id}>

                        <td>
                          {item.full_name}
                        </td>

                        <td>
                          {item.department}
                        </td>

                        <td>
                          {item.attendance_date}
                        </td>

                        <td>

                          {item.status === "Present" ? (

                            <span className="badge bg-success">
                              Present
                            </span>

                          ) : (

                            <span className="badge bg-danger">
                              Absent
                            </span>

                          )}

                        </td>

                      </tr>

                    ))

                  ) : (

                    <tr>

                      <td
                        colSpan="4"
                        className="text-center"
                      >
                        No Attendance Records Found
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </div>
        </div>

      </div>
    </AdminLayout>
  );
}

export default AttendanceAdmin;