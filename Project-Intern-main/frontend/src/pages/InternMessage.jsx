import {
  useEffect,
  useRef,
  useState,
} from "react";

import InternLayout from "../layouts/InternLayout";
import api, { API_URL } from "../api";

function InternMessages() {
  const internData = localStorage.getItem("intern");
  const intern = internData
    ? JSON.parse(internData)
    : null;

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] =
    useState(null);

  const [showSidebar, setShowSidebar] =
    useState(true);

  const [search, setSearch] = useState("");

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // =====================================================
  // FETCH MESSAGES
  // =====================================================

  const fetchMessages = async () => {
    if (!intern?.intern_id) return;

    try {
      const res = await api.get(
        `/messages/intern/${intern.intern_id}`
      );

      setMessages(res.data.data || []);
    } catch (error) {
      console.error(
        "FETCH MESSAGES ERROR:",
        error.response?.data || error
      );
    }
  };

  // =====================================================
  // LOAD PAGE
  // =====================================================

  useEffect(() => {
    if (!intern) {
      window.location.href = "/login";
      return;
    }

    fetchMessages();

    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // AUTO SCROLL
  // =====================================================

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // =====================================================
  // ADMIN NAME
  // =====================================================

  const adminMessage = messages.find(
    (msg) => msg.sender === "admin"
  );

  const adminName =
    adminMessage?.sender_name || "Admin";

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const sendMessage = async () => {
    if (
      !message.trim() &&
      !selectedFile
    ) {
      return;
    }

    try {
      const formData = new FormData();

      formData.append(
        "intern_id",
        intern.intern_id
      );

      formData.append(
        "sender",
        "intern"
      );

      formData.append(
        "message",
        message.trim()
      );

      if (selectedFile) {
        formData.append(
          "file",
          selectedFile
        );
      }

      await api.post(
        "/messages",
        formData
      );

      setMessage("");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetchMessages();

    } catch (error) {
      console.error(
        "SEND MESSAGE ERROR:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          "Unable to send message"
      );
    }
  };

  // =====================================================
  // IMAGE CHECK
  // =====================================================

  const isImage = (filename) => {
    if (!filename) return false;

    const ext = filename
      .split(".")
      .pop()
      .toLowerCase();

    return [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
    ].includes(ext);
  };

  // =====================================================
  // FILE ICON
  // =====================================================

  const getFileIcon = (filename) => {
    if (!filename) return "📎";

    const ext = filename
      .split(".")
      .pop()
      .toLowerCase();

    if (ext === "pdf") return "📕";

    if (
      ext === "doc" ||
      ext === "docx"
    ) {
      return "📘";
    }

    if (
      ext === "xls" ||
      ext === "xlsx"
    ) {
      return "📗";
    }

    if (
      ext === "zip" ||
      ext === "rar"
    ) {
      return "🗜️";
    }

    return "📎";
  };

  // =====================================================
  // LAST MESSAGE
  // =====================================================

  const lastMessage =
    messages.length > 0
      ? messages[messages.length - 1]
      : null;

  // =====================================================
  // SEARCH
  // =====================================================

  const showAdmin = adminName
    .toLowerCase()
    .includes(search.toLowerCase());

  // =====================================================
  // LOGIN CHECK
  // =====================================================

  if (!intern) return null;

  // =====================================================
  // UI
  // =====================================================

  return (
    <InternLayout>

      <div className="container-fluid">

        {/* PAGE TITLE */}

        <div className="mb-3">

          <h2 className="fw-bold mb-1">
            💬 Messages
          </h2>

          <small className="text-muted">
            Chat with {adminName}
          </small>

        </div>

        {/* CHAT CARD */}

        <div
          className="card border-0 shadow"
          style={{
            height: "600px",
            borderRadius: "18px",
            overflow: "hidden",
          }}
        >

          <div className="d-flex h-100">

            {/* SIDEBAR */}

            {showSidebar && (

              <div
                style={{
                  width: "280px",
                  minWidth: "280px",
                  background: "#ffffff",
                  borderRight:
                    "1px solid #ddd",
                  display: "flex",
                  flexDirection: "column",
                }}
              >

                {/* SIDEBAR HEADER */}

                <div
                  style={{
                    padding: "18px",
                    background: "#f0f2f5",
                    borderBottom:
                      "1px solid #ddd",
                  }}
                >

                  <div className="d-flex justify-content-between align-items-center">

                    <div>

                      <h5 className="fw-bold mb-0">
                        Chats
                      </h5>

                      <small className="text-muted">
                        Messages
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
                  }}
                >

                  <div
                    className="d-flex align-items-center"
                    style={{
                      background:
                        "#f0f2f5",
                      borderRadius: "10px",
                      padding: "7px 10px",
                    }}
                  >

                    <span className="me-2">
                      🔍
                    </span>

                    <input
                      type="text"
                      value={search}
                      onChange={(e) =>
                        setSearch(
                          e.target.value
                        )
                      }
                      placeholder="Search..."
                      style={{
                        border: "none",
                        outline: "none",
                        background:
                          "transparent",
                        width: "100%",
                      }}
                    />

                  </div>

                </div>

                {/* ADMIN */}

                {showAdmin && (

                  <div
                    style={{
                      padding:
                        "12px 15px",
                      display: "flex",
                      alignItems: "center",
                      background:
                        "#e9edef",
                      cursor: "pointer",
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
                        justifyContent:
                          "center",
                        fontWeight: "bold",
                        fontSize: "20px",
                        marginRight: "12px",
                      }}
                    >
                      {adminName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    {/* NAME */}

                    <div
                      style={{
                        overflow: "hidden",
                      }}
                    >

                      <div className="fw-bold">
                        {adminName}
                      </div>

                      <div
                        className="text-muted text-truncate"
                        style={{
                          fontSize: "13px",
                          maxWidth: "170px",
                        }}
                      >

                        {lastMessage
                          ? lastMessage.file_name
                            ? `📎 ${lastMessage.file_name}`
                            : lastMessage.message
                          : "No messages yet"}

                      </div>

                    </div>

                  </div>

                )}

              </div>

            )}

            {/* CHAT SECTION */}

            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >

              {/* CHAT HEADER */}

              <div
                style={{
                  height: "70px",
                  minHeight: "70px",
                  background:
                    "rgb(2,26,77)",
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

                {/* ADMIN AVATAR */}

                <div
                  style={{
                    width: "45px",
                    height: "45px",
                    borderRadius: "50%",
                    background: "white",
                    color: "rgb(2,26,77)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",
                    fontWeight: "bold",
                    marginRight: "12px",
                  }}
                >
                  {adminName
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
                    {adminName}
                  </div>

                  <small>
                    Admin
                  </small>

                </div>

              </div>

              {/* CHAT BODY */}

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px",
                  background: "#efeae2",
                }}
              >

                {messages.length === 0 ? (

                  <div className="h-100 d-flex justify-content-center align-items-center">

                    <div className="text-center">

                      <div
                        style={{
                          fontSize: "60px",
                        }}
                      >
                        💬
                      </div>

                      <h5>
                        No messages yet
                      </h5>

                      <p className="text-muted">
                        Start chatting with{" "}
                        {adminName}
                      </p>

                    </div>

                  </div>

                ) : (

                  messages.map((msg) => {

                    const mine =
                      msg.sender === "intern";

                    return (

                      <div
                        key={msg.message_id}
                        className={`d-flex mb-2 ${
                          mine
                            ? "justify-content-end"
                            : "justify-content-start"
                        }`}
                      >

                        <div
                          style={{
                            maxWidth: "70%",
                            minWidth: "80px",
                            background:
                              mine
                                ? "#d9fdd3"
                                : "#ffffff",
                            padding:
                              "8px 10px",
                            borderRadius: "10px",
                            boxShadow:
                              "0 1px 2px rgba(0,0,0,0.15)",
                          }}
                        >

                          {/* ADMIN NAME */}

                          {!mine && (

                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "#075e54",
                                marginBottom: "3px",
                              }}
                            >
                              {msg.sender_name ||
                                adminName}
                            </div>

                          )}

                          {/* IMAGE */}

                          {msg.file_url &&
                            isImage(
                              msg.file_name
                            ) && (

                              <a
                                href={`${API_URL}${msg.file_url}`}
                                target="_blank"
                                rel="noreferrer"
                              >

                                <img
                                  src={`${API_URL}${msg.file_url}`}
                                  alt={
                                    msg.file_name
                                  }
                                  style={{
                                    width: "250px",
                                    maxWidth: "100%",
                                    maxHeight: "250px",
                                    objectFit:
                                      "cover",
                                    borderRadius:
                                      "8px",
                                  }}
                                />

                              </a>

                          )}

                          {/* DOCUMENT */}

                          {msg.file_url &&
                            !isImage(
                              msg.file_name
                            ) && (

                              <a
                                href={`${API_URL}${msg.file_url}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  textDecoration:
                                    "none",
                                  color: "#333",
                                }}
                              >

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems:
                                      "center",
                                    padding: "8px",
                                    background:
                                      "#f0f2f5",
                                    borderRadius:
                                      "8px",
                                    marginBottom:
                                      msg.message
                                        ? "7px"
                                        : "0",
                                  }}
                                >

                                  <span
                                    style={{
                                      fontSize:
                                        "30px",
                                    }}
                                  >
                                    {getFileIcon(
                                      msg.file_name
                                    )}
                                  </span>

                                  <div
                                    style={{
                                      marginLeft:
                                        "8px",
                                      wordBreak:
                                        "break-word",
                                    }}
                                  >

                                    <strong
                                      style={{
                                        fontSize:
                                          "13px",
                                      }}
                                    >
                                      {
                                        msg.file_name
                                      }
                                    </strong>

                                    <br />

                                    <small className="text-muted">
                                      Open file
                                    </small>

                                  </div>

                                </div>

                              </a>

                          )}

                          {/* TEXT */}

                          {msg.message && (

                            <div
                              style={{
                                whiteSpace:
                                  "pre-wrap",
                                wordBreak:
                                  "break-word",
                                fontSize: "14px",
                              }}
                            >
                              {msg.message}
                            </div>

                          )}

                          {/* TIME */}

                          <div
                            className="d-flex justify-content-end align-items-center"
                            style={{
                              gap: "4px",
                              marginTop: "3px",
                            }}
                          >

                            <small
                              className="text-muted"
                              style={{
                                fontSize: "10px",
                              }}
                            >
                              {msg.created_at
                                ? new Date(
                                    msg.created_at
                                  ).toLocaleTimeString(
                                    [],
                                    {
                                      hour:
                                        "2-digit",
                                      minute:
                                        "2-digit",
                                    }
                                  )
                                : ""}
                            </small>

                            {/* TICKS */}

                            {mine && (

                              <span
                                style={{
                                  fontSize: "13px",
                                  fontWeight:
                                    "bold",
                                  color:
                                    msg.is_read
                                      ? "#34B7F1"
                                      : "#8696a0",
                                }}
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

              {/* SELECTED FILE */}

              {selectedFile && (

                <div
                  style={{
                    background: "#f0f2f5",
                    padding: "7px 12px",
                  }}
                >

                  <div
                    className="d-flex justify-content-between align-items-center bg-white p-2"
                    style={{
                      borderRadius: "8px",
                    }}
                  >

                    <span>
                      📎{" "}
                      <strong>
                        {selectedFile.name}
                      </strong>
                    </span>

                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => {

                        setSelectedFile(null);

                        if (
                          fileInputRef.current
                        ) {
                          fileInputRef.current.value =
                            "";
                        }

                      }}
                    >
                      ✕
                    </button>

                  </div>

                </div>

              )}

              {/* MESSAGE INPUT */}

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
                  >
                    📎
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.csv"
                    onChange={(e) => {

                      const file =
                        e.target.files?.[0];

                      if (!file) return;

                      if (
                        file.size >
                        10 * 1024 * 1024
                      ) {

                        alert(
                          "Maximum file size is 10 MB"
                        );

                        e.target.value = "";

                        return;
                      }

                      setSelectedFile(file);

                    }}
                  />

                  {/* EMOJI */}

                  <button
                    className="btn btn-light"
                    onClick={() =>
                      setMessage(
                        (prev) =>
                          prev + " 😊"
                      )
                    }
                  >
                    😊
                  </button>

                  {/* MESSAGE */}

                  <input
                    type="text"
                    className="form-control"
                    placeholder={`Message ${adminName}...`}
                    value={message}
                    onChange={(e) =>
                      setMessage(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {

                      if (
                        e.key === "Enter" &&
                        !e.shiftKey
                      ) {

                        e.preventDefault();

                        sendMessage();

                      }

                    }}
                  />

                  {/* SEND */}

                  <button
                    className="btn text-white"
                    style={{
                      background:
                        "rgb(2,26,77)",
                      minWidth: "50px",
                    }}
                    onClick={sendMessage}
                  >
                    ➤
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </InternLayout>
  );
}

export default InternMessages;