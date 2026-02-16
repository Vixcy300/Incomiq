"""Authentication middleware and helpers."""

import os
import json
from pathlib import Path
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)

DEMO_USER = {
    "id": "demo-user-001",
    "email": "rahul@demo.com",
    "full_name": "Rahul Kumar",
    "is_demo": True,
}

# Check if Supabase is configured
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
USE_LOCAL_AUTH = not SUPABASE_URL or "your-project" in SUPABASE_URL

# Token file for persistent storage
TOKENS_FILE = Path(__file__).parent.parent / "data" / "tokens.json"


def _load_tokens() -> dict[str, str]:
    """Load tokens from JSON file."""
    try:
        if TOKENS_FILE.exists():
            return json.loads(TOKENS_FILE.read_text())
    except (json.JSONDecodeError, FileNotFoundError):
        pass
    return {}


def _save_tokens(tokens: dict[str, str]):
    """Save tokens to JSON file."""
    TOKENS_FILE.parent.mkdir(parents=True, exist_ok=True)
    TOKENS_FILE.write_text(json.dumps(tokens, indent=2))


def register_local_token(token: str, email: str):
    """Register a token for local auth (persisted to file)."""
    tokens = _load_tokens()
    tokens[token] = email
    _save_tokens(tokens)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Verify JWT and return user info. Supports demo mode and local auth."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = credentials.credentials

    # Demo mode bypass
    if token == "demo-token":
        return DEMO_USER

    if USE_LOCAL_AUTH:
        # For local auth, look up the user by their registered token
        from app.local_auth import get_user_by_email, _load_users
        
        # Check if this is a locally-generated token (length > 20)
        if len(token) > 20:
            # Look up email from persistent token registry
            tokens = _load_tokens()
            email = tokens.get(token)
            
            if email:
                # Found token mapping, get user data
                users = _load_users()
                user_data = users.get(email)
                if user_data:
                    return {
                        "id": user_data["id"],
                        "email": email,
                        "full_name": user_data.get("full_name", "User"),
                        "is_demo": False,
                        "is_new_account": user_data.get("is_new_account", False),
                        "is_admin": user_data.get("is_admin", False),
                    }
            
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        raise HTTPException(status_code=401, detail="Invalid token format")
    
    # Supabase authentication
    try:
        from app.config import get_supabase
        sb = get_supabase()
        user_response = sb.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.user_metadata.get("full_name", "User"),
            "is_demo": False,
        }
    except Exception as e:
        if "Invalid" in str(e) or "expired" in str(e):
            raise HTTPException(status_code=401, detail="Token expired or invalid")
        raise HTTPException(status_code=401, detail=str(e))
