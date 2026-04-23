"""
Utility functions for Interview Coach
Includes validation, cost calculation, formatting, and export functionality
"""

from typing import Tuple, List, Dict
from datetime import datetime
import re
from config import (
    MAX_INPUT_LENGTH,
    MIN_INPUT_LENGTH,
    SUSPICIOUS_PATTERNS,
    MODEL_PRICING,
    MAX_QUESTIONS_PER_SESSION
)


def validate_input(text: str) -> Tuple[bool, str]:
    """
    Validate user input for security and quality
    
    Args:
        text: User input text
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check if empty
    if not text or not text.strip():
        return False, "Input cannot be empty"
    
    # Check length
    if len(text) < MIN_INPUT_LENGTH:
        return False, f"Input too short. Minimum {MIN_INPUT_LENGTH} characters required"
    
    if len(text) > MAX_INPUT_LENGTH:
        return False, f"Input too long. Maximum {MAX_INPUT_LENGTH} characters allowed"
    
    # Check for suspicious patterns (prompt injection attempts)
    text_lower = text.lower()
    for pattern in SUSPICIOUS_PATTERNS:
        if pattern in text_lower:
            return False, "Input contains suspicious content. Please rephrase your response"
    
    # Check for excessive special characters (possible injection attempt)
    special_char_ratio = sum(1 for c in text if not c.isalnum() and not c.isspace()) / len(text)
    if special_char_ratio > 0.3:
        return False, "Input contains too many special characters"
    
    return True, ""


def calculate_cost(total_tokens: int, model: str) -> float:
    """
    Calculate the cost of API usage
    
    Args:
        total_tokens: Total tokens used
        model: Model name
    
    Returns:
        Estimated cost in USD
    """
    if model not in MODEL_PRICING:
        return 0.0
    
    # Estimate: assume 75% input, 25% output tokens
    input_tokens = int(total_tokens * 0.75)
    output_tokens = int(total_tokens * 0.25)
    
    pricing = MODEL_PRICING[model]
    
    # Calculate cost (pricing is per 1M tokens)
    input_cost = (input_tokens / 1_000_000) * pricing["input"]
    output_cost = (output_tokens / 1_000_000) * pricing["output"]
    
    return input_cost + output_cost


def format_time(seconds: float) -> str:
    """
    Format time in seconds to readable string
    
    Args:
        seconds: Time in seconds
    
    Returns:
        Formatted time string
    """
    if seconds < 60:
        return f"{int(seconds)}s"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        remaining_seconds = int(seconds % 60)
        return f"{minutes}m {remaining_seconds}s"
    else:
        hours = int(seconds / 3600)
        remaining_minutes = int((seconds % 3600) / 60)
        return f"{hours}h {remaining_minutes}m"


def export_conversation(
    messages: List[Dict],
    interview_mode: str,
    difficulty: str
) -> str:
    """
    Export conversation to text format
    
    Args:
        messages: List of message dictionaries
        interview_mode: Type of interview
        difficulty: Difficulty level
    
    Returns:
        Formatted text string
    """
    export_text = []
    
    # Header
    export_text.append("=" * 60)
    export_text.append("INTERVIEW PRACTICE SESSION")
    export_text.append("=" * 60)
    export_text.append(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    export_text.append(f"Interview Type: {interview_mode}")
    export_text.append(f"Difficulty Level: {difficulty}")
    export_text.append(f"Total Questions: {len([m for m in messages if m['role'] == 'assistant'])}")
    export_text.append("=" * 60)
    export_text.append("")
    
    # Conversation
    for i, message in enumerate(messages, 1):
        role = "INTERVIEWER" if message["role"] == "assistant" else "YOU"
        timestamp = message.get("timestamp", datetime.now()).strftime("%H:%M:%S")
        
        export_text.append(f"[{timestamp}] {role}:")
        export_text.append(message["content"])
        export_text.append("")
        export_text.append("-" * 60)
        export_text.append("")
    
    # Footer
    export_text.append("=" * 60)
    export_text.append("END OF SESSION")
    export_text.append("=" * 60)
    
    return "\n".join(export_text)


def check_rate_limit(current_count: int, max_count: int) -> bool:
    """
    Check if rate limit has been reached
    
    Args:
        current_count: Current request count
        max_count: Maximum allowed requests
    
    Returns:
        True if within limit, False if exceeded
    """
    return current_count < max_count


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for safe file system operations
    
    Args:
        filename: Original filename
    
    Returns:
        Sanitized filename
    """
    # Remove or replace invalid characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove leading/trailing spaces and dots
    filename = filename.strip('. ')
    # Limit length
    if len(filename) > 200:
        filename = filename[:200]
    
    return filename


def estimate_tokens(text: str) -> int:
    """
    Rough estimation of token count
    Rule of thumb: ~4 characters per token
    
    Args:
        text: Input text
    
    Returns:
        Estimated token count
    """
    return len(text) // 4


def get_time_greeting() -> str:
    """
    Get appropriate greeting based on time of day
    
    Returns:
        Greeting string
    """
    hour = datetime.now().hour
    
    if 5 <= hour < 12:
        return "Good morning"
    elif 12 <= hour < 17:
        return "Good afternoon"
    elif 17 <= hour < 22:
        return "Good evening"
    else:
        return "Hello"


def format_model_name(model: str) -> str:
    """
    Format model name for display
    
    Args:
        model: Model identifier
    
    Returns:
        Formatted model name
    """
    model_names = {
        "gpt-4o-mini": "GPT-4o Mini",
        "gpt-4o": "GPT-4o",
        "gpt-3.5-turbo": "GPT-3.5 Turbo"
    }
    
    return model_names.get(model, model)


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate text to maximum length
    
    Args:
        text: Text to truncate
        max_length: Maximum length
        suffix: Suffix to add if truncated
    
    Returns:
        Truncated text
    """
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix


def calculate_session_stats(messages: List[Dict]) -> Dict:
    """
    Calculate various statistics about the session
    
    Args:
        messages: List of conversation messages
    
    Returns:
        Dictionary of statistics
    """
    ai_messages = [m for m in messages if m["role"] == "assistant"]
    user_messages = [m for m in messages if m["role"] == "user"]
    
    total_chars = sum(len(m["content"]) for m in messages)
    avg_response_length = (
        sum(len(m["content"]) for m in user_messages) / len(user_messages)
        if user_messages else 0
    )
    
    return {
        "total_exchanges": len(user_messages),
        "total_characters": total_chars,
        "avg_response_length": int(avg_response_length),
        "ai_messages": len(ai_messages),
        "user_messages": len(user_messages)
    }