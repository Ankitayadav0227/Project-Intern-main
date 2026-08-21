import { useEffect, useState } from "react";
import api from "../api";
import DashboardCard from "../components/Dashboardcard";
import AdminLayout from "../layouts/AdminLayout";

function AdminDashboard() {
  const admin = JSON.parse(localStorage.getItem("admin"));

  const [logs, setLogs] = useState([]);

  const [summary, setSummary] = useState({
    totalInterns: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    if (!admin) {
      window.location.href = "/";
      return;
    }

    fetchLogs();
    fetchSummary();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get("/all-worklogs");
      setLogs(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get("/dashboard-summary");
      setSummary(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const approveLog = async (id) => {
    try {
      await api.put(`/approve/${id}`);

      alert("Work Log Approved");

      fetchLogs();
      fetchSummary();
    } catch (err) {
      console.log(err);
      alert("Failed to approve work log");
    }
  };

  const rejectLog = async (id) => {
    try {
      await api.put(`/reject/${id}`);

      alert("Work Log Rejected");

      fetchLogs();
      fetchSummary();
    } catch (err) {
      console.log(err);
      alert("Failed to reject work log");
    }
  };

  const logout = () => {
    localStorage.removeItem("admin");
    window.location.href = "/";
  };

  return (
    <AdminLayout>
      <h2 className="mb-4">Dashboard</h2>

      <div className="row">
        <DashboardCard
          title="Interns"
          value={summary.totalInterns}
          color="custom-blue"
          icon="bi bi-people-fill"
        />

        <DashboardCard
          title="Pending"
          value={summary.pending}
          color="bg-warning"
          icon="bi bi-clock-history"
        />

        <DashboardCard
          title="Approved"
          value={summary.approved}
          color="bg-success"
          icon="bi bi-check-circle-fill"
        />

        <DashboardCard
          title="Rejected"
          value={summary.rejected}
          color="bg-danger"
          icon="bi bi-x-circle-fill"
        />
      </div>

      <div className="card border-0 shadow-lg mt-4" style={{ borderRadius: "18px" }}>
        <div
          className="card-header"
          style={{
            background: "rgb(2,26,77)",
            color: "white",
          }}
        >
          <h4 className="mb-0">Recent Work Logs</h4>
        </div>

        <div className="card-body">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Intern</th>
                <th>Task</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.log_id}>
                    <td>{log.full_name}</td>
                    <td>{log.task_title}</td>
                    <td>{log.hours_worked}</td>

                    <td>
                      {log.status === "Pending" && (
                        <span className="badge bg-warning text-dark">
                          Pending
                        </span>
                      )}

                      {log.status === "Approved" && (
                        <span className="badge bg-success">
                          Approved
                        </span>
                      )}

                      {log.status === "Rejected" && (
                        <span className="badge bg-danger">
                          Rejected
                        </span>
                      )}
                    </td>

                    <td>
                      {log.status === "Pending" ? (
                        <>
                          <button
                            className="btn btn-success btn-sm me-2"
                            onClick={() => approveLog(log.log_id)}
                          >
                            Approve
                          </button>

                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => rejectLog(log.log_id)}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">
                    No Work Logs Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;