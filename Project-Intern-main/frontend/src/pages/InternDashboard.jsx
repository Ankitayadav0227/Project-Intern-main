import { useState, useEffect } from "react";
import InternSidebar from "../components/InternSidebar";
import InternNavbar from "../components/InternNavbar";
import api, { API_URL } from "../api";

function InternDashboard() {
  const intern = JSON.parse(localStorage.getItem("intern"));

  useEffect(() => {
    if (!intern) {
      window.location.href = "/";
    }
  }, []);

  const [form, setForm] = useState({
    intern_id: intern?.intern_id || "",
    work_date: "",
    task_title: "",
    description: "",
    hours_worked: "",
    file: null,
  });

  const [logs, setLogs] = useState([]);

  const [stats, setStats] = useState({
    totalLogs: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  const [editingId, setEditingId] = useState(null);

  const [editForm, setEditForm] = useState({
    work_date: "",
    task_title: "",
    description: "",
    hours_worked: "",
  });

  // ---------------- FETCH WORK LOGS ----------------
  const fetchLogs = async () => {
    if (!intern?.intern_id) return;

    try {
      const res = await api.get(
        `/worklogs/${intern.intern_id}`
      );

      setLogs(res.data.data || []);
    } catch (e) {
      console.error("FETCH LOGS ERROR:", e);
    }
  };

  // ---------------- FETCH SUMMARY ----------------
  const fetchSummary = async () => {
    if (!intern?.intern_id) return;

    try {
      const res = await api.get(
        `/intern-summary/${intern.intern_id}`
      );

      setStats(res.data);
    } catch (e) {
      console.error("FETCH SUMMARY ERROR:", e);
    }
  };

  useEffect(() => {
    if (intern) {
      fetchLogs();
      fetchSummary();
    }
  }, []);

  // ---------------- HANDLE INPUT ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  // ---------------- ADD WORK LOG ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const fd = new FormData();

      Object.keys(form).forEach((key) => {
        if (form[key] != null) {
          fd.append(key, form[key]);
        }
      });

      await api.post("/worklog", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Work log submitted successfully!");

      await fetchLogs();
      await fetchSummary();

      setForm({
        intern_id: intern.intern_id,
        work_date: "",
        task_title: "",
        description: "",
        hours_worked: "",
        file: null,
      });
    } catch (error) {
      console.error("SUBMIT WORK LOG ERROR:", error);

      alert(
        error.response?.data?.message ||
        "Failed to submit work log"
      );
    }
  };

  // ---------------- DELETE WORK LOG ----------------
  const deleteLog = async (id) => {
    if (!window.confirm("Are you sure you want to delete this work log?")) {
      return;
    }

    try {
      await api.delete(`/worklog/${id}`);

      alert("Work log deleted successfully!");

      await fetchLogs();
      await fetchSummary();
    } catch (error) {
      console.error("DELETE LOG ERROR:", error);

      alert(
        error.response?.data?.message ||
        "Failed to delete work log"
      );
    }
  };

  // ---------------- UPDATE WORK LOG ----------------
  const updateLog = async () => {
    try {
      await api.put(
        `/worklog/${editingId}`,
        editForm
      );

      alert("Work log updated successfully!");

      setEditingId(null);

      await fetchLogs();
      await fetchSummary();
    } catch (error) {
      console.error("UPDATE LOG ERROR:", error);

      alert(
        error.response?.data?.message ||
        "Failed to update work log"
      );
    }
  };

  // ---------------- LOGOUT ----------------
  const logout = () => {
    localStorage.removeItem("intern");
    window.location.href = "/";
  };

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

        <div className="p-4"></div>

        <div className="container-fluid bg-light min-vh-100 p-4">

          {/* HEADER */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold">
                Welcome, {intern?.full_name}
              </h2>

              <p className="text-muted mb-0">
                Track work logs and progress
              </p>
            </div>

            <button
              className="btn btn-danger"
              onClick={logout}
            >
              Logout
            </button>
          </div>

          {/* STATISTICS */}
          <div className="row mb-4">

            {/* TOTAL */}
            <div className="col-lg-3 col-md-6 mb-3">
              <div
                className="card border-0 shadow-lg text-white"
                style={{
                  backgroundColor: "rgb(2,26,77)",
                }}
              >
                <div className="card-body">
                  <h6>Total Logs</h6>
                  <h2>{stats.totalLogs}</h2>
                </div>
              </div>
            </div>

            {/* APPROVED */}
            <div className="col-lg-3 col-md-6 mb-3">
              <div className="card border-0 shadow-lg bg-success text-white">
                <div className="card-body">
                  <h6>Approved</h6>
                  <h2>{stats.approved}</h2>
                </div>
              </div>
            </div>

            {/* PENDING */}
            <div className="col-lg-3 col-md-6 mb-3">
              <div className="card border-0 shadow-lg bg-warning">
                <div className="card-body">
                  <h6>Pending</h6>
                  <h2>{stats.pending}</h2>
                </div>
              </div>
            </div>

            {/* REJECTED */}
            <div className="col-lg-3 col-md-6 mb-3">
              <div className="card border-0 shadow-lg bg-danger text-white">
                <div className="card-body">
                  <h6>Rejected</h6>
                  <h2>{stats.rejected}</h2>
                </div>
              </div>
            </div>

          </div>

          {/* ADD WORK LOG */}
          <div className="card border-0 shadow-lg mb-4">

            <div
              className="card-header text-white"
              style={{
                backgroundColor: "rgb(2,26,77)",
              }}
            >
              <h4 className="mb-0">
                Add Daily Work Log
              </h4>
            </div>

            <div className="card-body">

              <form onSubmit={handleSubmit}>

                <div className="row">

                  {/* DATE */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Work Date
                    </label>

                    <input
                      type="date"
                      name="work_date"
                      className="form-control"
                      value={form.work_date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* HOURS */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Hours Worked
                    </label>

                    <input
                      type="number"
                      step="0.5"
                      name="hours_worked"
                      className="form-control"
                      value={form.hours_worked}
                      onChange={handleChange}
                      required
                    />
                  </div>

                </div>

                {/* TASK TITLE */}
                <div className="mb-3">
                  <label className="form-label">
                    Task Title
                  </label>

                  <input
                    type="text"
                    name="task_title"
                    className="form-control"
                    placeholder="Enter task title"
                    value={form.task_title}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* DESCRIPTION */}
                <div className="mb-3">
                  <label className="form-label">
                    Description
                  </label>

                  <textarea
                    name="description"
                    rows="4"
                    className="form-control"
                    placeholder="Describe today's work..."
                    value={form.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* FILE */}
                <div className="mb-3">
                  <label className="form-label">
                    Upload File
                  </label>

                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        file: e.target.files[0],
                      })
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-success px-4"
                >
                  Submit Work Log
                </button>

              </form>

            </div>
          </div>

          {/* EDIT WORK LOG */}
          {editingId && (
            <div className="card border-0 shadow-lg mb-4">

              <div className="card-header bg-warning">
                <h5 className="mb-0">
                  Edit Work Log
                </h5>
              </div>

              <div className="card-body">

                <input
                  type="date"
                  className="form-control mb-3"
                  value={editForm.work_date}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      work_date: e.target.value,
                    })
                  }
                />

                <input
                  type="text"
                  className="form-control mb-3"
                  value={editForm.task_title}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      task_title: e.target.value,
                    })
                  }
                />

                <textarea
                  className="form-control mb-3"
                  rows="4"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      description: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  className="form-control mb-3"
                  value={editForm.hours_worked}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      hours_worked: e.target.value,
                    })
                  }
                />

                <button
                  className="btn btn-primary me-2"
                  onClick={updateLog}
                >
                  Save Changes
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </button>

              </div>
            </div>
          )}

          {/* WORK LOG TABLE */}
          <div className="card border-0 shadow-lg">

            <div className="card-header bg-dark text-white">
              <h4 className="mb-0">
                My Work Logs
              </h4>
            </div>

            <div className="card-body">

              <div className="table-responsive">

                <table className="table table-hover align-middle">

                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Task</th>
                      <th>Hours</th>
                      <th>Status</th>
                      <th>File</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>

                    {logs.length > 0 ? (

                      logs.map((log) => (

                        <tr key={log.log_id}>

                          <td>
                            {log.work_date}
                          </td>

                          <td>
                            {log.task_title}
                          </td>

                          <td>
                            {log.hours_worked}
                          </td>

                          <td>
                            <span
                              className={`badge ${
                                log.status === "Approved"
                                  ? "bg-success"
                                  : log.status === "Rejected"
                                  ? "bg-danger"
                                  : "bg-warning text-dark"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>

                          {/* FILE */}
                          <td>
                            {log.file_name ? (

                              <a
                                href={`${API_URL}/uploads/${log.file_name}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-outline-info btn-sm"
                              >
                                View File
                              </a>

                            ) : (

                              <span className="text-muted">
                                No File
                              </span>

                            )}
                          </td>

                          {/* ACTIONS */}
                          <td>

                            {log.status === "Pending" ? (

                              <>

                                <button
                                  className="btn btn-outline-primary btn-sm me-2"
                                  onClick={() => {

                                    setEditingId(log.log_id);

                                    setEditForm({
                                      work_date: String(
                                        log.work_date
                                      ).split("T")[0],

                                      task_title:
                                        log.task_title,

                                      description:
                                        log.description,

                                      hours_worked:
                                        log.hours_worked,
                                    });

                                  }}
                                >
                                  Edit
                                </button>

                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() =>
                                    deleteLog(log.log_id)
                                  }
                                >
                                  Delete
                                </button>

                              </>

                            ) : (

                              <span className="badge bg-secondary">
                                Locked
                              </span>

                            )}

                          </td>

                        </tr>

                      ))

                    ) : (

                      <tr>

                        <td
                          colSpan="6"
                          className="text-center"
                        >
                          No work logs found.
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

export default InternDashboard;