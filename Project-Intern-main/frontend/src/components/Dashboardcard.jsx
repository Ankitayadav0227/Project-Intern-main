function DashboardCard({ title, value, color, icon }) {
  const cardStyle =
    color === "custom-blue"
      ? { backgroundColor: "rgb(2,26,77)" }
      : {};

  return (
    <div className="col-md-3 mb-3">
      <div
        className={`card ${color !== "custom-blue" ? color : ""} text-white shadow`}
        style={{
          ...cardStyle,
          borderRadius: "15px",
        }}
      >
        <div className="card-body d-flex justify-content-between align-items-center">
          <div>
            <h6>{title}</h6>
            <h3>{value}</h3>
          </div>

          <i
            className={icon}
            style={{
              fontSize: "2rem",
            }}
          ></i>
        </div>
      </div>
    </div>
  );
}

export default DashboardCard;