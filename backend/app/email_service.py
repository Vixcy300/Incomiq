"""Email notification service using Gmail SMTP."""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER", "contactigtyt@gmail.com")
EMAIL_PASS = os.getenv("EMAIL_PASS", "unltveivyxgbzmsm")
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587


def send_email(to_email: str, subject: str, body_html: str) -> bool:
    """Send an email notification via Gmail SMTP."""
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"Incomiq <{EMAIL_USER}>"
        msg["To"] = to_email
        msg["Subject"] = subject

        # Plain text fallback
        plain_text = body_html.replace("<br>", "\n").replace("</p>", "\n")
        import re
        plain_text = re.sub(r"<[^>]+>", "", plain_text)

        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Email send failed: {e}")
        return False


def send_overspending_alert(to_email: str, expense_desc: str, amount: float, alert_msg: str):
    """Send overspending alert email."""
    html = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 20px; background: #F9FAFB;">
        <div style="background: linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #EC4899 100%); padding: 28px 20px; border-radius: 20px 20px 0 0; text-align: center; box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);">
            <div style="background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">⚠️</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Overspending Alert</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Immediate attention required</p>
        </div>
        <div style="background: white; padding: 28px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 20px 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #FEE2E2, #FECACA); border-radius: 16px; padding: 20px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p style="color: #991B1B; font-size: 12px; text-transform: uppercase; margin: 0; font-weight: 600;">Expense</p>
                        <p style="color: #7F1D1D; font-size: 18px; font-weight: 700; margin: 4px 0 0 0;">{expense_desc}</p>
                    </div>
                    <div style="background: #DC2626; color: white; padding: 12px 20px; border-radius: 12px; text-align: center;">
                        <p style="margin: 0; font-size: 12px;">AMOUNT</p>
                        <p style="margin: 0; font-size: 22px; font-weight: 700;">₹{amount:,.0f}</p>
                    </div>
                </div>
            </div>

            <div style="background: #FEF2F2; border-left: 4px solid #DC2626; padding: 16px; border-radius: 0 12px 12px 0; margin: 20px 0;">
                <p style="color: #DC2626; margin: 0 0 4px 0; font-weight: 600; font-size: 13px;">🚨 Alert Reason</p>
                <p style="color: #991B1B; margin: 0; font-size: 14px; line-height: 1.5;">{alert_msg}</p>
            </div>

            <div style="background: #F0FDF4; border-radius: 12px; padding: 16px; text-align: center;">
                <p style="color: #166534; margin: 0; font-size: 14px;">
                    💡 <strong>Smart Tip:</strong> Save this amount towards your goals instead!
                </p>
            </div>

            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
            <div style="text-align: center;">
                <p style="color: #6B7280; font-size: 11px; margin: 0;">
                    Sent with 💜 by <strong>Incomiq</strong> · India's Smart Finance Tracker
                </p>
            </div>
        </div>
    </div>
    """
    send_email(to_email, f"⚠️ Incomiq: Overspending Alert - {expense_desc}", html)


def send_savings_reminder(to_email: str, user_name: str, min_saving: float, recommended: float, current_saved: float):
    """Send monthly savings reminder."""
    percentage = (current_saved / recommended * 100) if recommended > 0 else 0
    html = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 20px; background: #F9FAFB;">
        <div style="background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 50%, #A855F7 100%); padding: 28px 20px; border-radius: 20px 20px 0 0; text-align: center; box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);">
            <div style="background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">💰</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Monthly Savings Report</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Your financial journey snapshot</p>
        </div>
        <div style="background: white; padding: 28px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 20px 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 22px;">Hi {user_name}! 👋</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                <div style="background: linear-gradient(135deg, #D1FAE5, #A7F3D0); padding: 20px; border-radius: 16px; text-align: center;">
                    <p style="color: #065F46; font-size: 11px; text-transform: uppercase; margin: 0; font-weight: 600;">✅ Saved So Far</p>
                    <p style="color: #047857; font-weight: 800; font-size: 26px; margin: 8px 0 0 0;">₹{current_saved:,.0f}</p>
                </div>
                <div style="background: linear-gradient(135deg, #DBEAFE, #BFDBFE); padding: 20px; border-radius: 16px; text-align: center;">
                    <p style="color: #1E40AF; font-size: 11px; text-transform: uppercase; margin: 0; font-weight: 600;">🎯 Recommended</p>
                    <p style="color: #1D4ED8; font-weight: 800; font-size: 26px; margin: 8px 0 0 0;">₹{recommended:,.0f}</p>
                </div>
            </div>

            <div style="background: #F3F4F6; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                <p style="color: #6B7280; font-size: 12px; margin: 0 0 8px 0;">Progress: {percentage:.0f}%</p>
                <div style="background: #E5E7EB; border-radius: 999px; height: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #7C3AED, #A855F7); height: 100%; width: {min(percentage, 100)}%; border-radius: 999px;"></div>
                </div>
            </div>

            <div style="background: linear-gradient(135deg, #FEF3C7, #FDE68A); border-radius: 16px; padding: 20px; text-align: center;">
                <p style="color: #92400E; font-size: 12px; text-transform: uppercase; margin: 0; font-weight: 600;">💡 Minimum Monthly Savings</p>
                <p style="color: #78350F; font-weight: 800; font-size: 28px; margin: 8px 0;">₹{min_saving:,.0f}</p>
                <p style="color: #A16207; font-size: 13px; margin: 0;">Save consistently to reach your goals! 🚀</p>
            </div>

            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
            <div style="text-align: center;">
                <p style="color: #6B7280; font-size: 11px; margin: 0;">
                    Sent with 💜 by <strong>Incomiq</strong> · Track. Save. Invest.
                </p>
            </div>
        </div>
    </div>
    """
    send_email(to_email, f"💰 Incomiq: Your Monthly Savings Report", html)


def send_goal_achieved(to_email: str, user_name: str, goal_name: str, target_amount: float):
    """Send goal achievement celebration email."""
    html = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 20px; background: #F9FAFB;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #34D399 50%, #6EE7B7 100%); padding: 32px 20px; border-radius: 20px 20px 0 0; text-align: center; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);">
            <div style="background: rgba(255,255,255,0.25); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 48px;">🎉</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 30px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Goal Achieved!</h1>
            <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px; font-weight: 500;">You did it, {user_name}! 🏆</p>
        </div>
        <div style="background: white; padding: 28px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 20px 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            
            <div style="background: linear-gradient(135deg, #D1FAE5, #A7F3D0); border-radius: 20px; padding: 28px; text-align: center; margin-bottom: 24px;">
                <div style="background: white; width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <span style="font-size: 32px;">🎯</span>
                </div>
                <p style="color: #047857; font-size: 14px; text-transform: uppercase; margin: 0; font-weight: 600; letter-spacing: 1px;">Completed</p>
                <h2 style="color: #065F46; font-size: 26px; margin: 8px 0; font-weight: 800;">{goal_name}</h2>
                <div style="background: white; border-radius: 12px; padding: 12px 24px; display: inline-block; margin-top: 8px;">
                    <p style="color: #059669; font-size: 28px; font-weight: 800; margin: 0;">₹{target_amount:,.0f}</p>
                </div>
            </div>

            <div style="background: linear-gradient(135deg, #EDE9FE, #DDD6FE); border-radius: 16px; padding: 20px; text-align: center;">
                <p style="color: #6D28D9; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">🚀 What's Next?</p>
                <p style="color: #7C3AED; font-size: 13px; margin: 0; line-height: 1.6;">
                    Set a new goal or consider investing your savings to grow your wealth even more!
                </p>
            </div>

            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
            <div style="text-align: center;">
                <p style="color: #6B7280; font-size: 11px; margin: 0;">
                    Sent with 💜 by <strong>Incomiq</strong> · Track. Save. Invest.
                </p>
            </div>
        </div>
    </div>
    """
    send_email(to_email, f"🎉 Incomiq: You achieved your {goal_name} goal!", html)
