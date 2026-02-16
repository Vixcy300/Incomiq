"""Notification routes – email alerts, push subscription, and WhatsApp messages."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.auth import get_current_user
from app.email_service import send_email, send_savings_reminder, send_overspending_alert
from app.whatsapp_service import whatsapp_service, whatsapp_templates

router = APIRouter(prefix="/notifications", tags=["notifications"])

# In-memory push subscription store (demo)
_push_subscriptions: dict[str, dict] = {}


class TestEmailRequest(BaseModel):
    to_email: str


class PushSubscription(BaseModel):
    endpoint: str
    keys: dict


# Simple test endpoint (no auth required)
@router.post("/test-email")
async def test_email(req: TestEmailRequest):
    """Send a test email to verify SMTP is working."""
    success = send_email(
        req.to_email,
        "🔔 Incomiq: Test Email",
        """
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563EB;">✅ Email is working!</h2>
            <p>This is a test email from Incomiq.</p>
            <p>Your email notification system is configured correctly.</p>
            <p style="color: #6B7280; font-size: 12px;">Sent by Incomiq</p>
        </div>"""
    )
    if success:
        return {"ok": True, "message": f"Test email sent to {req.to_email}"}
    else:
        return {"ok": False, "message": "Email sending failed. Check SMTP credentials."}

class EmailNotificationRequest(BaseModel):
    type: str  # "savings_reminder" | "overspending_alert" | "test"
    data: dict = {}


class NotificationPreferences(BaseModel):
    email_alerts: bool = True
    push_alerts: bool = True
    overspending_alerts: bool = True
    savings_reminders: bool = True
    goal_notifications: bool = True


# In-memory prefs (demo)
_notification_prefs: dict[str, dict] = {}


@router.post("/subscribe-push")
async def subscribe_push(sub: PushSubscription, user: dict = Depends(get_current_user)):
    """Store push notification subscription."""
    _push_subscriptions[user["id"]] = {
        "endpoint": sub.endpoint,
        "keys": sub.keys,
    }
    return {"ok": True, "message": "Push notifications enabled"}


@router.delete("/unsubscribe-push")
async def unsubscribe_push(user: dict = Depends(get_current_user)):
    """Remove push notification subscription."""
    _push_subscriptions.pop(user["id"], None)
    return {"ok": True, "message": "Push notifications disabled"}


@router.post("/send-email")
async def send_notification_email(req: EmailNotificationRequest, user: dict = Depends(get_current_user)):
    """Send email notification to user."""
    email = user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No email address")

    if req.type == "test":
        success = send_email(
            email,
            "🔔 Incomiq: Notifications Enabled!",
            f"""
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563EB;">✅ Email Notifications Active!</h2>
                <p>Hi {user.get('full_name', 'there')}! You'll now receive:</p>
                <ul>
                    <li>⚠️ Overspending alerts</li>
                    <li>💰 Monthly savings reminders</li>
                    <li>🎉 Goal achievement celebrations</li>
                    <li>📊 Weekly financial summaries</li>
                </ul>
                <p style="color: #6B7280; font-size: 12px;">Sent by Incomiq</p>
            </div>"""
        )
        return {"ok": success, "message": "Test email sent" if success else "Email failed"}

    elif req.type == "savings_reminder":
        send_savings_reminder(
            email,
            user.get("full_name", "User"),
            req.data.get("min_saving", 0),
            req.data.get("recommended", 0),
            req.data.get("current_saved", 0),
        )
        return {"ok": True}

    elif req.type == "overspending_alert":
        send_overspending_alert(
            email,
            req.data.get("description", "Purchase"),
            req.data.get("amount", 0),
            req.data.get("message", "Watch your spending!"),
        )
        return {"ok": True}

    return {"ok": False, "message": "Unknown notification type"}


@router.get("/preferences")
async def get_preferences(user: dict = Depends(get_current_user)):
    """Get notification preferences."""
    prefs = _notification_prefs.get(user["id"], {
        "email_alerts": True,
        "push_alerts": True,
        "overspending_alerts": True,
        "savings_reminders": True,
        "goal_notifications": True,
    })
    return prefs


@router.put("/preferences")
async def update_preferences(prefs: NotificationPreferences, user: dict = Depends(get_current_user)):
    """Update notification preferences."""
    _notification_prefs[user["id"]] = prefs.model_dump()
    return {"ok": True, "preferences": prefs.model_dump()}


# ── WhatsApp Notifications ──

class WhatsAppSettings(BaseModel):
    phone_number: Optional[str] = None
    enabled: bool = False


class WhatsAppMessage(BaseModel):
    type: str  # "dirty_expense" | "overspending" | "goal_progress" | "savings_reminder" | "investment" | "custom"
    phone_number: str
    data: dict = {}
    custom_message: Optional[str] = None


# In-memory WhatsApp settings (demo)
_whatsapp_settings: dict[str, dict] = {}


@router.get("/whatsapp/settings")
async def get_whatsapp_settings(user: dict = Depends(get_current_user)):
    """Get user's WhatsApp notification settings."""
    settings = _whatsapp_settings.get(user["id"], {
        "phone_number": None,
        "enabled": False
    })
    return settings


@router.put("/whatsapp/settings")
async def update_whatsapp_settings(settings: WhatsAppSettings, user: dict = Depends(get_current_user)):
    """Update user's WhatsApp notification settings."""
    _whatsapp_settings[user["id"]] = settings.model_dump()
    return {"ok": True, "settings": settings.model_dump()}


@router.post("/whatsapp/send")
async def send_whatsapp_notification(req: WhatsAppMessage, user: dict = Depends(get_current_user)):
    """Send a WhatsApp notification to the user."""
    
    # Check if WhatsApp is enabled for user
    settings = _whatsapp_settings.get(user["id"], {})
    if not settings.get("enabled", False) and not req.phone_number:
        raise HTTPException(status_code=400, detail="WhatsApp notifications not enabled")
    
    phone = req.phone_number or settings.get("phone_number")
    if not phone:
        raise HTTPException(status_code=400, detail="No phone number provided")
    
    # Generate message based on type
    message = ""
    
    if req.type == "custom" and req.custom_message:
        message = req.custom_message
        
    elif req.type == "dirty_expense":
        message = whatsapp_templates.dirty_expense_alert(
            expense_category=req.data.get("category", "unknown"),
            amount=req.data.get("amount", 0),
            suggestion=req.data.get("suggestion", "Review this expense")
        )
        
    elif req.type == "overspending":
        message = whatsapp_templates.overspending_alert(
            category=req.data.get("category", "unknown"),
            spent=req.data.get("spent", 0),
            limit=req.data.get("limit", 0),
            percentage=req.data.get("percentage", 0)
        )
        
    elif req.type == "goal_progress":
        message = whatsapp_templates.goal_progress(
            goal_name=req.data.get("goal_name", "Goal"),
            current=req.data.get("current", 0),
            target=req.data.get("target", 0),
            percentage=req.data.get("percentage", 0),
            days_left=req.data.get("days_left", 0)
        )
        
    elif req.type == "savings_reminder":
        message = whatsapp_templates.savings_reminder(
            monthly_target=req.data.get("monthly_target", 0),
            saved_so_far=req.data.get("saved_so_far", 0),
            remaining=req.data.get("remaining", 0)
        )
        
    elif req.type == "investment":
        message = whatsapp_templates.investment_suggestion(
            amount=req.data.get("amount", 0),
            recommendations=req.data.get("recommendations", ["Mutual Funds", "Fixed Deposit", "Gold ETF"])
        )
        
    else:
        raise HTTPException(status_code=400, detail=f"Unknown message type: {req.type}")
    
    # Send the message
    result = await whatsapp_service.send_message(phone, message)
    
    return {
        "ok": result.get("success", False),
        "message_type": req.type,
        "details": result
    }


@router.post("/whatsapp/test")
async def send_test_whatsapp(phone_number: str, user: dict = Depends(get_current_user)):
    """Send a test WhatsApp message to verify setup."""
    test_message = (
        "🎉 *Incomiq WhatsApp Connected!*\n\n"
        f"Hi {user.get('full_name', 'there')}! Your WhatsApp notifications are now active.\n\n"
        "You'll receive:\n"
        "• 🚨 Dirty expense alerts\n"
        "• ⚠️ Overspending warnings\n"
        "• 💰 Savings reminders\n"
        "• 📈 Investment suggestions\n\n"
        "_Reply STOP to disable notifications_"
    )
    
    result = await whatsapp_service.send_message(phone_number, test_message)
    
    if result.get("success"):
        # Save phone number on successful test
        _whatsapp_settings[user["id"]] = {
            "phone_number": phone_number,
            "enabled": True
        }
    
    return {
        "ok": result.get("success", False),
        "message": "Test message sent!" if result.get("success") else "Failed to send",
        "details": result
    }
