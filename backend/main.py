from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import os, sys, json, httpx
from dotenv import load_dotenv
from jose import jwt, JWTError
from datetime import datetime, timedelta

# Load env
load_dotenv()
OPENAI_API_KEY     = os.getenv("OPENAI_API_KEY")
GOOGLE_CLIENT_ID   = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
JWT_SECRET         = os.getenv("JWT_SECRET", "change-me-in-production")
FRONTEND_URL       = os.getenv("FRONTEND_URL", "http://localhost:5173")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not found in environment.")
if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    raise RuntimeError("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.")

sys.path.append(os.path.dirname(__file__))

from openai import OpenAI

app = FastAPI(title="NOUS AI Interview Coach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── JWT helpers ────────────────────────────────────────────────────────────
ALGORITHM    = "HS256"
TOKEN_EXPIRE = timedelta(days=7)

def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + TOKEN_EXPIRE
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    return decode_token(auth[7:])

# ── request / response models ──────────────────────────────────────────────
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

# ── technique → system prompt snippet ─────────────────────────────────────
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

# ── Google OAuth ───────────────────────────────────────────────────────────
GOOGLE_AUTH_URL  = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO  = "https://www.googleapis.com/oauth2/v3/userinfo"

@app.get("/auth/google")
async def auth_google(request: Request):
    """Redirect the user to Google's OAuth consent screen."""
    redirect_uri = str(request.base_url) + "auth/callback"
    params = {
        "client_id":     GOOGLE_CLIENT_ID,
        "redirect_uri":  redirect_uri,
        "response_type": "code",
        "scope":         "openid email profile",
        "access_type":   "offline",
        "prompt":        "select_account",
    }
    url = GOOGLE_AUTH_URL + "?" + "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(url)

@app.get("/auth/callback")
async def auth_callback(request: Request, code: str = None, error: str = None):
    """Exchange the OAuth code for tokens, fetch user info, issue JWT."""
    if error or not code:
        return RedirectResponse(f"{FRONTEND_URL}?auth_error={error or 'no_code'}")

    redirect_uri = str(request.base_url) + "auth/callback"

    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        token_resp = await client.post(GOOGLE_TOKEN_URL, data={
            "code":          code,
            "client_id":     GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri":  redirect_uri,
            "grant_type":    "authorization_code",
        })
        if token_resp.status_code != 200:
            return RedirectResponse(f"{FRONTEND_URL}?auth_error=token_exchange_failed")
        tokens = token_resp.json()

        # Fetch user profile
        user_resp = await client.get(GOOGLE_USERINFO, headers={
            "Authorization": f"Bearer {tokens['access_token']}"
        })
        if user_resp.status_code != 200:
            return RedirectResponse(f"{FRONTEND_URL}?auth_error=userinfo_failed")
        profile = user_resp.json()

    # Build JWT with user info embedded
    jwt_token = create_token({
        "sub":     profile.get("sub"),
        "email":   profile.get("email"),
        "name":    profile.get("name"),
        "picture": profile.get("picture"),
    })

    # Redirect back to frontend with the token in the URL fragment
    return RedirectResponse(f"{FRONTEND_URL}?token={jwt_token}")

@app.get("/auth/me")
async def auth_me(request: Request):
    """Return the decoded user from the JWT (for the frontend to verify on load)."""
    user = get_current_user(request)
    return {
        "sub":     user.get("sub"),
        "email":   user.get("email"),
        "name":    user.get("name"),
        "picture": user.get("picture"),
    }

@app.post("/auth/logout")
async def auth_logout():
    """Stateless JWT — client just discards the token. Acknowledged here."""
    return {"ok": True}

# ── /chat ──────────────────────────────────────────────────────────────────
@app.post("/chat")
async def chat(req: ChatRequest, request: Request):
    get_current_user(request)   # 401 if not authenticated
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        history = [{"role": m.role, "content": m.content} for m in req.messages]
        response = client.chat.completions.create(
            model=req.model,
            max_tokens=400,
            messages=[
                {"role": "system", "content": build_system_prompt(req)},
                *history,
            ],
        )
        reply     = response.choices[0].message.content
        usage     = response.usage
        input_tok = usage.prompt_tokens
        out_tok   = usage.completion_tokens

        PRICING = {
            "gpt-4o-mini": {"input": 0.15, "output": 0.60},
            "gpt-4o":      {"input": 5.00, "output": 15.00},
        }
        p    = PRICING.get(req.model, PRICING["gpt-4o-mini"])
        cost = (input_tok / 1_000_000) * p["input"] + (out_tok / 1_000_000) * p["output"]

        return {
            "message": reply,
            "tokens":  {"input": input_tok, "output": out_tok},
            "cost":    round(cost, 6),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── /scorecard ─────────────────────────────────────────────────────────────
@app.post("/scorecard")
async def scorecard(req: ScorecardRequest, request: Request):
    get_current_user(request)   # 401 if not authenticated
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        transcript = "\n".join(
            f"{m.role.upper()}: {m.content}" for m in req.messages
        )
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

# ── health check ───────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "NOUS AI backend running"}