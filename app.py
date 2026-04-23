"""
Interview Coach - AI-Powered Interview Preparation Application
Main Streamlit application file
"""

import streamlit as st
import openai
from datetime import datetime
from typing import Dict, List
import time

# Import custom modules
from prompts import SYSTEM_PROMPTS, get_prompt_description
from config import (
    DEFAULT_MODEL,
    DEFAULT_TEMPERATURE,
    DIFFICULTY_LEVELS,
    INTERVIEW_MODES,
    MAX_INPUT_LENGTH,
    MAX_QUESTIONS_PER_SESSION
)
from utils import (
    validate_input,
    calculate_cost,
    format_time,
    export_conversation,
    check_rate_limit
)
from styles import load_custom_css

# Page configuration
st.set_page_config(
    page_title="Interview Coach - Practice & Ace Your Interviews",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Load custom styling
load_custom_css()

# Initialize session state
def initialize_session_state():
    """Initialize all session state variables"""
    if 'messages' not in st.session_state:
        st.session_state.messages = []
    if 'total_tokens' not in st.session_state:
        st.session_state.total_tokens = 0
    if 'total_cost' not in st.session_state:
        st.session_state.total_cost = 0.0
    if 'question_count' not in st.session_state:
        st.session_state.question_count = 0
    if 'session_start' not in st.session_state:
        st.session_state.session_start = datetime.now()
    if 'interview_active' not in st.session_state:
        st.session_state.interview_active = False
    if 'request_count' not in st.session_state:
        st.session_state.request_count = 0
    if 'user_context' not in st.session_state:
        st.session_state.user_context = ""

initialize_session_state()


def call_openai_api(
    messages: List[Dict],
    model: str,
    temperature: float,
    api_key: str
) -> Dict:
    """
    Call OpenAI API with error handling
    
    Args:
        messages: List of message dictionaries
        model: Model name to use
        temperature: Temperature setting
        api_key: OpenAI API key
    
    Returns:
        Dictionary with response content and usage statistics
    """
    try:
        client = openai.OpenAI(api_key=api_key)
        
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=1000
        )
        
        return {
            'content': response.choices[0].message.content,
            'tokens': response.usage.total_tokens,
            'prompt_tokens': response.usage.prompt_tokens,
            'completion_tokens': response.usage.completion_tokens
        }
    
    except openai.AuthenticationError:
        st.error("❌ Invalid API Key. Please check your OpenAI API key.")
        return None
    except openai.RateLimitError:
        st.error("❌ Rate limit exceeded. Please wait a moment and try again.")
        return None
    except openai.APIError as e:
        st.error(f"❌ OpenAI API Error: {str(e)}")
        return None
    except Exception as e:
        st.error(f"❌ Unexpected error: {str(e)}")
        return None


def start_interview(user_context: str):
    """Initialize a new interview session with user's preparation goals"""
    st.session_state.interview_active = True
    st.session_state.messages = []
    st.session_state.question_count = 0
    st.session_state.session_start = datetime.now()
    st.session_state.request_count = 0
    st.session_state.user_context = user_context
    
    # Get initial question from AI
    system_prompt = SYSTEM_PROMPTS[st.session_state.selected_style]
    
    # Customize system prompt based on settings and user context
    context = f"""
    User's Preparation Goals: {user_context}
    Interview Mode: {st.session_state.interview_mode}
    Difficulty Level: {st.session_state.difficulty}
    
    Based on the user's goals, start the interview with an appropriate opening question that addresses their specific preparation needs.
    """
    
    messages = [
        {"role": "system", "content": system_prompt + "\n\n" + context},
        {"role": "user", "content": "Please start the interview based on my preparation goals."}
    ]
    
    with st.spinner("🤖 AI Interviewer is preparing your first question..."):
        response = call_openai_api(
            messages=messages,
            model=st.session_state.model,
            temperature=st.session_state.temperature,
            api_key=st.session_state.api_key
        )
    
    if response:
        st.session_state.messages.append({
            "role": "assistant",
            "content": response['content'],
            "timestamp": datetime.now()
        })
        st.session_state.total_tokens += response['tokens']
        st.session_state.total_cost += calculate_cost(
            response['tokens'],
            st.session_state.model
        )
        st.session_state.question_count += 1
        st.session_state.request_count += 1


def reset_interview():
    """Reset the interview session"""
    st.session_state.interview_active = False
    st.session_state.messages = []
    st.session_state.total_tokens = 0
    st.session_state.total_cost = 0.0
    st.session_state.question_count = 0
    st.session_state.session_start = datetime.now()
    st.session_state.request_count = 0
    st.session_state.user_context = ""


# Sidebar Configuration
with st.sidebar:
    st.title("⚙️ Interview Settings")
    
    # API Key Input
    st.markdown("### 🔑 API Configuration")
    api_key = st.text_input(
        "OpenAI API Key",
        type="password",
        help="Enter your OpenAI API key. Get one at https://platform.openai.com/api-keys",
        key="api_key"
    )
    
    if api_key:
        st.success("✅ API Key configured")
    else:
        st.warning("⚠️ Please enter your API key to start")
    
    st.markdown("---")
    
    # Interview Style Selection
    st.markdown("### 🎨 Interview Style")
    selected_style = st.selectbox(
        "Prompting Technique",
        options=list(SYSTEM_PROMPTS.keys()),
        help="Choose different AI prompting techniques",
        key="selected_style"
    )
    
    # Show description of selected style
    with st.expander("ℹ️ About this style"):
        st.info(get_prompt_description(selected_style))
    
    st.markdown("---")
    
    # Model Settings
    st.markdown("### 🤖 Model Settings")
    model = st.selectbox(
        "AI Model",
        options=["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
        index=0,
        help="GPT-4o-mini is recommended for cost-effectiveness",
        key="model"
    )
    
    temperature = st.slider(
        "Temperature",
        min_value=0.0,
        max_value=1.0,
        value=DEFAULT_TEMPERATURE,
        step=0.1,
        help="Lower = more focused and deterministic, Higher = more creative and varied",
        key="temperature"
    )
    
    # Real-time temperature explanation
    if temperature < 0.3:
        st.caption("🎯 Very focused and consistent responses")
    elif temperature < 0.7:
        st.caption("⚖️ Balanced creativity and consistency")
    else:
        st.caption("🎨 Creative and varied responses")
    
    st.markdown("---")
    
    # Interview Configuration
    st.markdown("### 🎯 Interview Configuration")
    
    interview_mode = st.selectbox(
        "Interview Type",
        options=INTERVIEW_MODES,
        help="Choose the type of interview to practice",
        key="interview_mode"
    )
    
    difficulty = st.select_slider(
        "Difficulty Level",
        options=DIFFICULTY_LEVELS,
        value="Mid-level",
        help="Adjust question complexity",
        key="difficulty"
    )
    
    st.markdown("---")
    
    # Session Statistics
    st.markdown("### 📊 Session Stats")
    
    col1, col2 = st.columns(2)
    with col1:
        st.metric("Questions", st.session_state.question_count)
        st.metric("Tokens Used", st.session_state.total_tokens)
    with col2:
        session_time = (datetime.now() - st.session_state.session_start).total_seconds()
        st.metric("Time", format_time(session_time))
        st.metric("Est. Cost", f"${st.session_state.total_cost:.4f}")
    
    st.markdown("---")
    
    # Help Section
    with st.expander("❓ Help & Tips"):
        st.markdown("""
        **Getting Started:**
        1. Enter your OpenAI API key
        2. Choose your interview style and settings
        3. Describe what you want to prepare for
        4. Click "Start Interview" to begin
        
        **Tips for Best Results:**
        - Be specific in your responses
        - Take your time to think
        - Ask for clarification if needed
        - Practice regularly for improvement
        
        **Cost Information:**
        - GPT-4o-mini: ~$0.15 per 1M input tokens
        - Typical interview: $0.01 - $0.05
        """)


# Main Content Area
st.title("🎯 Interview Coach")
st.markdown("### Practice interviews with AI-powered feedback")

# Check if API key is provided
if not api_key:
    st.info("👈 Please enter your OpenAI API key in the sidebar to begin.")
    st.markdown("""
    **Welcome to Interview Coach!** 
    
    This app helps you practice for job interviews using AI. Here's what makes it special:
    
    - **5 Different Interview Styles** - Practice with various AI prompting techniques
    - **Customizable Difficulty** - From Junior to Senior level questions
    - **Multiple Interview Types** - Technical, Behavioral, Case Study, System Design
    - **Real-time Feedback** - Get immediate responses and suggestions
    - **Cost Tracking** - Monitor your API usage transparently
    
    **Ready to ace your next interview? Add your API key and let's start!**
    """)
else:
    # Interview Controls
    if not st.session_state.interview_active:
        # User Context Input - THIS IS THE KEY FIX
        st.markdown("### 📝 What do you want to prepare for?")
        st.markdown("*Describe your interview preparation goals in detail*")
        
        user_context_input = st.text_area(
            "Your preparation goals:",
            placeholder="Example: I'm interviewing for a Senior Python Developer role at a fintech startup. I want to focus on system design, API development, and database optimization. I have 5 years of experience but need help with behavioral questions about leadership...",
            height=120,
            key="context_input",
            help="Be specific about: role, company type, topics to focus on, your experience level, areas you want to improve"
        )
        
        st.markdown("---")
        
        col1, col2, col3 = st.columns([2, 2, 1])
        
        with col1:
            if st.button("🚀 Start Interview", type="primary", use_container_width=True):
                if user_context_input and user_context_input.strip():
                    start_interview(user_context_input.strip())
                    st.rerun()
                else:
                    st.error("❌ Please describe what you want to prepare for before starting the interview.")
        
        with col3:
            st.info("⚪ Ready")
        
        st.markdown("---")
        
        # Show example questions based on selected mode
        st.markdown("### 💡 What to expect:")
        
        example_questions = {
            "Technical Interview": [
                "Explain the difference between a list and a tuple in Python",
                "How would you optimize a slow database query?",
                "Describe your approach to debugging production issues"
            ],
            "Behavioral Interview": [
                "Tell me about a time you resolved a conflict with a team member",
                "Describe a challenging project and how you handled it",
                "How do you prioritize tasks when everything is urgent?"
            ],
            "Case Study Interview": [
                "How would you design a parking lot system?",
                "Estimate the number of gas stations in your city",
                "Design a recommendation system for an e-commerce platform"
            ],
            "System Design Interview": [
                "Design a URL shortening service like bit.ly",
                "How would you architect a messaging app like WhatsApp?",
                "Design a rate limiter for an API service"
            ]
        }
        
        if st.session_state.interview_mode in example_questions:
            st.markdown(f"**Sample {st.session_state.interview_mode} questions:**")
            for question in example_questions[st.session_state.interview_mode]:
                st.markdown(f"- {question}")
    
    else:
        # Interview is active
        col1, col2, col3 = st.columns([2, 2, 1])
        
        with col1:
            if st.button("🔄 New Interview", type="secondary", use_container_width=True):
                reset_interview()
                st.rerun()
        
        with col2:
            if len(st.session_state.messages) > 0:
                if st.button("📥 Export Conversation", use_container_width=True):
                    export_data = export_conversation(
                        st.session_state.messages,
                        st.session_state.interview_mode,
                        st.session_state.difficulty
                    )
                    st.download_button(
                        label="Download as TXT",
                        data=export_data,
                        file_name=f"interview_practice_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt",
                        mime="text/plain",
                        use_container_width=True
                    )
        
        with col3:
            st.success("🟢 Active")
        
        st.markdown("---")
        
        # Display conversation
        chat_container = st.container()
        
        with chat_container:
            for message in st.session_state.messages:
                with st.chat_message(message["role"]):
                    st.markdown(message["content"])
                    if "timestamp" in message:
                        st.caption(f"{message['timestamp'].strftime('%H:%M:%S')}")
        
        # User input
        user_input = st.chat_input(
            "Type your response here...",
            key="user_input",
            max_chars=MAX_INPUT_LENGTH
        )
        
        if user_input:
            # Validate input
            is_valid, error_message = validate_input(user_input)
            
            if not is_valid:
                st.error(f"❌ {error_message}")
            else:
                # Check rate limit
                if not check_rate_limit(st.session_state.request_count, MAX_QUESTIONS_PER_SESSION):
                    st.error(f"❌ Rate limit reached. Maximum {MAX_QUESTIONS_PER_SESSION} questions per session.")
                else:
                    # Add user message
                    st.session_state.messages.append({
                        "role": "user",
                        "content": user_input,
                        "timestamp": datetime.now()
                    })
                    
                    # Prepare messages for API
                    system_prompt = SYSTEM_PROMPTS[st.session_state.selected_style]
                    context = f"""
                    User's Preparation Goals: {st.session_state.user_context}
                    Interview Mode: {st.session_state.interview_mode}
                    Difficulty Level: {st.session_state.difficulty}
                    Question Number: {st.session_state.question_count + 1}
                    """
                    
                    api_messages = [{"role": "system", "content": system_prompt + "\n\n" + context}]
                    api_messages.extend([
                        {"role": m["role"], "content": m["content"]}
                        for m in st.session_state.messages
                    ])
                    
                    # Get AI response
                    with st.spinner("🤔 AI is thinking..."):
                        response = call_openai_api(
                            messages=api_messages,
                            model=st.session_state.model,
                            temperature=st.session_state.temperature,
                            api_key=st.session_state.api_key
                        )
                    
                    if response:
                        # Add AI response
                        st.session_state.messages.append({
                            "role": "assistant",
                            "content": response['content'],
                            "timestamp": datetime.now()
                        })
                        
                        # Update statistics
                        st.session_state.total_tokens += response['tokens']
                        st.session_state.total_cost += calculate_cost(
                            response['tokens'],
                            st.session_state.model
                        )
                        st.session_state.question_count += 1
                        st.session_state.request_count += 1
                        
                        st.rerun()

# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #666; padding: 20px;'>
    <p>Built with ❤️ using Streamlit and OpenAI | 
    <a href='https://github.com/yourusername/interview-coach' target='_blank'>View on GitHub</a> | 
    <a href='https://platform.openai.com/docs' target='_blank'>OpenAI Docs</a></p>
</div>
""", unsafe_allow_html=True)