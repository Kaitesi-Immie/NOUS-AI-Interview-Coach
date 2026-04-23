import streamlit as st

def load_custom_css():
    st.markdown(
        """
        <style>
        /* ---------- Fonts ---------- */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * {
            font-family: 'Inter', sans-serif;
        }

        /* ---------- App Background ---------- */
        .stApp {
            background-color: #F0F3FA;
            color: #395886;
        }

        /* ---------- Sidebar ---------- */
        [data-testid="stSidebar"] {
            background-color: #D5DEEF;
            padding: 1.5rem 1rem;
            border-right: 1px solid #B1C9EF;
        }

        [data-testid="stSidebar"] h1,
        [data-testid="stSidebar"] h2,
        [data-testid="stSidebar"] h3,
        [data-testid="stSidebar"] p,
        [data-testid="stSidebar"] label {
            color: #395886 !important;
            font-weight: 600;
        }

        /* ---------- Headings ---------- */
        h1, h2, h3 {
            color: #395886;
            font-weight: 700;
        }

        /* ---------- Inputs ---------- */
        .stTextInput input,
        .stTextArea textarea {
            background-color: #FFFFFF;
            border: 1.5px solid #B1C9EF;
            border-radius: 8px;
            padding: 0.6rem;
            color: #395886;
        }

        .stTextInput input:focus,
        .stTextArea textarea:focus {
            border-color: #628ECB;
            box-shadow: 0 0 0 3px rgba(98, 142, 203, 0.2);
        }

        ::placeholder {
            color: #8AAEE0;
        }

        /* ---------- Selectbox (CRITICAL FIX) ---------- */
        div[data-baseweb="select"] span {
            color: #395886 !important;
            font-weight: 500;
        }

        div[data-baseweb="select"] span[aria-hidden="true"] {
            color: #8AAEE0 !important;
        }

        div[data-baseweb="menu"] span {
            color: #395886 !important;
        }

        .stSelectbox > div > div {
            background-color: #FFFFFF;
            border: 1.5px solid #B1C9EF;
            border-radius: 8px;
        }

        /* ---------- Slider ---------- */
        .stSlider label,
        .stSlider span {
            color: #395886 !important;
            font-weight: 500;
        }

        .stSlider > div > div > div > div {
            background-color: #628ECB;
        }

        /* ---------- Buttons ---------- */
        .stButton > button {
            background-color: #628ECB;
            color: #FFFFFF;
            border-radius: 8px;
            padding: 0.6rem 1.4rem;
            font-weight: 600;
            border: none;
            transition: all 0.2s ease;
        }

        .stButton > button:hover {
            background-color: #8AAEE0;
            color: #395886;
        }

        /* ---------- Chat Messages ---------- */
        [data-testid="stChatMessage"] {
            border-radius: 12px;
            padding: 0.9rem;
            margin-bottom: 0.6rem;
            font-size: 0.95rem;
        }

        [data-testid="stChatMessage"][data-testid*="assistant"] {
            background-color: #D5DEEF;
            color: #395886;
            border-left: 4px solid #628ECB;
        }

        [data-testid="stChatMessage"][data-testid*="user"] {
            background-color: #FFFFFF;
            color: #395886;
            border-left: 4px solid #8AAEE0;
        }

        /* ---------- Metrics ---------- */
        [data-testid="stMetricValue"] {
            color: #628ECB;
            font-size: 1.6rem;
            font-weight: 700;
        }

        [data-testid="stMetricLabel"] {
            color: #395886;
            font-weight: 600;
        }

        /* ---------- Alerts ---------- */
        .stSuccess,
        .stInfo,
        .stWarning,
        .stError {
            border-radius: 8px;
            padding: 0.9rem;
            font-weight: 500;
        }

        .stSuccess {
            background-color: #E8F0FF;
            border-left: 4px solid #628ECB;
            color: #395886;
        }

        .stInfo {
            background-color: #F0F3FA;
            border-left: 4px solid #8AAEE0;
            color: #395886;
        }

        .stWarning {
            background-color: #FFF6E5;
            border-left: 4px solid #F0B429;
            color: #6B4F1D;
        }

        .stError {
            background-color: #FFE8E8;
            border-left: 4px solid #D64545;
            color: #7A1F1F;
        }

        /* ---------- Chat Input: Counter + Send Button FIX ---------- */
        [data-testid="stChatInput"] textarea {
            padding-top: 1.6rem !important;
            padding-right: 3.5rem !important;
            line-height: 1.4;
        }

        [data-testid="stChatInput"] span {
            top: 0.35rem !important;
            right: 3.5rem !important;
            font-size: 0.75rem !important;
            color: #8AAEE0 !important;
        }
        </style>
        """,
        unsafe_allow_html=True
    )
