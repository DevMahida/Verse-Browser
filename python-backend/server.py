# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
load_dotenv()

import os
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field

# Import core RAG logic functions
import core_logic

app = FastAPI(
    title="AI Browser RAG Backend",
    description="Backend API for text parsing, embedding, retrieval, LLM querying, and AI actions",
    version="2.0.0"
)

# Allow CORS for all origins since it will be deployed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas ---

class ProcessHtmlRequest(BaseModel):
    html: str
    chunk_size: int = Field(default=50, ge=1)
    overlap: int = Field(default=10, ge=0)

class ProcessHtmlResponse(BaseModel):
    chunks: list[str]

class EmbedRequest(BaseModel):
    texts: list[str]

class EmbedResponse(BaseModel):
    embeddings: list[list[float]]

class RetrieveRequest(BaseModel):
    query: str
    chunks: list[str]
    embeddings: list[list[float]]
    top_k: int = Field(default=2, ge=1)

class RetrievalResultItem(BaseModel):
    score: float
    index: int
    text: str

class RetrieveResponse(BaseModel):
    results: list[RetrievalResultItem]

class AnswerRequest(BaseModel):
    query: str
    context: str
    api_key: str | None = None
    model: str | None = None

class AnswerResponse(BaseModel):
    answer: str

class UnifiedRagRequest(BaseModel):
    html: str = ""
    text: str = ""
    query: str
    chunk_size: int = Field(default=50, ge=1)
    overlap: int = Field(default=10, ge=0)
    top_k: int = Field(default=2, ge=1)
    title: str = ""
    url: str = ""
    selected_text: str = ""
    api_key: str | None = None
    model: str | None = None
    mcp_tools: str = ""

class UnifiedRagResponse(BaseModel):
    answer: str
    retrieved_chunks: list[RetrievalResultItem]

# --- AI Action Schemas ---

class TextRequest(BaseModel):
    text: str
    api_key: str | None = None
    model: str | None = None

class TranslateRequest(BaseModel):
    text: str
    target_language: str
    api_key: str | None = None
    model: str | None = None

class ExtractRequest(BaseModel):
    text: str
    data_type: str
    api_key: str | None = None
    model: str | None = None

class GeneratePostRequest(BaseModel):
    text: str
    platform: str
    api_key: str | None = None
    model: str | None = None

class RewriteRequest(BaseModel):
    text: str
    style: str
    api_key: str | None = None
    model: str | None = None

class ActionResponse(BaseModel):
    result: str

# --- Route Handlers ---

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AI Browser RAG Backend API is running.", "version": "2.0.0"}

@app.post("/process-html", response_model=ProcessHtmlResponse)
def process_html(payload: ProcessHtmlRequest):
    try:
        clean_text = core_logic.extract_clean_prose(payload.html)
        chunks = core_logic.chunk_text(clean_text, payload.chunk_size, payload.overlap)
        return ProcessHtmlResponse(chunks=chunks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/embed", response_model=EmbedResponse)
def embed_chunks(payload: EmbedRequest):
    try:
        embeddings = core_logic.embed_texts(payload.texts)
        return EmbedResponse(embeddings=embeddings)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retrieve", response_model=RetrieveResponse)
def retrieve(payload: RetrieveRequest):
    try:
        if len(payload.chunks) != len(payload.embeddings):
            raise HTTPException(status_code=400, detail="The number of chunks must match the number of embeddings.")
        results = core_logic.retrieve_top_chunks(payload.query, payload.chunks, payload.embeddings, payload.top_k)
        return RetrieveResponse(results=results)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/answer", response_model=AnswerResponse)
def get_answer(payload: AnswerRequest):
    try:
        answer = core_logic.query_llm(payload.query, payload.context, payload.api_key, model=payload.model)
        return AnswerResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag", response_model=UnifiedRagResponse)
def run_unified_rag(payload: UnifiedRagRequest):
    try:
        # Step 1: Clean and chunk HTML
        input_content = payload.html if payload.html else payload.text
        clean_text = core_logic.extract_clean_prose(input_content)
        chunks = core_logic.chunk_text(clean_text, payload.chunk_size, payload.overlap)
        
        if not chunks:
            return UnifiedRagResponse(answer="No text chunks could be extracted from the HTML content.", retrieved_chunks=[])
            
        # Step 2: Embed chunks
        embeddings = core_logic.embed_texts(chunks)
        
        # Step 3: Retrieve top chunks
        top_chunks = core_logic.retrieve_top_chunks(payload.query, chunks, embeddings, payload.top_k)
        
        # Step 4: Format context and query LLM
        context = "\n\n".join([f"[Source Chunk {item['index'] + 1}]: {item['text']}" for item in top_chunks])
        answer = core_logic.query_llm(
            query=payload.query,
            context=context,
            title=payload.title,
            url=payload.url,
            selected_text=payload.selected_text,
            api_key=payload.api_key,
            model=payload.model,
            mcp_tools=payload.mcp_tools
        )
        
        return UnifiedRagResponse(answer=answer, retrieved_chunks=top_chunks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- AI Action Endpoints ---

@app.post("/summarize", response_model=ActionResponse)
def summarize(payload: TextRequest):
    try:
        result = core_logic.summarize_text(payload.text, payload.api_key, payload.model)
        return ActionResponse(result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain", response_model=ActionResponse)
def explain(payload: TextRequest):
    try:
        result = core_logic.explain_text(payload.text, payload.api_key, payload.model)
        return ActionResponse(result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate", response_model=ActionResponse)
def translate(payload: TranslateRequest):
    try:
        result = core_logic.translate_text(payload.text, payload.target_language, payload.api_key, payload.model)
        return ActionResponse(result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract", response_model=ActionResponse)
def extract(payload: ExtractRequest):
    try:
        result = core_logic.extract_data(payload.text, payload.data_type, payload.api_key, payload.model)
        return ActionResponse(result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-post", response_model=ActionResponse)
def generate_post(payload: GeneratePostRequest):
    try:
        result = core_logic.generate_post(payload.text, payload.platform, payload.api_key, payload.model)
        return ActionResponse(result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rewrite", response_model=ActionResponse)
def rewrite(payload: RewriteRequest):
    try:
        result = core_logic.rewrite_text(payload.text, payload.style, payload.api_key, payload.model)
        return ActionResponse(result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/key-points", response_model=ActionResponse)
def key_points(payload: TextRequest):
    try:
        result = core_logic.list_key_points(payload.text, payload.api_key, payload.model)
        return ActionResponse(result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/faqs", response_model=ActionResponse)
def faqs(payload: TextRequest):
    try:
        result = core_logic.generate_faqs(payload.text, payload.api_key, payload.model)
        return ActionResponse(result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/study-notes", response_model=ActionResponse)
def study_notes(payload: TextRequest):
    try:
        result = core_logic.create_study_notes(payload.text, payload.api_key, payload.model)
        return ActionResponse(result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # pyrefly: if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    # pyrefly: ignore [missing-import]
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
