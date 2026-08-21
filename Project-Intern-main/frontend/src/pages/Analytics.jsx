import AdminLayout from "../layouts/AdminLayout";
import { useEffect, useState } from "react";
import api from "../api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import {
  Bar,
  Pie,
  Line,
  Doughnut,
} from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Analytics() {

  // ---------------- ANALYTICS STATE ----------------

  const [analytics, setAnalytics] = useState({
    worklogs: [],
    departments: [],
    attendance: [],
    leaves: [],
    topInterns: [],
  });

  const [loading, setLoading] = useState(true);

  // ---------------- FETCH ANALYTICS ----------------

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const res = await api.get("/analytics");

      setAnalytics({
        worklogs: res.data.worklogs || [],
        departments: res.data.departments || [],
        attendance: res.data.attendance || [],
        leaves: res.data.leaves || [],
        topInterns: res.data.topInterns || [],
      });

    } catch (err) {
      console.error(
        "FETCH ANALYTICS ERROR:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to load analytics"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // ---------------- WORK LOG DATA ----------------

  const workLogData = {
    labels: analytics.worklogs.map(
      (item) => item.status
    ),

    datasets: [
      {
        label: "Work Logs",

        data: analytics.worklogs.map(
          (item) => item.total
        ),

        backgroundColor: [
          "#28a745",
          "#ffc107",
          "#dc3545",
        ],
      },
    ],
  };

  // ---------------- DEPARTMENT DATA ----------------

  const departmentData = {
    labels: analytics.departments.map(
      (item) => item.department
    ),

    datasets: [
      {
        data: analytics.departments.map(
          (item) => item.total
        ),

        backgroundColor: [
          "#007bff",
          "#28a745",
          "#ffc107",
          "#dc3545",
          "#6610f2",
          "#20c997",
        ],
      },
    ],
  };

  // ---------------- ATTENDANCE DATA ----------------

  const attendanceData = {
    labels: analytics.attendance.map(
      (item) => item.attendance_date
    ),

    datasets: [
      {
        label: "Attendance",

        data: analytics.attendance.map(
          (item) => item.total
        ),

        borderColor: "#0d6efd",

        backgroundColor: "#0d6efd",

        tension: 0.4,
      },
    ],
  };

  // ---------------- LEAVE DATA ----------------

  const leaveData = {
    labels: analytics.leaves.map(
      (item) => item.status
    ),

    datasets: [
      {
        data: analytics.leaves.map(
          (item) => item.total
        ),

        backgroundColor: [
          "#198754",
          "#ffc107",
          "#dc3545",
        ],
      },
    ],
  };

  // ---------------- TOP INTERN DATA ----------------

  const topInternData = {
    labels: analytics.topInterns.map(
      (item) => item.full_name
    ),

    datasets: [
      {
        label: "Hours Worked",

        data: analytics.topInterns.map(
          (item) => item.total_hours
        ),

        backgroundColor: "#6610f2",
      },
    ],
  };

  // ---------------- LOADING ----------------

  if (loading) {
    return (
      <AdminLayout>

        <div className="container-fluid mt-4">

          <div className="text-center py-5">

            <div
              className="spinner-border text-primary"
              role="status"
            ></div>

            <p className="mt-3">
              Loading analytics...
            </p>

          </div>

        </div>

      </AdminLayout>
    );
  }

  // ---------------- UI ----------------

  return (
    <AdminLayout>

      <div className="container-fluid">

        <h2 className="fw-bold mb-4">
          Analytics Dashboard
        </h2>

        <div className="row">

          {/* WORK LOG STATUS */}

          <div className="col-lg-6 mb-4">

            <div className="card shadow p-3">

              <h5 className="text-center">
                Work Log Status
              </h5>

              <Bar data={workLogData} />

            </div>

          </div>

          {/* DEPARTMENT DISTRIBUTION */}

          <div className="col-lg-6 mb-4">

            <div className="card shadow p-3">

              <h5 className="text-center">
                Department Distribution
              </h5>

              <Pie data={departmentData} />

            </div>

          </div>

          {/* ATTENDANCE */}

          <div className="col-lg-12 mb-4">

            <div className="card shadow p-3">

              <h5 className="text-center">
                Weekly Attendance Trend
              </h5>

              <Line data={attendanceData} />

            </div>

          </div>

          {/* LEAVES */}

          <div className="col-lg-6 mb-4">

            <div className="card shadow p-3">

              <h5 className="text-center">
                Leave Requests
              </h5>

              <Doughnut data={leaveData} />

            </div>

          </div>

          {/* TOP INTERNS */}

          <div className="col-lg-6 mb-4">

            <div className="card shadow p-3">

              <h5 className="text-center">
                Top Interns
              </h5>

              <Bar
                data={topInternData}
                options={{
                  indexAxis: "y",
                }}
              />

            </div>

          </div>

        </div>

      </div>

    </AdminLayout>
  );
}

export default Analytics;