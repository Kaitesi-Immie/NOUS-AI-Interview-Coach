from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
import os, sys, json
from dotenv import load_dotenv
from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware
from jose import jwt, JWTError
import httpx
from datetime import datetime, timedelta

load_dotenv()

OPENAI_API_KEY       = os.getenv("OPENAI_API_KEY")
GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
JWT_SECRET           = os.getenv("JWT_SECRET", "changeme-use-a-long-random-string")
FRONTEND_URL         = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL          = os.getenv("BACKEND_URL", "http://localhost:8000")

sys.path.append(os.path.dirname(__file__))
from openai import OpenAI

app = FastAPI(title="NOUS AI Interview Coach API")

# Session middleware — required for OAuth state
app.add_middleware(SessionMiddleware, secret_key=JWT_SECRET)

# CORS — allow both local dev and deployed frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        FRONTEND_URL,
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# ── OAuth ──────────────────────────────────────────────────────────────────
oauth = OAuth()
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

# ── JWT ────────────────────────────────────────────────────────────────────
def create_jwt(user: dict) -> str:
    payload = {
        "sub":     user["email"],
        "name":    user.get("name", ""),
        "email":   user["email"],
        "picture": user.get("picture", ""),
        "exp":     datetime.utcnow() + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def decode_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ── Auth routes ────────────────────────────────────────────────────────────
@app.get("/auth/google")
async def auth_google(request: Request):
    redirect_uri = f"{BACKEND_URL}/auth/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/callback")
async def auth_callback(request: Request):
    try:
        token     = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")
        if not user_info:
            async with httpx.AsyncClient() as client:
                resp      = await client.get(
                    "https://openidconnect.googleapis.com/v1/userinfo",
                    headers={"Authorization": f"Bearer {token['access_token']}"}
                )
                user_info = resp.json()

        jwt_token = create_jwt({
            "email":   user_info["email"],
            "name":    user_info.get("name", ""),
            "picture": user_info.get("picture", ""),
        })
        return RedirectResponse(f"{FRONTEND_URL}/auth/success?token={jwt_token}")
    except Exception as e:
        return RedirectResponse(f"{FRONTEND_URL}/auth/error?message={str(e)}")

@app.get("/auth/me")
async def auth_me(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token   = auth_header.split(" ", 1)[1]
    payload = decode_jwt(token)
    return {
        "email":   payload["email"],
        "name":    payload["name"],
        "picture": payload.get("picture", ""),
    }

# ── Models ─────────────────────────────────────────────────────────────────
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str = "gpt-4o-mini"
    messages: List[Message]
    context: Optional[str] = ""
    mode: str = "Technical Interview"
    level: str = "Senior"
    technique: str = "role"

class ScorecardRequest(BaseModel):
    model: str = "gpt-4o-mini"
    messages: List[Message]
    mode: str
    level: str

# ── Technique prompts ──────────────────────────────────────────────────────
TECHNIQUE_PROMPTS = {
    "zero": "Ask direct questions without examples. Evaluate responses objectively.",
    "few":  "Illustrate expectations with brief examples before asking each question.",
    "cot":  "Encourage step-by-step reasoning. Ask the candidate to think aloud.",
    "role": "Embody a senior hiring manager named Sarah Chen. Be warm but rigorous.",
    "fmt":  "Request structured responses: situation, approach, outcome, reflection.",
}

def build_system_prompt(req: ChatRequest) -> str:
    technique_note = TECHNIQUE_PROMPTS.get(req.technique, TECHNIQUE_PROMPTS["role"])
    context_block  = f"\nCandidate context:\n{req.context.strip()}" if req.context.strip() else ""
    return f"""You are an expert AI interview coach conducting a {req.mode} at {req.level} level.
{technique_note}

Rules:
- Ask ONE focused question at a time.
- After each candidate response: briefly acknowledge strengths, note ONE improvement, then ask the next question.
- Use **bold** to highlight key terms and follow-up questions.
- Keep responses under 200 words.
- Do not break character.
{context_block}"""

# ── /chat ──────────────────────────────────────────────────────────────────
@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        client  = OpenAI(api_key=OPENAI_API_KEY)
        history = [{"role": m.role, "content": m.content} for m in req.messages]
        response = client.chat.completions.create(
            model=req.model,
            max_tokens=400,
            messages=[
                {"role": "system", "content": build_system_prompt(req)},
                *history,
            ],
        )
        reply      = response.choices[0].message.content
        usage      = response.usage
        input_tok  = usage.prompt_tokens
        output_tok = usage.completion_tokens

        PRICING = {
            "gpt-4o-mini": {"input": 0.15, "output": 0.60},
            "gpt-4o":      {"input": 5.00, "output": 15.00},
        }
        p    = PRICING.get(req.model, PRICING["gpt-4o-mini"])
        cost = (input_tok / 1_000_000) * p["input"] + (output_tok / 1_000_000) * p["output"]

        return {
            "message": reply,
            "tokens":  {"input": input_tok, "output": output_tok},
            "cost":    round(cost, 6),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── /scorecard ─────────────────────────────────────────────────────────────
@app.post("/scorecard")
async def scorecard(req: ScorecardRequest):
    try:
        client     = OpenAI(api_key=OPENAI_API_KEY)
        transcript = "\n".join(f"{m.role.upper()}: {m.content}" for m in req.messages)
        prompt = f"""You are evaluating a {req.mode} at {req.level} level.
Transcript:
{transcript}

Return ONLY valid JSON (no markdown) with this exact structure:
{{
  "overall": <integer 0-100>,
  "competencies": [
    {{"label": "Technical Depth",       "score": <0-100>}},
    {{"label": "Communication Clarity", "score": <0-100>}},
    {{"label": "Problem-Solving",       "score": <0-100>}},
    {{"label": "System Thinking",       "score": <0-100>}},
    {{"label": "Trade-off Reasoning",   "score": <0-100>}}
  ],
  "strengths":    [<string>, <string>],
  "improvements": [<string>, <string>]
}}"""
        response = client.chat.completions.create(
            model=req.model,
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        data = json.loads(response.choices[0].message.content)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Health ─────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "NOUS AI backend running"}