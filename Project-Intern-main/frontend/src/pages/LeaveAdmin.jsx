import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../api";

function LeaveAdmin() {
  const [leaves, setLeaves] = useState([]);

  // ---------------- FETCH LEAVES ----------------
  const fetchLeaves = async () => {
    try {
      const res = await api.get("/leave");

      setLeaves(res.data.data || []);
    } catch (err) {
      console.error("FETCH LEAVES ERROR:", err);

      alert(
        err.response?.data?.message ||
          "Unable to load leave requests"
      );
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // ---------------- APPROVE LEAVE ----------------
  const approveLeave = async (id) => {
    try {
      const res = await api.put(
        `/leave/approve/${id}`
      );

      alert(
        res.data.message ||
          "Leave approved successfully!"
      );

      fetchLeaves();
    } catch (err) {
      console.error("APPROVE LEAVE ERROR:", err);

      alert(
        err.response?.data?.message ||
          "Unable to approve leave"
      );
    }
  };

  // ---------------- REJECT LEAVE ----------------
  const rejectLeave = async (id) => {
    try {
      const res = await api.put(
        `/leave/reject/${id}`
      );

      alert(
        res.data.message ||
          "Leave rejected successfully!"
      );

      fetchLeaves();
    } catch (err) {
      console.error("REJECT LEAVE ERROR:", err);

      alert(
        err.response?.data?.message ||
          "Unable to reject leave"
      );
    }
  };

  return (
    <AdminLayout>

      <div className="container mt-4">

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-4">

          <h2>Leave Requests</h2>

          <button
            className="btn"
            style={{
              backgroundColor: "rgb(2,26,77)",
              color: "white",
              border: "none",
            }}
            onClick={() =>
              (window.location.href = "/admin")
            }
          >
            Back to Dashboard
          </button>

        </div>

        {/* LEAVE CARD */}
        <div className="card shadow">

          <div
            className="card-header text-white"
            style={{
              backgroundColor: "rgb(2,26,77)",
            }}
          >
            <h4 className="mb-0">
              All Leave Requests
            </h4>
          </div>

          <div className="card-body">

            <div className="table-responsive">

              <table className="table table-bordered table-hover">

                <thead className="table-dark">

                  <tr>
                    <th>Intern</th>
                    <th>Department</th>
                    <th>From Date</th>
                    <th>To Date</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>

                </thead>

                <tbody>

                  {leaves.length > 0 ? (

                    leaves.map((leave) => (

                      <tr key={leave.leave_id}>

                        {/* INTERN */}
                        <td>
                          {leave.full_name}
                        </td>

                        {/* DEPARTMENT */}
                        <td>
                          {leave.department}
                        </td>

                        {/* FROM DATE */}
                        <td>
                          {leave.from_date}
                        </td>

                        {/* TO DATE */}
                        <td>
                          {leave.to_date}
                        </td>

                        {/* REASON */}
                        <td>
                          {leave.reason}
                        </td>

                        {/* STATUS */}
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

                        {/* ACTIONS */}
                        <td>

                          {leave.status === "Pending" ? (

                            <>

                              <button
                                className="btn btn-success btn-sm me-2"
                                onClick={() =>
                                  approveLeave(
                                    leave.leave_id
                                  )
                                }
                              >
                                Approve
                              </button>

                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() =>
                                  rejectLeave(
                                    leave.leave_id
                                  )
                                }
                              >
                                Reject
                              </button>

                            </>

                          ) : (

                            <span className="text-muted">
                              Completed
                            </span>

                          )}

                        </td>

                      </tr>

                    ))

                  ) : (

                    <tr>

                      <td
                        colSpan="7"
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

    </AdminLayout>
  );
}

export default LeaveAdmin;