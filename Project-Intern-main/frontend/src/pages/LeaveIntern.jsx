import { useEffect, useState } from "react";
import InternSidebar from "../components/InternSidebar";
import InternNavbar from "../components/InternNavbar";
import api from "../api";

function LeaveIntern() {
  const internData = localStorage.getItem("intern");
  const intern = internData ? JSON.parse(internData) : null;

  // ---------------- FORM STATE ----------------
  const [form, setForm] = useState({
    intern_id: intern?.intern_id || "",
    from_date: "",
    to_date: "",
    reason: "",
  });

  // ---------------- LEAVE STATE ----------------
  const [leaves, setLeaves] = useState([]);

  // ---------------- LOGIN CHECK ----------------
  useEffect(() => {
    if (!intern) {
      window.location.href = "/login";
    }
  }, [intern]);

  // ---------------- FETCH LEAVE HISTORY ----------------
  const fetchLeaves = async () => {
    if (!intern?.intern_id) return;

    try {
      const res = await api.get(
        `/leave/${intern.intern_id}`
      );

      setLeaves(res.data.data || []);
    } catch (err) {
      console.error("FETCH LEAVES ERROR:", err);

      alert(
        err.response?.data?.message ||
          "Unable to load leave history"
      );
    }
  };

  useEffect(() => {
    if (intern) {
      fetchLeaves();
    }
  }, []);

  // ---------------- HANDLE FORM ----------------
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ---------------- APPLY LEAVE ----------------
  const applyLeave = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post(
        "/leave",
        form
      );

      alert(
        res.data.message ||
          "Leave applied successfully!"
      );

      setForm({
        intern_id: intern.intern_id,
        from_date: "",
        to_date: "",
        reason: "",
      });

      fetchLeaves();

    } catch (err) {
      console.error("APPLY LEAVE ERROR:", err);

      alert(
        err.response?.data?.message ||
          "Unable to apply leave"
      );
    }
  };

  // If not logged in, don't render
  if (!intern) return null;

  return (
    <div className="d-flex">

      <InternSidebar />

      <div
        style={{
          flex: 1,
          background: "#F8FAFC",
          minHeight: "100vh",
        }}
      >

        <InternNavbar />

        <div className="container mt-4">

          <h2>Leave Planner</h2>

          {/* APPLY LEAVE */}
          <div className="card shadow p-4 mb-4">

            <h4>Apply for Leave</h4>

            <form onSubmit={applyLeave}>

              {/* FROM DATE */}
              <input
                type="date"
                name="from_date"
                className="form-control mb-3"
                value={form.from_date}
                onChange={handleChange}
                required
              />

              {/* TO DATE */}
              <input
                type="date"
                name="to_date"
                className="form-control mb-3"
                value={form.to_date}
                onChange={handleChange}
                required
              />

              {/* REASON */}
              <textarea
                name="reason"
                className="form-control mb-3"
                placeholder="Reason for Leave"
                value={form.reason}
                onChange={handleChange}
                required
              />

              <button
                type="submit"
                className="btn btn-success"
              >
                Apply Leave
              </button>

            </form>

          </div>

          {/* LEAVE HISTORY */}
          <div className="card shadow">

            <div
              className="card-header text-white"
              style={{
                backgroundColor: "rgb(2,26,77)",
              }}
            >
              <h4 className="mb-0">
                My Leave Requests
              </h4>
            </div>

            <div className="card-body">

              <div className="table-responsive">

                <table className="table table-bordered table-hover">

                  <thead className="table-dark">

                    <tr>
                      <th>From</th>
                      <th>To</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>

                  </thead>

                  <tbody>

                    {leaves.length > 0 ? (

                      leaves.map((leave) => (

                        <tr key={leave.leave_id}>

                          <td>
                            {leave.from_date}
                          </td>

                          <td>
                            {leave.to_date}
                          </td>

                          <td>
                            {leave.reason}
                          </td>

                          <td>

                            {leave.status === "Approved" ? (

                              <span className="badge bg-success">
                                Approved
                              </span>

                            ) : leave.status === "Rejected" ? (

                              <span className="badge bg-danger">
                                Rejected
                              </span>

                            ) : (

                              <span className="badge bg-warning text-dark">
                                Pending
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
                          No Leave Requests Found
                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default LeaveIntern;