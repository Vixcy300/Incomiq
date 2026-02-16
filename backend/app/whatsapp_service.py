"""
WhatsApp Notification Service for Incomiq
===========================================
This service handles WhatsApp notifications using a webhook-based approach.
Supports multiple free/paid providers:
- Green API (FREE - 100 messages/month) - Recommended
- CallMeBot API (free for testing)  
- Twilio WhatsApp API (paid)
- WhatsApp Business API (official)
"""

import os
import httpx
from typing import Optional
from .config import get_settings

settings = get_settings()


class WhatsAppService:
    """WhatsApp notification service supporting multiple providers."""
    
    # Green API (FREE tier: 100 messages/month)
    # Sign up: https://green-api.com - Link your WhatsApp via QR code
    GREEN_API_URL = "https://api.green-api.com"
    
    # CallMeBot API (free for testing) - users need to activate with WhatsApp
    CALLMEBOT_API = "https://api.callmebot.com/whatsapp.php"
    
    # For production, use Twilio or official WhatsApp Business API
    TWILIO_API = "https://api.twilio.com/2010-04-01"
    
    def __init__(self):
        # Credentials are loaded fresh on each call via properties
        pass
    
    @property
    def green_api_instance(self):
        """Get Green API instance ID (reloads from env each time)."""
        return os.getenv("GREEN_API_INSTANCE_ID", "")
    
    @property
    def green_api_token(self):
        """Get Green API token (reloads from env each time)."""
        return os.getenv("GREEN_API_TOKEN", "")
    
    @property
    def api_key(self):
        """Get CallMeBot API key."""
        return os.getenv("WHATSAPP_API_KEY", "")
    
    @property
    def twilio_sid(self):
        """Get Twilio SID."""
        return os.getenv("TWILIO_ACCOUNT_SID", "")
    
    @property
    def twilio_token(self):
        """Get Twilio token."""
        return os.getenv("TWILIO_AUTH_TOKEN", "")
    
    @property
    def twilio_number(self):
        """Get Twilio WhatsApp number."""
        return os.getenv("TWILIO_WHATSAPP_NUMBER", "")

    async def send_message(
        self,
        phone_number: str,
        message: str,
        use_twilio: bool = False
    ) -> dict:
        """
        Send a WhatsApp message.
        
        Args:
            phone_number: Recipient's phone number (with country code, e.g., +919876543210)
            message: Message text to send
            use_twilio: If True, use Twilio API
            
        Returns:
            dict with success status and details
        """
        if not phone_number:
            return {"success": False, "error": "Phone number is required"}
        
        # Clean phone number
        phone = phone_number.replace(" ", "").replace("-", "")
        if not phone.startswith("+"):
            phone = f"+{phone}"
        
        # Priority: Green API > Twilio > CallMeBot > Mock
        if self.green_api_instance and self.green_api_token:
            return await self._send_via_green_api(phone, message)
        elif use_twilio and self.twilio_sid and self.twilio_token:
            return await self._send_via_twilio(phone, message)
        elif self.api_key:
            return await self._send_via_callmebot(phone, message)
        else:
            # No API configured - return mock success for demo
            print(f"[WhatsApp Mock] To: {phone} | Message: {message}")
            return {
                "success": True,
                "mock": True,
                "message": "Message logged (no WhatsApp API configured). Set GREEN_API_INSTANCE_ID and GREEN_API_TOKEN in .env"
            }

    async def _send_via_green_api(self, phone: str, message: str) -> dict:
        """Send message via Green API (FREE - 100 msgs/month)."""
        try:
            # Green API expects phone without + prefix
            chat_id = phone.lstrip("+") + "@c.us"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.GREEN_API_URL}/waInstance{self.green_api_instance}/sendMessage/{self.green_api_token}",
                    json={
                        "chatId": chat_id,
                        "message": message
                    },
                    timeout=30.0
                )
                
                result = response.json()
                if response.status_code == 200 and result.get("idMessage"):
                    return {"success": True, "messageId": result.get("idMessage")}
                else:
                    return {
                        "success": False,
                        "error": result.get("message", f"API returned {response.status_code}"),
                        "response": result
                    }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _send_via_callmebot(self, phone: str, message: str) -> dict:
        """Send message via CallMeBot (free testing API)."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.CALLMEBOT_API,
                    params={
                        "phone": phone.lstrip("+"),
                        "text": message,
                        "apikey": self.api_key
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return {"success": True, "response": response.text}
                else:
                    return {
                        "success": False,
                        "error": f"API returned {response.status_code}",
                        "response": response.text
                    }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _send_via_twilio(self, phone: str, message: str) -> dict:
        """Send message via Twilio WhatsApp API."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.TWILIO_API}/Accounts/{self.twilio_sid}/Messages.json",
                    auth=(self.twilio_sid, self.twilio_token),
                    data={
                        "From": f"whatsapp:{self.twilio_number}",
                        "To": f"whatsapp:{phone}",
                        "Body": message
                    },
                    timeout=30.0
                )
                
                if response.status_code in (200, 201):
                    return {"success": True, "sid": response.json().get("sid")}
                else:
                    return {
                        "success": False,
                        "error": f"Twilio API error {response.status_code}",
                        "details": response.json()
                    }
        except Exception as e:
            return {"success": False, "error": str(e)}


# Message templates for different notification types
class WhatsAppTemplates:
    """Pre-defined message templates for different alerts."""
    
    @staticmethod
    def dirty_expense_alert(
        expense_category: str,
        amount: float,
        suggestion: str
    ) -> str:
        return (
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🚨 *DIRTY EXPENSE ALERT* 🚨\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"⚡ *Non-essential spending detected!*\n\n"
            f"📂 *Category:* {expense_category.capitalize()}\n"
            f"💸 *Amount:* ₹{amount:,.0f}\n\n"
            f"╭────────────────────╮\n"
            f"│ 💡 *SMART TIP*           │\n"
            f"╰────────────────────╯\n"
            f"{suggestion}\n\n"
            f"🎯 *Action:* Review this expense and consider if it aligns with your financial goals.\n\n"
            f"_Powered by Incomiq AI_ 🤖✨"
        )
    
    @staticmethod
    def overspending_alert(
        category: str,
        spent: float,
        limit: float,
        percentage: float
    ) -> str:
        return (
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"⚠️ *OVERSPENDING WARNING* ⚠️\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"You've exceeded your budget for *{category.capitalize()}*!\n\n"
            f"📊 *Breakdown:*\n"
            f"┌─────────────────────┐\n"
            f"│ 💰 Spent: ₹{spent:,.0f}\n"
            f"│ 📌 Limit: ₹{limit:,.0f}\n"
            f"│ 📈 Over by: {percentage:.0f}%\n"
            f"└─────────────────────┘\n\n"
            f"🔔 *Tip:* Pause non-essential spending in this category to stay on track!\n\n"
            f"_Track your expenses with Incomiq_ 📱"
        )
    
    @staticmethod
    def goal_progress(
        goal_name: str,
        current: float,
        target: float,
        percentage: float,
        days_left: int
    ) -> str:
        # Progress bar visualization
        filled = int(percentage / 10)
        empty = 10 - filled
        progress_bar = "▓" * filled + "░" * empty
        
        if percentage >= 100:
            emoji = "🎉"
            status = "GOAL ACHIEVED!"
        elif percentage >= 75:
            emoji = "🔥"
            status = "Almost there!"
        elif percentage >= 50:
            emoji = "💪"
            status = "Halfway done!"
        else:
            emoji = "🚀"
            status = "Keep going!"
            
        return (
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"{emoji} *GOAL UPDATE: {goal_name.upper()}* {emoji}\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"*{status}*\n\n"
            f"📊 *Progress:*\n"
            f"[{progress_bar}] {percentage:.0f}%\n\n"
            f"💰 ₹{current:,.0f} / ₹{target:,.0f}\n"
            f"📅 {days_left} days remaining\n\n"
            f"{'🎊 Congratulations! You did it!' if percentage >= 100 else '✨ Every rupee counts! Keep saving!'}\n\n"
            f"_Your Incomiq Journey_ 🌟"
        )
    
    @staticmethod
    def savings_reminder(
        monthly_target: float,
        saved_so_far: float,
        remaining: float
    ) -> str:
        percentage = (saved_so_far / monthly_target * 100) if monthly_target > 0 else 0
        return (
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"💰 *SAVINGS REMINDER* 💰\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"📊 *This Month's Status:*\n\n"
            f"🎯 Target: ₹{monthly_target:,.0f}\n"
            f"✅ Saved: ₹{saved_so_far:,.0f} ({percentage:.0f}%)\n"
            f"📈 Remaining: ₹{remaining:,.0f}\n\n"
            f"╭────────────────────╮\n"
            f"│ 💡 *DAILY TIP*           │\n"
            f"│ Save ₹{remaining/max(1, 30):,.0f}/day │\n"
            f"│ to hit your goal!       │\n"
            f"╰────────────────────╯\n\n"
            f"🚀 *Small savings lead to big dreams!*\n\n"
            f"_Incomiq - Your Finance Partner_ 💜"
        )
    
    @staticmethod
    def investment_suggestion(
        amount: float,
        recommendations: list[str]
    ) -> str:
        recs = "\n".join([f"  • {r}" for r in recommendations[:3]])
        return (
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📈 *INVESTMENT OPPORTUNITY* 📈\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"🎉 Great news! You have surplus funds!\n\n"
            f"💵 *Available to Invest:*\n"
            f"┌─────────────────────┐\n"
            f"│    ₹{amount:,.0f}     │\n"
            f"└─────────────────────┘\n\n"
            f"📋 *Smart Recommendations:*\n{recs}\n\n"
            f"🌱 *Tip:* Start small, stay consistent, watch your wealth grow!\n\n"
            f"_Incomiq Smart Investing_ 🤖💰"
        )


# Create singleton instance
whatsapp_service = WhatsAppService()
whatsapp_templates = WhatsAppTemplates()
