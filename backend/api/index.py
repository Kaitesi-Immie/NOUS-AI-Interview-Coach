from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import os, sys, json, hashlib, hmac
from dotenv import load_dotenv
from jose import jwt, JWTError
import httpx
from datetime import datetime, timedelta

load_dotenv()

OPENAI_API_KEY       = os.getenv("OPENAI_API_KEY")
GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
JWT_SECRET           = os.getenv("JWT_SECRET", "changeme-use-a-long-random-string")
FRONTEND_URL         = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
BACKEND_URL          = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")

sys.path.append(os.path.dirname(__file__))
from openai import OpenAI

app = FastAPI(title="NOUS AI Interview Coach API")

# ── CORS ───────────────────────────────────────────────────────────────────
# Must list origins explicitly when allow_credentials=True
allowed_origins = list(set([
    "http://localhost:5173",
    "http://localhost:3000",
    FRONTEND_URL,
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
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

# ── Simple in-memory user store (email/password) ───────────────────────────
# For production, replace with a real database (Supabase, PlanetScale, etc.)
# This persists only within a single serverless instance lifetime.
_users: dict = {}

def hash_password(password: str) -> str:
    return hmac.new(JWT_SECRET.encode(), password.encode(), hashlib.sha256).hexdigest()

# ── Google OAuth — stateless PKCE-free flow ────────────────────────────────
# Vercel serverless can't maintain session state between requests.
# We use the direct redirect approach without authlib session state.

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

@app.get("/auth/google")
async def auth_google(request: Request):
    """Redirect to Google's OAuth consent screen."""
    callback_url = f"{BACKEND_URL}/auth/callback"
    params = (
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={callback_url}"
        f"&response_type=code"
        f"&scope=openid%20email%20profile"
        f"&access_type=offline"
    )
    return RedirectResponse(GOOGLE_AUTH_URL + params)

@app.get("/auth/callback")
async def auth_callback(request: Request):
    """Exchange Google code for user info, mint JWT, redirect to frontend."""
    code = request.query_params.get("code")
    error = request.query_params.get("error")

    if error or not code:
        return RedirectResponse(f"{FRONTEND_URL}?auth_error=1")

    callback_url = f"{BACKEND_URL}/auth/callback"

    try:
        # Exchange code for tokens
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(GOOGLE_TOKEN_URL, data={
                "code":          code,
                "client_id":     GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri":  callback_url,
                "grant_type":    "authorization_code",
            })
            token_data = token_resp.json()

            if "error" in token_data:
                raise Exception(token_data.get("error_description", "Token exchange failed"))

            # Fetch user info
            userinfo_resp = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {token_data['access_token']}"}
            )
            user_info = userinfo_resp.json()

        jwt_token = create_jwt({
            "email":   user_info["email"],
            "name":    user_info.get("name", ""),
            "picture": user_info.get("picture", ""),
        })
        # Redirect to frontend root with token as query param
        return RedirectResponse(f"{FRONTEND_URL}?token={jwt_token}")

    except Exception as e:
        return RedirectResponse(f"{FRONTEND_URL}?auth_error=1")

# ── Email auth routes ───────────────────────────────────────────────────────
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/auth/signup")
async def auth_signup(req: SignupRequest):
    if not req.name or not req.email or not req.password:
        raise HTTPException(status_code=400, detail="All fields are required.")
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    if req.email in _users:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    _users[req.email] = {
        "name":     req.name,
        "email":    req.email,
        "picture":  "",
        "password": hash_password(req.password),
    }
    user = {k: v for k, v in _users[req.email].items() if k != "password"}
    token = create_jwt(user)
    return {"token": token, "user": user}

@app.post("/auth/login")
async def auth_login(req: LoginRequest):
    if not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    user_record = _users.get(req.email)
    if not user_record or user_record["password"] != hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user = {k: v for k, v in user_record.items() if k != "password"}
    token = create_jwt(user)
    return {"token": token, "user": user}

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
            "gpt-4o-mini": {"input": 0.15,  "output": 0.60},
            "gpt-4o":      {"input": 5.00,  "output": 15.00},
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