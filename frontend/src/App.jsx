import { useState, useRef, useEffect } from "react"
import axios from "axios"

export default function App() {
  const [documentText, setDocumentText] = useState("")
  const [filename, setFilename] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState("")
  const [asking, setAsking] = useState(false)

  const fileInputRef = useRef(null)
  const chatBottomRef = useRef(null)

  // Auto scroll to bottom whenever messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadError("")
    setDocumentText("")
    setFilename("")
    setMessages([])
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await axios.post(
        "http://localhost:8000/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )

      setDocumentText(response.data.text)
      setFilename(response.data.filename)

    } catch (err) {
      setUploadError(
        err.response?.data?.detail || "Upload failed. Please try again."
      )
    } finally {
      setUploading(false)
    }
  }

  const handleAsk = async () => {
    if (!question.trim() || asking) return

    const userMessage = { role: "user", content: question }

    // Add user message to chat immediately
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setQuestion("")
    setAsking(true)

    try {
      const response = await axios.post("http://localhost:8000/ask", {
        question: question,
        document_text: documentText,
        // Send history without the message we just added
        history: messages
      })

      // Add Claude's answer to the chat
      const assistantMessage = {
        role: "assistant",
        content: response.data.answer
      }
      setMessages([...updatedMessages, assistantMessage])

    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      // Show error as a chat message
      setMessages([...updatedMessages, {
        role: "assistant",
        content: "❌ Sorry, something went wrong. Please try again."
      }])
    } finally {
      setAsking(false)
    }
  }

  // Allow sending with Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <div style={styles.container}>

      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>📄 Document Q&A</h1>
        <p style={styles.headerSubtitle}>Upload a PDF and ask questions about it</p>
      </header>

      <main style={styles.main}>

        {/* LEFT PANEL */}
        <div style={styles.leftPanel}>
          <h2 style={styles.panelTitle}>Upload Document</h2>

          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            onChange={handleUpload}
            style={{ display: "none" }}
          />

          <div
            style={{
              ...styles.uploadBox,
              opacity: uploading ? 0.6 : 1
            }}
            onClick={() => !uploading && fileInputRef.current.click()}
          >
            {uploading ? (
              <>
                <p>⏳ Uploading...</p>
                <p style={styles.uploadHint}>Please wait</p>
              </>
            ) : (
              <>
                <p>📁 Click to upload PDF</p>
                <p style={styles.uploadHint}>Only .pdf files supported</p>
              </>
            )}
          </div>

          {filename && (
            <div style={styles.fileInfo}>
              ✅ <strong>{filename}</strong>
              <p style={styles.charCount}>
                {documentText.length.toLocaleString()} characters extracted
              </p>
            </div>
          )}

          {uploadError && (
            <div style={styles.errorBox}>
              ❌ {uploadError}
            </div>
          )}

          {/* Conversation stats */}
          {messages.length > 0 && (
            <div style={styles.statsBox}>
              💬 {Math.floor(messages.length / 2)} questions asked
              <button
                style={styles.clearButton}
                onClick={() => setMessages([])}
              >
                Clear chat
              </button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.rightPanel}>
          <h2 style={styles.panelTitle}>Ask Questions</h2>

          {/* Chat messages */}
          <div style={styles.chatBox}>
            {messages.length === 0 ? (
              <p style={styles.placeholder}>
                {!documentText
                  ? "Upload a document to start chatting..."
                  : "Document ready! Ask your first question below."}
              </p>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.messageBubble,
                      ...(msg.role === "user"
                        ? styles.userBubble
                        : styles.assistantBubble)
                    }}
                  >
                    <div style={styles.messageRole}>
                      {msg.role === "user" ? "🧑 You" : "🤖 Assistant"}
                    </div>
                    <div style={styles.messageContent}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {/* Loading bubble while waiting for answer */}
                {asking && (
                  <div style={{
                    ...styles.messageBubble,
                    ...styles.assistantBubble
                  }}>
                    <div style={styles.messageRole}>🤖 Assistant</div>
                    <div style={styles.messageContent}>⏳ Thinking...</div>
                  </div>
                )}

                {/* Invisible element we scroll to */}
                <div ref={chatBottomRef} />
              </>
            )}
          </div>

          {/* Input area */}
          <div style={styles.inputRow}>
            <input
              style={{
                ...styles.input,
                opacity: !documentText ? 0.5 : 1
              }}
              type="text"
              placeholder={
                !documentText
                  ? "Upload a document first..."
                  : "Ask a question about your document..."
              }
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!documentText || asking}
            />
            <button
              style={{
                ...styles.button,
                opacity: !documentText || asking ? 0.5 : 1
              }}
              onClick={handleAsk}
              disabled={!documentText || asking}
            >
              {asking ? "..." : "Send"}
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#2563eb",
    color: "white",
    padding: "20px 40px",
  },
  headerTitle: {
    fontSize: "24px",
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: "14px",
    opacity: 0.85,
    marginTop: "4px",
  },
  main: {
    display: "flex",
    flex: 1,
    gap: "24px",
    padding: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
  },
  leftPanel: {
    width: "320px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  rightPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  panelTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#374151",
  },
  uploadBox: {
    border: "2px dashed #93c5fd",
    borderRadius: "12px",
    padding: "40px 20px",
    textAlign: "center",
    backgroundColor: "white",
    cursor: "pointer",
    color: "#6b7280",
    lineHeight: "2",
  },
  uploadHint: {
    fontSize: "13px",
    color: "#9ca3af",
  },
  fileInfo: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "14px",
    color: "#166534",
  },
  charCount: {
    fontSize: "12px",
    marginTop: "4px",
    opacity: 0.8,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "14px",
    color: "#991b1b",
  },
  statsBox: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "13px",
    color: "#1e40af",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clearButton: {
    background: "none",
    border: "1px solid #93c5fd",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "12px",
    color: "#1e40af",
    cursor: "pointer",
  },
  chatBox: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    minHeight: "400px",
    border: "1px solid #e5e7eb",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  placeholder: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: "40px",
    fontSize: "14px",
  },
  messageBubble: {
    padding: "12px 16px",
    borderRadius: "12px",
    maxWidth: "85%",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  userBubble: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    alignSelf: "flex-end",
    marginLeft: "auto",
  },
  assistantBubble: {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    alignSelf: "flex-start",
  },
  messageRole: {
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "6px",
    opacity: 0.7,
  },
  messageContent: {
    whiteSpace: "pre-wrap",
  },
  inputRow: {
    display: "flex",
    gap: "12px",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
  },
  button: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
}