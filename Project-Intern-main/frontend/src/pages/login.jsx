import { useState } from "react";
import api from "../api";
import logo from "../assets/midbrains_technologies_logo.jpg";

function Login() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("intern");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);


  const handleLogin = async (e) => {

    e.preventDefault();

    setLoading(true);

    console.log("Sending login request...");
    
    console.log("Role:", role);


    try {

      const response = await api.post(
        "/login",
        {
          username: username.trim(),
          password: password,
          role: role,
        }
      );


      console.log(
        "LOGIN RESPONSE:",
        response.data
      );


      if (response.data.success) {

        alert("Login Successful!");


        // Clear old login data

        localStorage.removeItem("admin");
        localStorage.removeItem("intern");


        // =========================
        // ADMIN
        // =========================

        if (
          role === "admin" &&
          response.data.admin
        ) {

          localStorage.setItem(
            "admin",
            JSON.stringify(
              response.data.admin
            )
          );


          window.location.href = "/admin";

          return;
        }


        // =========================
        // INTERN
        // =========================

        if (
          role === "intern" &&
          response.data.intern
        ) {

          localStorage.setItem(
            "intern",
            JSON.stringify(
              response.data.intern
            )
          );


          window.location.href = "/intern";

          return;
        }


        alert(
          "Login response is missing user information."
        );

      } else {

        alert(
          response.data.message ||
          "Login failed"
        );

      }

    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );

      console.error(
        "STATUS:",
        error.response?.status
      );

      console.error(
        "SERVER RESPONSE:",
        error.response?.data
      );


      const message =
        error.response?.data?.message ||
        "Server error. Please try again.";


      alert(message);

    } finally {

      setLoading(false);

    }

  };


  return (

    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
      }}
    >

      <div
        className="card shadow-lg border-0"
        style={{
          width: "450px",
          maxWidth: "95%",
          borderRadius: "20px",
        }}
      >

        <div className="card-body p-4">


          {/* Logo */}

          <div className="text-center mb-4">

            <img
              src={logo}
              alt="Midbrains Technologies"
              style={{
                width: "280px",
                maxWidth: "100%",
                height: "auto",
              }}
            />

            <p className="text-muted mt-2">
              Login to continue
            </p>

          </div>


          <form onSubmit={handleLogin}>


            {/* Username */}

            <div className="mb-3">

              <label
                htmlFor="login-username"
                className="form-label fw-semibold"
              >
                Username
              </label>

              <input
                id="login-username"
                name="username"
                type="text"
                className="form-control form-control-lg"
                placeholder="Enter Username / Email"
                autoComplete="username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                required
              />

            </div>


            {/* Password */}

            <div className="mb-3">

              <label
                htmlFor="login-password"
                className="form-label fw-semibold"
              >
                Password
              </label>


              <div className="input-group">

                <input
                  id="login-password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  className="form-control form-control-lg"
                  placeholder="Enter Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
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
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
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


            {/* Role */}

            <div className="mb-4">

              <label
                htmlFor="login-role"
                className="form-label fw-semibold"
              >
                Login As
              </label>


              <select
                id="login-role"
                name="role"
                className="form-select form-select-lg"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value)
                }
              >

                <option value="intern">
                  Intern
                </option>

                <option value="admin">
                  Admin
                </option>

              </select>

            </div>


            {/* Login Button */}

            <button
              type="submit"
              className="btn w-100 py-3 fw-bold"
              disabled={loading}
              style={{
                backgroundColor: "rgb(2,26,77)",
                color: "white",
                borderRadius: "12px",
              }}
            >

              {loading
                ? "Logging in..."
                : "Login"}

            </button>


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

export default Login;