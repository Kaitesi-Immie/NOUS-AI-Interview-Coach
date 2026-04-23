"""
Configuration file for Interview Coach
Contains all settings, constants, and configuration parameters
"""

# OpenAI Model Settings
DEFAULT_MODEL = "gpt-4o-mini"
AVAILABLE_MODELS = [
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-3.5-turbo"
]

# Model Pricing (per 1M tokens) - Updated as of January 2025
MODEL_PRICING = {
    "gpt-4o-mini": {
        "input": 0.150,   # $0.150 per 1M input tokens
        "output": 0.600   # $0.600 per 1M output tokens
    },
    "gpt-4o": {
        "input": 2.50,    # $2.50 per 1M input tokens
        "output": 10.00   # $10.00 per 1M output tokens
    },
    "gpt-3.5-turbo": {
        "input": 0.50,    # $0.50 per 1M input tokens
        "output": 1.50    # $1.50 per 1M output tokens
    }
}

# Temperature Settings
DEFAULT_TEMPERATURE = 0.7
MIN_TEMPERATURE = 0.0
MAX_TEMPERATURE = 1.0

# Interview Configuration
INTERVIEW_MODES = [
    "Technical Interview",
    "Behavioral Interview",
    "Case Study Interview",
    "System Design Interview"
]

DIFFICULTY_LEVELS = [
    "Junior",
    "Mid-level",
    "Senior"
]

# Security and Validation Settings
MAX_INPUT_LENGTH = 2000  # Maximum characters for user input
MIN_INPUT_LENGTH = 5     # Minimum characters for user input
MAX_QUESTIONS_PER_SESSION = 20  # Rate limiting

# Blocked/Suspicious Patterns for Input Validation
SUSPICIOUS_PATTERNS = [
    "ignore previous instructions",
    "ignore all previous",
    "disregard previous",
    "forget everything",
    "system:",
    "assistant:",
    "new instructions:",
    "<script>",
    "javascript:",
    "eval(",
    "exec("
]

# UI Configuration
APP_TITLE = "Interview Coach"
APP_SUBTITLE = "Practice & Ace Your Next Interview"
APP_ICON = "🎯"

# Color Scheme (for CSS)
COLORS = {
    "primary": "#2E86AB",
    "secondary": "#A23B72",
    "background": "#F8F9FA",
    "ai_bubble": "#E3F2FD",
    "user_bubble": "#F5F5F5",
    "text": "#2C3E50",
    "success": "#4CAF50",
    "warning": "#FF9800",
    "error": "#F44336"
}

# Export Settings
EXPORT_FORMATS = ["TXT", "PDF"]  # Future: Add PDF export
DEFAULT_EXPORT_FORMAT = "TXT"

# Session Configuration
SESSION_TIMEOUT = 3600  # 1 hour in seconds
MAX_CONVERSATION_LENGTH = 50  # Maximum messages in conversation

# API Configuration
API_TIMEOUT = 30  # Seconds
MAX_RETRIES = 3
RETRY_DELAY = 2  # Seconds

# Help Text
HELP_TEXT = {
    "api_key": "Enter your OpenAI API key. Get one at https://platform.openai.com/api-keys",
    "temperature": "Lower values (0.0-0.3) = focused and consistent. Higher values (0.7-1.0) = creative and varied.",
    "difficulty": "Adjust the complexity of interview questions based on your experience level.",
    "interview_mode": "Choose the type of interview you want to practice for.",
    "cost": "Estimated cost based on token usage. Actual cost may vary slightly."
}

# Success Messages
SUCCESS_MESSAGES = {
    "api_key_set": "✅ API Key configured successfully",
    "interview_started": "🚀 Interview started! Good luck!",
    "interview_reset": "🔄 Interview reset. Ready for a new session!",
    "export_success": "📥 Conversation exported successfully"
}

# Error Messages
ERROR_MESSAGES = {
    "no_api_key": "⚠️ Please enter your OpenAI API key to begin",
    "invalid_input": "❌ Invalid input. Please check your message.",
    "rate_limit": "❌ Rate limit reached. Please start a new session.",
    "api_error": "❌ Error communicating with OpenAI. Please try again.",
    "auth_error": "❌ Invalid API Key. Please check your credentials."
}