import { useState } from "react";
import api, { API_URL } from "../api";
import logo from "../assets/midbrains_technologies_logo.jpg";

function InternSignup() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    age: "",
    gender: "",
    dob: "",
    department: "",
    address: "",
    profile_image: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "profile_image" ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const data = new FormData();

      data.append("full_name", formData.full_name);
      data.append("email", formData.email);
      data.append("password", formData.password);
      data.append("phone", formData.phone);
      data.append("age", formData.age);
      data.append("gender", formData.gender);
      data.append("dob", formData.dob);
      data.append("department", formData.department);
      data.append("address", formData.address);

      if (formData.profile_image) {
        data.append("profile_image", formData.profile_image);
      }

      console.log("Sending signup request...");
      console.log("Backend:", API_URL);

      // IMPORTANT:
      // Do NOT manually set Content-Type.
      // Browser/Axios automatically creates the multipart boundary.
      const response = await api.post(
        "/signup",
        data
      );

      console.log("SIGNUP RESPONSE:", response.data);

      if (response.data.success) {
        alert("Registration Successful!");

        window.location.href = "/login";
      } else {
        alert(
          response.data.message ||
          "Registration Failed"
        );
      }

    } catch (error) {
      console.error("SIGNUP ERROR:", error);

      console.error(
        "STATUS:",
        error.response?.status
      );

      console.error(
        "SERVER RESPONSE:",
        error.response?.data
      );

      alert(
        error.response?.data?.message ||
        "Registration Failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center py-2"
      style={{
        minHeight: "100vh",
      }}
    >
      <div
        className="card border-0 shadow-lg"
        style={{
          width: "700px",
          maxWidth: "95%",
          borderRadius: "20px",
        }}
      >
        <div className="card-body p-4">

          {/* Logo */}

          <div className="text-center mb-3">

            <img
              src={logo}
              alt="Midbrains Technologies"
              style={{
                width: "280px",
                maxWidth: "100%",
                height: "auto",
                display: "block",
                margin: "0 auto",
              }}
            />

            <p
              className="text-muted mt-2"
              style={{
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              Create your intern account
            </p>

          </div>


          <form onSubmit={handleSubmit}>

            {/* Profile Photo */}

            <div className="mb-3">

              <label
                htmlFor="profile_image"
                className="form-label fw-semibold"
              >
                Profile Photo
              </label>

              <input
                id="profile_image"
                type="file"
                name="profile_image"
                className="form-control"
                accept="image/*"
                style={{
                  borderRadius: "12px",
                }}
                onChange={handleChange}
              />

            </div>


            {/* Full Name */}

            <div className="mb-3">

              <label
                htmlFor="full_name"
                className="form-label fw-semibold"
              >
                Full Name
              </label>

              <input
                id="full_name"
                type="text"
                name="full_name"
                className="form-control"
                placeholder="Enter full name"
                autoComplete="name"
                style={{
                  borderRadius: "12px",
                }}
                value={formData.full_name}
                onChange={handleChange}
                required
              />

            </div>


            {/* Email + Password */}

            <div className="row">

              <div className="col-md-6 mb-3">

                <label
                  htmlFor="email"
                  className="form-label fw-semibold"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="Enter email"
                  autoComplete="email"
                  style={{
                    borderRadius: "12px",
                  }}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="col-md-6 mb-3">

                <label
                  htmlFor="password"
                  className="form-label fw-semibold"
                >
                  Password
                </label>

                <div className="input-group">

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    className="form-control"
                    placeholder="Enter password"
                    autoComplete="new-password"
                    style={{
                      borderRadius: "12px 0 0 12px",
                    }}
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                  >
                    <i
                      className={
                        showPassword
                          ? "bi bi-eye-slash-fill"
                          : "bi bi-eye-fill"
                      }
                    ></i>
                  </button>

                </div>

              </div>

            </div>


            {/* Phone + Age */}

            <div className="row">

              <div className="col-md-6 mb-3">

                <label
                  htmlFor="phone"
                  className="form-label fw-semibold"
                >
                  Phone
                </label>

                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  className="form-control"
                  placeholder="Enter phone number"
                  autoComplete="tel"
                  style={{
                    borderRadius: "12px",
                  }}
                  value={formData.phone}
                  onChange={handleChange}
                />

              </div>


              <div className="col-md-6 mb-3">

                <label
                  htmlFor="age"
                  className="form-label fw-semibold"
                >
                  Age
                </label>

                <input
                  id="age"
                  type="number"
                  name="age"
                  className="form-control"
                  placeholder="Enter age"
                  style={{
                    borderRadius: "12px",
                  }}
                  value={formData.age}
                  onChange={handleChange}
                />

              </div>

            </div>


            {/* Gender + DOB */}

            <div className="row">

              <div className="col-md-6 mb-3">

                <label
                  htmlFor="gender"
                  className="form-label fw-semibold"
                >
                  Gender
                </label>

                <select
                  id="gender"
                  name="gender"
                  className="form-select"
                  style={{
                    borderRadius: "12px",
                  }}
                  value={formData.gender}
                  onChange={handleChange}
                >

                  <option value="">
                    Select Gender
                  </option>

                  <option value="Male">
                    Male
                  </option>

                  <option value="Female">
                    Female
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>


              <div className="col-md-6 mb-3">

                <label
                  htmlFor="dob"
                  className="form-label fw-semibold"
                >
                  Date of Birth
                </label>

                <input
                  id="dob"
                  type="date"
                  name="dob"
                  className="form-control"
                  style={{
                    borderRadius: "12px",
                  }}
                  value={formData.dob}
                  onChange={handleChange}
                />

              </div>

            </div>


            {/* Department */}

            <div className="mb-3">

              <label
                htmlFor="department"
                className="form-label fw-semibold"
              >
                Department
              </label>

              <input
                id="department"
                type="text"
                name="department"
                className="form-control"
                placeholder="Enter department"
                style={{
                  borderRadius: "12px",
                }}
                value={formData.department}
                onChange={handleChange}
              />

            </div>


            {/* Address */}

            <div className="mb-3">

              <label
                htmlFor="address"
                className="form-label fw-semibold"
              >
                Address
              </label>

              <textarea
                id="address"
                rows="3"
                name="address"
                className="form-control"
                placeholder="Enter address"
                style={{
                  borderRadius: "12px",
                }}
                value={formData.address}
                onChange={handleChange}
              />

            </div>


            {/* Register Button */}

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-bold"
              disabled={loading}
              style={{
                borderRadius: "12px",
                fontSize: "17px",
                backgroundColor: "rgb(2, 26, 77)",
                borderColor: "rgb(2, 26, 77)",
              }}
            >

              {loading
                ? "Registering..."
                : "Register"}

            </button>


            {/* Login */}

            <div className="text-center mt-3">

              <span className="text-muted">
                Already have an account?{" "}
              </span>

              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none fw-bold"
                onClick={() =>
                  (window.location.href = "/login")
                }
              >
                Login
              </button>

            </div>

          </form>


          <div className="text-center mt-4">

            <small className="text-muted">
              © 2026 Midbrains Technologies
            </small>

          </div>

        </div>
      </div>
    </div>
  );
}

export default InternSignup;