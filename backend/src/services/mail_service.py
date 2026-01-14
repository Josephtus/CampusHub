import aiosmtplib
from email.message import EmailMessage
import os
from src.config import logger

class MailService:
    @staticmethod
    async def send_reset_email(to_email: str, token: str):
        reset_link = f"http://localhost:5173/reset-password?token={token}"
        message = EmailMessage()
        message["From"] = os.getenv("SMTP_USER")
        message["To"] = to_email
        message["Subject"] = "CampusHub - Şifre Sıfırlama"
        message.set_content(f"Şifrenizi sıfırlamak için tıklayın: {reset_link}")

        try:
            await aiosmtplib.send(
                message,
                hostname=os.getenv("SMTP_HOST"),
                port=int(os.getenv("SMTP_PORT", 587)),
                username=os.getenv("SMTP_USER"),
                password=os.getenv("SMTP_PASS"),
                start_tls=True
            )
            return True
        except Exception as e:
            logger.error(f"Mail hatası: {str(e)}")
            return False