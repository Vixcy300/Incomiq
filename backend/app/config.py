import os
from dotenv import load_dotenv
from supabase import create_client, Client
from functools import lru_cache
from pydantic_settings import BaseSettings

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    app_name: str = "Incomiq"
    debug: bool = False
    
    # Email settings
    smtp_host: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: str = os.getenv("SMTP_USER", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    
    # WhatsApp settings
    whatsapp_api_key: str = os.getenv("WHATSAPP_API_KEY", "")
    twilio_account_sid: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    twilio_auth_token: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    twilio_whatsapp_number: str = os.getenv("TWILIO_WHATSAPP_NUMBER", "")
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Allow extra env variables


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()


def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def get_supabase_admin() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
