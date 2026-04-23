from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os, sys

# ── allow importing your existing modules ──────────────────────────────────
sys.path.append(os.path.dirname(__file__))

from openai import OpenAI

app = FastAPI(title="NOUS AI Interview Coach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten to your Vercel URL after deploy
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── request / response models ──────────────────────────────────────────────
class Message(BaseModel):
    role: str       # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    api_key: str
    model: str = "gpt-4o-mini"
    messages: List[Message]
    context: Optional[str] = ""
    mode: str = "Technical Interview"
    level: str = "Senior"
    technique: str = "role"

class ScorecardRequest(BaseModel):
    api_key: str
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

# ── /chat ──────────────────────────────────────────────────────────────────
@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        client = OpenAI(api_key=req.api_key)
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

        # basic cost estimate (gpt-4o-mini pricing)
        PRICING = {
            "gpt-4o-mini": {"input": 0.15, "output": 0.60},
            "gpt-4o":      {"input": 5.00, "output": 15.00},
        }
        p = PRICING.get(req.model, PRICING["gpt-4o-mini"])
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
        client = OpenAI(api_key=req.api_key)
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
        import json
        data = json.loads(response.choices[0].message.content)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── health check ───────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "NOUS AI backend running"}