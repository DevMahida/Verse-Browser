import os
# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
from bs4 import BeautifulSoup
# pyrefly: ignore [missing-import]
from openai import OpenAI

_model = None

def get_model():
    """Lazily load the SentenceTransformer model to save memory/startup time."""
    global _model
    if _model is None:
        # pyrefly: ignore [missing-import]
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model

def extract_clean_prose(html_content: str) -> str:
    """Extract clean prose text from HTML, stripping script, style, and nav tags."""
    if not html_content:
        return ""
    soup = BeautifulSoup(html_content, 'html.parser')
    for tag in soup(["script", "style", "nav"]):
        tag.decompose()
    raw_text = soup.get_text(separator=' ')
    clean_text = ' '.join(raw_text.split())
    return clean_text

def chunk_text(text: str, chunk_size: int = 50, overlap: int = 10) -> list[str]:
    """Chunk text using a sliding window based on word count."""
    words = text.split()
    if not words:
        return []
    chunks = []
    step = chunk_size - overlap
    if step <= 0:
        step = 1  # Avoid infinite loop
    
    for i in range(0, len(words), step):
        chunk_words = words[i:i + chunk_size]
        chunk_text = ' '.join(chunk_words)
        chunks.append(chunk_text)
        if i + chunk_size >= len(words):
            break
            
    return chunks

def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of texts using SentenceTransformer."""
    if not texts:
        return []
    model = get_model()
    embeddings = model.encode(texts, show_progress_bar=False)
    # Convert numpy array to standard python list of lists
    return embeddings.tolist()

def cosine_similarity(v1, v2) -> float:
    """Compute cosine similarity between two vectors."""
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return float(dot_product / (norm_v1 * norm_v2))

def retrieve_top_chunks(query: str, chunks: list[str], chunk_embeddings: list[list[float]], top_k: int = 2) -> list[dict]:
    """Retrieve top_k matching chunks for a query using cosine similarity."""
    if not chunks or not chunk_embeddings:
        return []
    
    # Generate query embedding
    model = get_model()
    query_emb = model.encode(query, show_progress_bar=False)
        
    scores = []
    for idx, emb_list in enumerate(chunk_embeddings):
        emb = np.array(emb_list)
        score = cosine_similarity(query_emb, emb)
        scores.append({
            "score": score,
            "index": idx,
            "text": chunks[idx]
        })
        
    # Sort by score descending
    scores.sort(key=lambda x: x["score"], reverse=True)
    return scores[:top_k]


# --- LLM Helper ---

def _call_llm(system_prompt: str, user_text: str, api_key: str | None = None, model: str | None = None) -> str:
    """Internal helper to call OpenRouter LLM with a given system prompt and user text.
    
    If `model` is provided (e.g. 'google/gemini-2.5-flash'), use it directly.
    If `model` is None, fall back to the free-model rotation chain.
    """
    if not api_key:
        api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError(
            "No API key provided. Set the OPENROUTER_API_KEY environment variable "
            "or pass api_key in the request."
        )

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )

    # If a specific model was requested by the user, use it directly
    if model:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_text}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "rate-limited" in error_str.lower():
                return "I am currently overloaded with requests (Rate Limited by the provider). Please try again in a few seconds!"
            print(f"OpenRouter Error with model {model}: {e}")
            return f"Error with model {model}: {error_str}"

    # No specific model — use the free-model fallback chain
    models_to_try = [
        "google/gemma-4-31b-it:free",
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "google/gemma-4-26b-a4b-it:free",
        "openrouter/free"
    ]

    last_error = None
    for fallback_model in models_to_try:
        try:
            response = client.chat.completions.create(
                model=fallback_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_text}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            last_error = e
            continue
            
    # If all models fail, return a polite fallback message instead of crashing with a 500 error
    error_str = str(last_error)
    if "429" in error_str or "rate-limited" in error_str.lower():
        return "I am currently overloaded with requests (Rate Limited by the provider). Please try clicking the action button again in a few seconds!"
    else:
        print(f"OpenRouter Error: {last_error}")
        return f"I encountered an error connecting to the AI provider. Please try again later. Debug: {str(last_error)}"


def query_llm(query: str, context: str, api_key: str | None = None, title: str = "", url: str = "", selected_text: str = "", model: str | None = None, mcp_tools: str = "") -> str:
    """Use OpenRouter LLM to answer a query based on the provided context and metadata."""
    system_prompt = (
        "You are an AI assistant built into the 'Verse' browser. Answer accurately using the provided webpage context. "
        "Be extremely concise and direct. Output NO introductory or conversational filler text."
    )
    
    if mcp_tools:
        system_prompt += (
            f"\n\nYou have access to these tools via MCP: {mcp_tools}\n"
            "If the user's request requires using one of these tools, reply EXACTLY with:\n"
            "[TOOL_CALL: serverName.toolName {\"arg1\":\"val1\"}]\n"
            "Do NOT include any other text when making a tool call."
        )
    
    metadata_lines = []
    if url:
        metadata_lines.append(f"Page URL: {url}")
    if title:
        metadata_lines.append(f"Page Title: {title}")
    if selected_text:
        metadata_lines.append(f"User's Highlighted Text: {selected_text}")
        
    metadata_block = "\n".join(metadata_lines)
    if metadata_block:
        metadata_block = f"--- Page Metadata ---\n{metadata_block}\n---------------------\n\n"
        
    user_text = f"{metadata_block}Context Snippets:\n{context}\n\nUser Query: {query}"
    return _call_llm(system_prompt, user_text, api_key, model)


# --- AI Action Functions ---

def summarize_text(text: str, api_key: str | None = None, model: str | None = None) -> str:
    """Summarize the given text concisely."""
    system_prompt = (
        "Summarize concisely using short bullet points. Output NO filler or conversational text."
    )
    return _call_llm(system_prompt, text, api_key, model)

def explain_text(text: str, api_key: str | None = None, model: str | None = None) -> str:
    """Explain the given text in simple terms."""
    system_prompt = (
        "Explain simply for a beginner. Be extremely concise. Output NO filler text."
    )
    return _call_llm(system_prompt, text, api_key, model)

def translate_text(text: str, target_language: str, api_key: str | None = None, model: str | None = None) -> str:
    """Translate text to the target language."""
    system_prompt = (
        f"Translate the text to {target_language}. Output ONLY the raw translation with NO introductory text."
    )
    return _call_llm(system_prompt, text, api_key, model)

def extract_data(text: str, data_type: str, api_key: str | None = None, model: str | None = None) -> str:
    """Extract specific data (emails, phones, links) from text."""
    system_prompt = (
        f"Extract all {data_type}. Output ONLY a clean list, one item per line. No filler."
    )
    return _call_llm(system_prompt, text, api_key, model)

def generate_post(text: str, platform: str, api_key: str | None = None, model: str | None = None) -> str:
    """Generate a social media post from the text."""
    system_prompt = (
        f"Create a short, engaging {platform} post based on the text. Include hashtags. Output ONLY the post content."
    )
    return _call_llm(system_prompt, text, api_key, model)

def rewrite_text(text: str, style: str, api_key: str | None = None, model: str | None = None) -> str:
    """Rewrite text in a specified style."""
    system_prompt = (
        f"Rewrite in a {style} style. Output ONLY the rewritten text with NO filler."
    )
    return _call_llm(system_prompt, text, api_key, model)

def list_key_points(text: str, api_key: str | None = None, model: str | None = None) -> str:
    """Extract key points from the text."""
    system_prompt = (
        "Extract key points as a numbered list. Be extremely brief. Output NO filler text."
    )
    return _call_llm(system_prompt, text, api_key, model)

def generate_faqs(text: str, api_key: str | None = None, model: str | None = None) -> str:
    """Generate FAQs from the text."""
    system_prompt = (
        "Generate 3-5 FAQs based on the text. Format as 'Q: ...' 'A: ...'. Keep answers strictly concise. Output NO filler."
    )
    return _call_llm(system_prompt, text, api_key, model)

def create_study_notes(text: str, api_key: str | None = None, model: str | None = None) -> str:
    """Create study notes from the text."""
    system_prompt = (
        "Create brief study notes with headings and bullet points. Be extremely concise. Output NO filler text."
    )
    return _call_llm(system_prompt, text, api_key, model)
