import { useEffect, useState } from "react";
import InternSidebar from "../components/InternSidebar";
import InternNavbar from "../components/InternNavbar";
import api, { API_URL } from "../api";

function InternProfile() {
  const internData = localStorage.getItem("intern");
  const intern = internData ? JSON.parse(internData) : null;

  const [profile, setProfile] = useState({});
  const [showEdit, setShowEdit] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    department: "",
  });

  // ---------------- LOGIN CHECK + FETCH PROFILE ----------------
  useEffect(() => {
    if (!intern) {
      window.location.href = "/login";
      return;
    }

    fetchProfile();
  }, []);

  // ---------------- FETCH PROFILE ----------------
  const fetchProfile = async () => {
    try {
      const res = await api.get(
        `/intern/${intern.intern_id}`
      );

      setProfile(res.data);

      setFormData({
        full_name: res.data.full_name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        department: res.data.department || "",
      });
    } catch (error) {
      console.error("FETCH PROFILE ERROR:", error);

      alert(
        error.response?.data?.message ||
          "Unable to load profile"
      );
    }
  };

  // ---------------- UPDATE PROFILE ----------------
  const updateProfile = async () => {
    try {
      const res = await api.put(
        `/update-profile/${intern.intern_id}`,
        formData
      );

      alert(
        res.data.message ||
          "Profile Updated Successfully"
      );

      setShowEdit(false);

      fetchProfile();

    } catch (error) {
      console.error("UPDATE PROFILE ERROR:", error);

      alert(
        error.response?.data?.message ||
          "Update Failed"
      );
    }
  };

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

        <div className="container py-4">

          <div className="card shadow border-0">

            {/* COVER */}
            <div
              style={{
                height: "220px",
                background:
                  "linear-gradient(135deg,#2563eb,#7c3aed)",
              }}
            ></div>

            {/* PROFILE HEADER */}
            <div
              className="text-center"
              style={{
                marginTop: "-80px",
              }}
            >

              {/* PROFILE IMAGE */}
              <img
                src={
                  profile.profile_image
                    ? `${API_URL}/${profile.profile_image}`
                    : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                }
                alt="Profile"
                className="rounded-circle border border-4 border-white shadow"
                width="160"
                height="160"
                style={{
                  objectFit: "cover",
                }}
              />

              <h2 className="mt-3 fw-bold">
                {profile.full_name || "Intern"}
              </h2>

              <p className="text-muted">
                {profile.department || "Department"}
              </p>

              <button
                className="btn btn-primary"
                onClick={() => setShowEdit(true)}
              >
                Edit Profile
              </button>

            </div>

            {/* DETAILS */}
            <div className="card-body p-5">

              <div className="row">

                {/* PERSONAL INFORMATION */}
                <div className="col-md-6 mb-4">

                  <div className="card shadow-sm h-100">

                    <div className="card-body">

                      <h4 className="text-primary">
                        Personal Information
                      </h4>

                      <hr />

                      <p>
                        <strong>Name:</strong>{" "}
                        {profile.full_name || "-"}
                      </p>

                      <p>
                        <strong>Email:</strong>{" "}
                        {profile.email || "-"}
                      </p>

                      <p>
                        <strong>Phone:</strong>{" "}
                        {profile.phone || "-"}
                      </p>

                      <p>
                        <strong>Department:</strong>{" "}
                        {profile.department || "-"}
                      </p>

                    </div>

                  </div>

                </div>

                {/* INTERNSHIP DETAILS */}
                <div className="col-md-6 mb-4">

                  <div className="card shadow-sm h-100">

                    <div className="card-body">

                      <h4 className="text-success">
                        Internship Details
                      </h4>

                      <hr />

                      <p>
                        <strong>Intern ID:</strong>{" "}
                        {profile.intern_id || "-"}
                      </p>

                      <p>
                        <strong>Status:</strong>

                        <span className="badge bg-success ms-2">
                          Active
                        </span>

                      </p>

                      <p>
                        <strong>Role:</strong>{" "}
                        Intern
                      </p>

                      <p>
                        <strong>Organization:</strong>{" "}
                        MidBrains Technologies
                      </p>

                    </div>

                  </div>

                </div>

              </div>

              {/* EDIT MODAL */}
              {showEdit && (

                <div
                  className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                  style={{
                    background: "rgba(0,0,0,.5)",
                    zIndex: 9999,
                  }}
                >

                  <div
                    className="bg-white rounded shadow p-4"
                    style={{
                      width: "450px",
                      maxWidth: "90%",
                    }}
                  >

                    <h3 className="mb-4 text-center">
                      Edit Profile
                    </h3>

                    {/* NAME */}
                    <input
                      className="form-control mb-3"
                      placeholder="Full Name"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          full_name: e.target.value,
                        })
                      }
                    />

                    {/* EMAIL */}
                    <input
                      type="email"
                      className="form-control mb-3"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: e.target.value,
                        })
                      }
                    />

                    {/* PHONE */}
                    <input
                      type="text"
                      className="form-control mb-3"
                      placeholder="Phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value,
                        })
                      }
                    />

                    {/* DEPARTMENT */}
                    <input
                      className="form-control mb-4"
                      placeholder="Department"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          department: e.target.value,
                        })
                      }
                    />

                    {/* BUTTONS */}
                    <div className="text-end">

                      <button
                        className="btn btn-secondary me-2"
                        onClick={() =>
                          setShowEdit(false)
                        }
                      >
                        Cancel
                      </button>

                      <button
                        className="btn btn-primary"
                        onClick={updateProfile}
                      >
                        Save Changes
                      </button>

                    </div>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default InternProfile;