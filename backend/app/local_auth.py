"""
Local Authentication System for Incomiq
========================================
File-based auth when Supabase is not configured.
Stores users in a JSON file with hashed passwords.
"""

import json
import os
import hashlib
import secrets
import re
from pathlib import Path
from typing import Optional
from datetime import datetime

# Valid email domains (real email providers)
VALID_EMAIL_DOMAINS = [
    # Major providers
    "gmail.com", "googlemail.com",
    "yahoo.com", "yahoo.in", "yahoo.co.in",
    "outlook.com", "hotmail.com", "live.com", "msn.com",
    "icloud.com", "me.com", "mac.com",
    "protonmail.com", "proton.me",
    "aol.com",
    "zoho.com", "zohomail.in",
    "mail.com",
    "gmx.com", "gmx.net",
    "yandex.com", "yandex.ru",
    # Indian providers
    "rediffmail.com", "rediff.com",
    "in.com",
    # Educational/Work (allow any subdomain)
    "edu", "ac.in", "edu.in",
    # Company domains (we'll allow these with strict validation)
]

# Users file path
USERS_FILE = Path(__file__).parent.parent / "data" / "users.json"


def _ensure_data_dir():
    """Ensure data directory exists."""
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not USERS_FILE.exists():
        USERS_FILE.write_text("{}")


def _load_users() -> dict:
    """Load users from JSON file."""
    _ensure_data_dir()
    try:
        return json.loads(USERS_FILE.read_text())
    except (json.JSONDecodeError, FileNotFoundError):
        return {}


def _save_users(users: dict):
    """Save users to JSON file."""
    _ensure_data_dir()
    USERS_FILE.write_text(json.dumps(users, indent=2))


def _hash_password(password: str, salt: str = None) -> tuple[str, str]:
    """Hash password with salt."""
    if salt is None:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return hashed.hex(), salt


def _generate_token() -> str:
    """Generate a secure access token."""
    return secrets.token_urlsafe(32)


def _generate_user_id() -> str:
    """Generate a unique user ID."""
    return secrets.token_hex(16)


def validate_email(email: str) -> tuple[bool, str]:
    """
    Validate email address strictly.
    Returns (is_valid, error_message)
    """
    email = email.lower().strip()
    
    # Basic email regex
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        return False, "Invalid email format"
    
    # Extract domain
    domain = email.split('@')[1]
    
    # Check against valid domains
    domain_valid = False
    
    # Check exact matches
    if domain in VALID_EMAIL_DOMAINS:
        domain_valid = True
    
    # Check domain endings (for edu, corporate, etc.)
    for valid_domain in VALID_EMAIL_DOMAINS:
        if domain.endswith('.' + valid_domain) or domain == valid_domain:
            domain_valid = True
            break
    
    # Additional checks for suspicious domains
    suspicious_patterns = [
        r'^[a-z]{10,}\.com$',  # Long random letters
        r'^[a-z]+[0-9]+[a-z]+\.com$',  # Mixed random
        r'temp', 'fake', 'test', 'example', 'random', 'asdf',
    ]
    
    for pattern in suspicious_patterns:
        if isinstance(pattern, str):
            if pattern in domain:
                domain_valid = False
                break
        else:
            if re.match(pattern, domain):
                domain_valid = False
                break
    
    if not domain_valid:
        return False, f"Please use a valid email provider (gmail.com, yahoo.com, outlook.com, etc.)"
    
    return True, ""


def signup(email: str, password: str, full_name: str) -> dict:
    """
    Create a new user account.
    Returns user data and token on success.
    Raises ValueError on failure.
    """
    email = email.lower().strip()
    
    # Validate email
    is_valid, error = validate_email(email)
    if not is_valid:
        raise ValueError(error)
    
    # Validate password
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters")
    
    # Validate name
    if not full_name or len(full_name.strip()) < 2:
        raise ValueError("Please enter your full name")
    
    # Check if user exists
    users = _load_users()
    if email in users:
        raise ValueError("An account with this email already exists")
    
    # Create user
    user_id = _generate_user_id()
    hashed_password, salt = _hash_password(password)
    token = _generate_token()
    
    # Register token -> email mapping for later lookups
    from app.auth import register_local_token
    register_local_token(token, email)
    
    users[email] = {
        "id": user_id,
        "email": email,
        "full_name": full_name.strip(),
        "password_hash": hashed_password,
        "password_salt": salt,
        "created_at": datetime.utcnow().isoformat(),
        "is_new_account": True,  # Flag for empty data
    }
    
    _save_users(users)
    
    return {
        "access_token": token,
        "user": {
            "id": user_id,
            "email": email,
            "full_name": full_name.strip(),
            "isNewAccount": True,
        },
        "message": "Account created successfully"
    }


def login(email: str, password: str) -> dict:
    """
    Login an existing user.
    Returns user data and token on success.
    Raises ValueError on failure.
    """
    email = email.lower().strip()
    
    users = _load_users()
    
    if email not in users:
        raise ValueError("Invalid email or password")
    
    user = users[email]
    
    # Verify password
    hashed_password, _ = _hash_password(password, user["password_salt"])
    if hashed_password != user["password_hash"]:
        raise ValueError("Invalid email or password")
    
    # Generate new token
    token = _generate_token()
    
    # Register token -> email mapping for later lookups
    from app.auth import register_local_token
    register_local_token(token, email)
    
    # Check if this is still a new account (no transactions uploaded)
    is_new = user.get("is_new_account", False)
    is_admin = user.get("is_admin", False)
    
    return {
        "access_token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "isNewAccount": is_new,
            "isAdmin": is_admin,
        }
    }


def mark_account_active(email: str):
    """Mark account as having data (no longer new)."""
    email = email.lower().strip()
    users = _load_users()
    
    if email in users:
        users[email]["is_new_account"] = False
        _save_users(users)


def get_user_by_email(email: str) -> Optional[dict]:
    """Get user data by email."""
    email = email.lower().strip()
    users = _load_users()
    
    if email in users:
        user = users[email]
        return {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "isNewAccount": user.get("is_new_account", False),
        }
    return None


def ensure_admin_user():
    """Ensure admin user exists with predefined credentials."""
    _ensure_data_dir()
    users = _load_users()
    
    admin_email = "admin@incomiq.com"
    admin_password = "123456789"
    
    if admin_email not in users:
        # Create admin user
        user_id = _generate_user_id()
        hashed_password, salt = _hash_password(admin_password)
        
        users[admin_email] = {
            "id": user_id,
            "email": admin_email,
            "full_name": "Admin User",
            "password_hash": hashed_password,
            "password_salt": salt,
            "created_at": datetime.utcnow().isoformat(),
            "is_new_account": False,
            "is_admin": True,
        }
        
        _save_users(users)
        print(f"✅ Admin user created: {admin_email}")
    else:
        # Update existing admin user to ensure is_admin flag is set
        if not users[admin_email].get("is_admin", False):
            users[admin_email]["is_admin"] = True
            _save_users(users)
            print(f"✅ Admin user updated: {admin_email}")
    
    return users[admin_email]
