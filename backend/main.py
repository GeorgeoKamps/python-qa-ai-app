from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List
import anthropic
import os
import shutil
import PyPDF2

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

app = FastAPI(title="Document Q&A API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---

class Message(BaseModel):
    role: str
    content: str

class QuestionRequest(BaseModel):
    question: str
    document_text: str
    history: List[Message] = []


# --- Routes ---

@app.get("/")
def root():
    return {"message": "Document Q&A API is running!"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


# --- Helpers ---

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with open(file_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            text += page.extract_text() or ""
    return text


# --- Endpoints ---

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    text = extract_text_from_pdf(file_path)

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    
    return {
        "filename": file.filename,
        "text": text,
        "characters": len(text)
    }


@app.post("/ask")
async def ask_question(request: QuestionRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    if not request.document_text.strip():
        raise HTTPException(status_code=400, detail="Document text cannot be empty")

    system_prompt = f"""You are a helpful assistant that answers questions about documents.
    
Here is the document the user has uploaded:
<document>
{request.document_text}
</document>

Rules:
- Answer questions based only on the document above
- If the answer is not in the document, say so clearly
- Keep answers concise and helpful
- Remember the conversation history when answering"""

    messages = []
    
    for msg in request.history:
        messages.append({
            "role": msg.role,
            "content": msg.content
        })
    
    messages.append({
        "role": "user",
        "content": request.question
    })

    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=1024,
        system=system_prompt,
        messages=messages
    )

    answer = message.content[0].text
    return {
        "question": request.question,
        "answer": answer
    }