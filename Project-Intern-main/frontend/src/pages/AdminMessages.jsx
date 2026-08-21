import { useEffect, useRef, useState } from "react";
import api, { API_URL } from "../api";
import AdminLayout from "../layouts/AdminLayout";

function AdminMessages() {
  // =========================================================
  // ADMIN
  // =========================================================

  const admin = JSON.parse(localStorage.getItem("admin"));

  const adminName =
    admin?.full_name ||
    admin?.name ||
    admin?.username ||
    "Admin";

  // =========================================================
  // STATES
  // =========================================================

  const [messages, setMessages] = useState([]);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [reply, setReply] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // =========================================================
  // FETCH ALL ADMIN MESSAGES
  // =========================================================

  const fetchMessages = async () => {
    try {
      const res = await api.get("/messages/admin");

      setMessages(res.data.data || []);
    } catch (error) {
      console.log(
        "Fetch admin messages error:",
        error.response?.data || error
      );
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (!admin) {
      window.location.href = "/";
      return;
    }

    fetchMessages();

    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // =========================================================
  // AUTO SCROLL
  // =========================================================

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, selectedIntern]);

  // =========================================================
  // GROUP MESSAGES BY INTERN
  // =========================================================

  const internMap = new Map();

  messages.forEach((msg) => {
    if (!internMap.has(msg.intern_id)) {
      internMap.set(msg.intern_id, {
        intern_id: msg.intern_id,
        full_name: msg.full_name || "Unknown Intern",
        email: msg.email || "",
        messages: [],
      });
    }

    internMap.get(msg.intern_id).messages.push(msg);
  });

  const interns = Array.from(internMap.values());

  // =========================================================
  // SEARCH INTERN
  // =========================================================

  const filteredInterns = interns.filter((intern) => {
    const name = intern.full_name?.toLowerCase() || "";
    const email = intern.email?.toLowerCase() || "";
    const searchText = search.toLowerCase();

    return (
      name.includes(searchText) ||
      email.includes(searchText)
    );
  });

  // =========================================================
  // SELECTED INTERN MESSAGES
  // =========================================================

  const internMessages = selectedIntern
    ? messages.filter(
        (msg) =>
          msg.message_id &&
          Number(msg.intern_id) ===
          Number(selectedIntern.intern_id)
      )
    : [];

  // =========================================================
  // UNREAD COUNT
  // =========================================================

  const getUnreadCount = (intern) => {
    return intern.messages.filter(
      (msg) => msg.message_id &&
        msg.sender === "intern" &&
        !msg.is_read
    ).length;
  };

  // =========================================================
  // LAST MESSAGE
  // =========================================================

  const getLastMessage = (intern) => {
    const realMessages = intern.messages.filter((msg) => msg.message_id);

    if (!realMessages.length) {
      return "No messages yet";
    }

    const last =
      realMessages[realMessages.length - 1];

    if (last.file_name) {
      return `📎 ${last.file_name}`;
    }

    return last.message || "File";
  };

  // =========================================================
  // SELECT INTERN
  // =========================================================

  const selectIntern = async (intern) => {
    setSelectedIntern(intern);

    const unreadMessages = messages.filter(
      (msg) =>
        Number(msg.intern_id) ===
          Number(intern.intern_id) &&
        msg.sender === "intern" &&
        !msg.is_read
    );

    try {
      await Promise.all(
        unreadMessages.map((msg) =>
          api.put(
            `/messages/admin/read/${intern.intern_id}`
          )
        )
      );

      await fetchMessages();
    } catch (error) {
      console.log(
        "Mark read error:",
        error.response?.data || error
      );
    }
  };

  // =========================================================
  // SEND ADMIN MESSAGE
  // =========================================================

  const sendReply = async () => {
    if (!selectedIntern) {
      return;
    }

    if (!reply.trim() && !selectedFile) {
      return;
    }

    try {
      const formData = new FormData();

      formData.append("sender", "admin");

      formData.append(
        "sender_name",
        adminName
      );

      formData.append(
        "intern_id",
        selectedIntern.intern_id
      );

      formData.append(
        "receiver_id",
        selectedIntern.intern_id
      );

      if (admin?.admin_id) {
        formData.append("admin_id", admin.admin_id);
      }

      formData.append(
        "receiver_type",
        "intern"
      );

      formData.append(
        "message",
        reply.trim()
      );

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      await api.post("/messages", formData);

      setReply("");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await fetchMessages();
    } catch (error) {
      console.log(
        "Send reply error:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          "Unable to send message"
      );
    }
  };

  // =========================================================
  // FILE SELECT
  // =========================================================

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // 10 MB
    if (file.size > 10 * 1024 * 1024) {
      alert("Maximum file size is 10 MB");

      e.target.value = "";

      return;
    }

    setSelectedFile(file);
  };

  // =========================================================
  // REMOVE SELECTED FILE
  // =========================================================

  const removeSelectedFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =========================================================
  // CHECK IMAGE
  // =========================================================

  const isImage = (filename) => {
    if (!filename) {
      return false;
    }

    const extension = filename
      .split(".")
      .pop()
      .toLowerCase();

    return [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "bmp",
    ].includes(extension);
  };

  // =========================================================
  // FILE ICON
  // =========================================================

  const getFileIcon = (filename) => {
    if (!filename) {
      return "📎";
    }

    const extension = filename
      .split(".")
      .pop()
      .toLowerCase();

    if (extension === "pdf") {
      return "📕";
    }

    if (
      extension === "doc" ||
      extension === "docx"
    ) {
      return "📘";
    }

    if (
      extension === "xls" ||
      extension === "xlsx"
    ) {
      return "📗";
    }

    if (
      extension === "ppt" ||
      extension === "pptx"
    ) {
      return "📙";
    }

    if (
      extension === "zip" ||
      extension === "rar"
    ) {
      return "🗜️";
    }

    if (extension === "txt") {
      return "📄";
    }

    return "📎";
  };

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <AdminLayout>
      <div className="container-fluid">

        {/* PAGE TITLE */}

        <div className="mb-3">
          <h2 className="fw-bold mb-1">
            💬 Messages
          </h2>

          <small className="text-muted">
            Chat with interns
          </small>
        </div>

        {/* MAIN CHAT */}

        <div
          className="card shadow border-0"
          style={{
            height: "650px",
            borderRadius: "18px",
            overflow: "hidden",
          }}
        >
          <div className="d-flex h-100">

            {/* ================================================= */}
            {/* SIDEBAR */}
            {/* ================================================= */}

            {showSidebar && (
              <div
                style={{
                  width: "300px",
                  minWidth: "300px",
                  borderRight: "1px solid #ddd",
                  background: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                }}
              >

                {/* SIDEBAR HEADER */}

                <div
                  style={{
                    padding: "16px",
                    background: "#f0f2f5",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">

                    <div>
                      <h5 className="fw-bold mb-0">
                        Intern Chats
                      </h5>

                      <small className="text-muted">
                        {interns.length} conversations
                      </small>
                    </div>

                    <button
                      className="btn btn-light"
                      onClick={() =>
                        setShowSidebar(false)
                      }
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* SEARCH */}

                <div
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div
                    className="d-flex align-items-center"
                    style={{
                      background: "#f0f2f5",
                      borderRadius: "10px",
                      padding: "8px 12px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "18px",
                        marginRight: "8px",
                      }}
                    >
                      🔍
                    </span>

                    <input
                      type="text"
                      value={search}
                      onChange={(e) =>
                        setSearch(e.target.value)
                      }
                      placeholder="Search contact..."
                      style={{
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        width: "100%",
                      }}
                    />
                  </div>
                </div>

                {/* INTERN LIST */}

                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                  }}
                >
                  {filteredInterns.length === 0 ? (
                    <div className="text-center text-muted p-4">
                      <div style={{ fontSize: "40px" }}>
                        👥
                      </div>

                      <p className="mb-0">
                        No interns found
                      </p>
                    </div>
                  ) : (
                    filteredInterns.map((intern) => {
                      const unread =
                        getUnreadCount(intern);

                      const active =
                        selectedIntern &&
                        Number(
                          selectedIntern.intern_id
                        ) ===
                          Number(intern.intern_id);

                      return (
                        <div
                          key={intern.intern_id}
                          onClick={() =>
                            selectIntern(intern)
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "12px 15px",
                            cursor: "pointer",
                            background: active
                              ? "#e9edef"
                              : "#ffffff",
                            borderBottom:
                              "1px solid #f0f0f0",
                          }}
                        >

                          {/* AVATAR */}

                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              minWidth: "48px",
                              borderRadius: "50%",
                              background:
                                "rgb(2,26,77)",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "bold",
                              fontSize: "19px",
                              marginRight: "12px",
                            }}
                          >
                            {(
                              intern.full_name || "I"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          {/* DETAILS */}

                          <div
                            style={{
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <div className="d-flex justify-content-between">

                              <strong
                                style={{
                                  fontSize: "15px",
                                }}
                              >
                                {intern.full_name}
                              </strong>

                              {unread > 0 && (
                                <span
                                  className="badge bg-danger"
                                  style={{
                                    borderRadius: "50%",
                                    minWidth: "22px",
                                    height: "22px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {unread}
                                </span>
                              )}
                            </div>

                            <div
                              className="text-muted text-truncate"
                              style={{
                                fontSize: "13px",
                                maxWidth: "200px",
                              }}
                            >
                              {getLastMessage(intern)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ================================================= */}
            {/* CHAT AREA */}
            {/* ================================================= */}

            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >

              {/* CHAT HEADER */}

              {selectedIntern ? (
                <div
                  style={{
                    height: "70px",
                    minHeight: "70px",
                    background: "rgb(2,26,77)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 18px",
                  }}
                >

                  {!showSidebar && (
                    <button
                      className="btn btn-light me-3"
                      onClick={() =>
                        setShowSidebar(true)
                      }
                    >
                      ☰
                    </button>
                  )}

                  <div
                    style={{
                      width: "45px",
                      height: "45px",
                      minWidth: "45px",
                      borderRadius: "50%",
                      background: "white",
                      color: "rgb(2,26,77)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "18px",
                      marginRight: "12px",
                    }}
                  >
                    {(
                      selectedIntern.full_name || "I"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <div
                      className="fw-bold"
                      style={{
                        fontSize: "17px",
                      }}
                    >
                      {selectedIntern.full_name}
                    </div>

                    <small>
                      {selectedIntern.email}
                    </small>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    height: "70px",
                    minHeight: "70px",
                    background: "rgb(2,26,77)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 18px",
                  }}
                >

                  {!showSidebar && (
                    <button
                      className="btn btn-light me-3"
                      onClick={() =>
                        setShowSidebar(true)
                      }
                    >
                      ☰
                    </button>
                  )}

                  <h5 className="mb-0">
                    💬 Select an intern
                  </h5>
                </div>
              )}

              {/* CHAT BODY */}

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px",
                  background: "#efeae2",
                }}
              >

                {!selectedIntern ? (
                  <div className="h-100 d-flex justify-content-center align-items-center">
                    <div className="text-center">
                      <div
                        style={{
                          fontSize: "65px",
                        }}
                      >
                        💬
                      </div>

                      <h5 className="fw-bold">
                        Select an intern
                      </h5>

                      <p className="text-muted">
                        Select an intern from the left
                        to start chatting.
                      </p>
                    </div>
                  </div>
                ) : internMessages.length === 0 ? (
                  <div className="h-100 d-flex justify-content-center align-items-center">
                    <div className="text-center">
                      <div
                        style={{
                          fontSize: "55px",
                        }}
                      >
                        💬
                      </div>

                      <h5>No messages yet</h5>

                      <p className="text-muted">
                        Start a conversation with{" "}
                        {selectedIntern.full_name}
                      </p>
                    </div>
                  </div>
                ) : (
                  internMessages.map((msg) => {
                    const isAdmin =
                      msg.sender === "admin";

                    return (
                      <div
                        key={msg.message_id}
                        className={`d-flex mb-2 ${
                          isAdmin
                            ? "justify-content-end"
                            : "justify-content-start"
                        }`}
                      >
                        <div
                          style={{
                            maxWidth: "70%",
                            minWidth: "80px",
                            background: isAdmin
                              ? "#d9fdd3"
                              : "#ffffff",
                            padding: "8px 10px",
                            borderRadius: "10px",
                            boxShadow:
                              "0 1px 2px rgba(0,0,0,0.15)",
                          }}
                        >

                          {/* SENDER NAME */}

                          {!isAdmin && (
                            <div
                              style={{
                                color: "#075e54",
                                fontSize: "12px",
                                fontWeight: "bold",
                                marginBottom: "3px",
                              }}
                            >
                              {msg.sender_name ||
                                selectedIntern.full_name}
                            </div>
                          )}

                          {/* IMAGE */}

                          {msg.file_url &&
                            isImage(msg.file_name) && (
                              <a
                                href={`${API_URL}${msg.file_url}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={`${API_URL}${msg.file_url}`}
                                  alt={
                                    msg.file_name ||
                                    "Image"
                                  }
                                  style={{
                                    maxWidth: "280px",
                                    maxHeight: "280px",
                                    width: "100%",
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                    display: "block",
                                    marginBottom:
                                      msg.message
                                        ? "7px"
                                        : "0",
                                  }}
                                />
                              </a>
                            )}

                          {/* FILE */}

                          {msg.file_url &&
                            !isImage(msg.file_name) && (
                              <a
                                href={`${API_URL}${msg.file_url}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  textDecoration: "none",
                                  color: "#333",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "9px",
                                    background: "#f0f2f5",
                                    borderRadius: "8px",
                                    marginBottom:
                                      msg.message
                                        ? "7px"
                                        : "0",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "30px",
                                    }}
                                  >
                                    {getFileIcon(
                                      msg.file_name
                                    )}
                                  </span>

                                  <div
                                    style={{
                                      marginLeft: "8px",
                                      wordBreak:
                                        "break-word",
                                    }}
                                  >
                                    <strong
                                      style={{
                                        fontSize: "13px",
                                      }}
                                    >
                                      {msg.file_name}
                                    </strong>

                                    <br />

                                    <small className="text-muted">
                                      Click to open
                                    </small>
                                  </div>
                                </div>
                              </a>
                            )}

                          {/* MESSAGE */}

                          {msg.message && (
                            <div
                              style={{
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                fontSize: "14px",
                              }}
                            >
                              {msg.message}
                            </div>
                          )}

                          {/* TIME + TICK */}

                          <div
                            className="d-flex justify-content-end align-items-center"
                            style={{
                              marginTop: "3px",
                              gap: "4px",
                            }}
                          >
                            <small
                              className="text-muted"
                              style={{
                                fontSize: "10px",
                              }}
                            >
                              {formatTime(
                                msg.created_at
                              )}
                            </small>

                            {isAdmin && (
                              <span
                                style={{
                                  fontSize: "13px",
                                  fontWeight: "bold",
                                  color: msg.is_read
                                    ? "#34B7F1"
                                    : "#8696a0",
                                }}
                                title={
                                  msg.is_read
                                    ? "Seen"
                                    : "Delivered"
                                }
                              >
                                ✓✓
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={chatEndRef} />
              </div>

              {/* SELECTED FILE PREVIEW */}

              {selectedFile && (
                <div
                  style={{
                    padding: "8px 12px",
                    background: "#f0f2f5",
                    borderTop: "1px solid #ddd",
                  }}
                >
                  <div
                    className="d-flex justify-content-between align-items-center bg-white p-2"
                    style={{
                      borderRadius: "8px",
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <span
                        style={{
                          fontSize: "25px",
                          marginRight: "8px",
                        }}
                      >
                        {getFileIcon(
                          selectedFile.name
                        )}
                      </span>

                      <div>
                        <strong
                          style={{
                            fontSize: "13px",
                          }}
                        >
                          {selectedFile.name}
                        </strong>

                        <br />

                        <small className="text-muted">
                          {(
                            selectedFile.size / 1024
                          ).toFixed(1)}{" "}
                          KB
                        </small>
                      </div>
                    </div>

                    <button
                      className="btn btn-sm btn-light"
                      onClick={removeSelectedFile}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* MESSAGE INPUT */}

              {selectedIntern && (
                <div
                  style={{
                    background: "#f0f2f5",
                    padding: "10px",
                  }}
                >
                  <div
                    className="d-flex align-items-center"
                    style={{
                      gap: "5px",
                    }}
                  >

                    {/* FILE BUTTON */}

                    <button
                      className="btn btn-light"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      title="Attach file"
                    >
                      📎
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.csv"
                      onChange={handleFileSelect}
                    />

                    {/* EMOJI */}

                    <button
                      className="btn btn-light"
                      onClick={() =>
                        setReply(
                          (prev) => prev + " 😊"
                        )
                      }
                      title="Emoji"
                    >
                      😊
                    </button>

                    {/* TEXT INPUT */}

                    <input
                      type="text"
                      className="form-control"
                      placeholder={`Message ${selectedIntern.full_name}...`}
                      value={reply}
                      onChange={(e) =>
                        setReply(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.shiftKey
                        ) {
                          e.preventDefault();
                          sendReply();
                        }
                      }}
                    />

                    {/* SEND */}

                    <button
                      className="btn text-white"
                      style={{
                        background:
                          "rgb(2,26,77)",
                        minWidth: "52px",
                      }}
                      onClick={sendReply}
                    >
                      ➤
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminMessages;