"""Auth routes – login, signup, demo."""

import os
from fastapi import APIRouter, HTTPException
from app.models import LoginRequest, SignupRequest, DemoLoginRequest
from app.auth import DEMO_USER

router = APIRouter(prefix="/auth", tags=["auth"])

# Check if Supabase is configured
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
USE_LOCAL_AUTH = not SUPABASE_URL or "your-project" in SUPABASE_URL


@router.post("/login")
async def login(body: LoginRequest):
    if USE_LOCAL_AUTH:
        # Use local file-based auth
        from app.local_auth import login as local_login
        try:
            result = local_login(body.email, body.password)
            return result
        except ValueError as e:
            raise HTTPException(status_code=401, detail=str(e))
    else:
        # Use Supabase auth
        try:
            from app.config import get_supabase
            sb = get_supabase()
            res = sb.auth.sign_in_with_password(
                {"email": body.email, "password": body.password}
            )
            return {
                "access_token": res.session.access_token,
                "user": {
                    "id": res.user.id,
                    "email": res.user.email,
                    "full_name": res.user.user_metadata.get("full_name", "User"),
                },
            }
        except Exception as e:
            raise HTTPException(status_code=401, detail=str(e))


@router.post("/signup")
async def signup(body: SignupRequest):
    if USE_LOCAL_AUTH:
        # Use local file-based auth
        from app.local_auth import signup as local_signup
        try:
            result = local_signup(body.email, body.password, body.full_name)
            return result
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        # Use Supabase auth
        try:
            from app.config import get_supabase
            sb = get_supabase()
            res = sb.auth.sign_up(
                {
                    "email": body.email,
                    "password": body.password,
                    "options": {"data": {"full_name": body.full_name}},
                }
            )
            return {
                "access_token": res.session.access_token if res.session else None,
                "user": {
                    "id": res.user.id,
                    "email": res.user.email,
                    "full_name": body.full_name,
                },
                "message": "Account created successfully",
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))


@router.post("/demo")
async def demo_login(_body: DemoLoginRequest):
    return {
        "access_token": "demo-token",
        "user": DEMO_USER,
    }
