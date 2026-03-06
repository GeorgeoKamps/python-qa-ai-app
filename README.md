# 📄 Document Q&A

An AI-powered chatbot that lets you upload a PDF and have a conversation about its contents.

Built with **FastAPI** (Python backend) + **React** (frontend) + **Claude AI**.

---

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

---

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:
```
ANTHROPIC_API_KEY=your-api-key-here
```

Start the server:
```bash
uvicorn main:app --reload
```

API running at `http://localhost:8000` — docs at `http://localhost:8000/docs`

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App running at `http://localhost:5173`

---

## How to Use

1. Open `http://localhost:5173`
2. Click the upload box and select a PDF
3. Wait for the document to be processed
4. Type a question in the chat box and hit Send
5. Ask follow-up questions — the AI remembers the conversation

---

## Project Structure

```
document-qa/
├── backend/
│   ├── main.py            # FastAPI app — all routes and logic
│   ├── requirements.txt   # Python dependencies
│   ├── .env               # API key (never commit this)
│   └── uploads/           # Uploaded PDFs saved here
└── frontend/
    └── src/
        └── App.jsx        # React app — all UI and state
```

---

## API Endpoints

| Method | Endpoint  | Description                        |
|--------|-----------|------------------------------------|
| GET    | `/`       | Health check                       |
| GET    | `/health` | Status check                       |
| POST   | `/upload` | Upload a PDF, returns extracted text |
| POST   | `/ask`    | Ask a question, returns AI answer  |

---

## Tech Stack

| Layer    | Technology          |
|----------|---------------------|
| Backend  | FastAPI + Python    |
| Frontend | React + Vite        |
| AI       | Claude (Anthropic)  |
| PDF      | PyPDF2              |
| HTTP     | Axios               |
