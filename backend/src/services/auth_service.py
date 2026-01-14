import secrets
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple
from tortoise.exceptions import DoesNotExist
from tortoise.expressions import Q
from src.services.mail_service import MailService

from src.models import Users, UserRole
from src.security import hash_password, verify_password, create_access_token
from src.config import logger

class AuthService:
    
    # Geçici token deposu (Gerçek projede Redis veya DB tablosu daha iyidir)
    # format: {"token_string": {"user_id": 123, "expires": datetime}}
    _reset_tokens = {}

    @staticmethod
    async def register_user(data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """Yeni kullanıcı kaydı oluşturur ve hoş geldin maili gönderir."""
        try:
            student_number = data.get("student_number")
            email = data.get("email")
            password = data.get("password")
            first_name = data.get("first_name")
            last_name = data.get("last_name")
            department = data.get("department")

            if not all([student_number, email, password, first_name, last_name]):
                return {"error": "Lütfen tüm zorunlu alanları doldurun."}, 400
            
            # Kullanıcı kontrolü
            existing_user = await Users.filter(
                Q(user_id=student_number) | Q(email=email)
            ).exists()
            
            if existing_user:
                return {"error": "Bu öğrenci numarası veya e-posta adresi zaten kullanımda."}, 400
            
            # Kullanıcıyı oluştur
            hashed = hash_password(password)
            user = await Users.create(
                user_id=student_number,
                email=email,
                password=hashed,
                first_name=first_name.strip(),
                last_name=last_name.strip(),
                role=UserRole.STUDENT,
                department=department
            )
            
            # --- HOŞ GELDİN MAİLİ GÖNDERİMİ ---
            try:
                # MailService içinde send_welcome_email metodunun tanımlı olması gerekir
                await MailService.send_welcome_email(user.email, user.first_name)
                logger.info(f"Welcome email sent to: {user.email}")
            except Exception as mail_err:
                # Mail hatası kaydı engellememeli, sadece loglanır
                logger.error(f"Welcome email failed: {str(mail_err)}")
            # ----------------------------------

            token = create_access_token(user.user_id, user.role.value)
            return {
                "token": token, 
                "user": {
                    "id": user.user_id, 
                    "email": user.email, 
                    "role": user.role.value,
                    "full_name": f"{user.first_name} {user.last_name}"
                }
            }, 201
            
        except Exception as e:
            logger.error(f"Registration Error: {str(e)}")
            return {"error": "Kayıt sırasında bir hata oluştu."}, 500

    @staticmethod
    async def login_user(data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """Kullanıcı girişi yapar."""
        email = data.get("email")
        password = data.get("password")
        required_role = data.get("role")

        try:
            user = await Users.get(email=email)
            
            if user.is_deleted:
                return {"error": "Hesabınız askıya alınmıştır."}, 403

            if not verify_password(password, user.password):
                raise DoesNotExist 

            if required_role and user.role.value != required_role:
                return {"error": "Bu alan için yetkiniz bulunmamaktadır."}, 403

            token = create_access_token(user.user_id, user.role.value)
            return {
                "token": token,
                "user": {
                    "id": user.user_id,
                    "email": user.email,
                    "role": user.role.value,
                    "full_name": f"{user.first_name} {user.last_name}"
                }
            }, 200

        except DoesNotExist:
            return {"error": "E-posta veya şifre hatalı."}, 401
        except Exception as e:
            logger.error(f"Login Error: {str(e)}")
            return {"error": "Giriş sırasında bir hata oluştu."}, 500

    @staticmethod
    async def request_password_reset(email: str) -> Tuple[Dict[str, Any], int]:
        """Sıfırlama tokeni üretir ve sadece kayıtlı kullanıcılara mail gönderir."""
        try:
            # Kullanıcı kontrolü (DoesNotExist fırlatırsa doğrudan except bloğuna gider)
            user = await Users.get(email=email)
            
            if user.is_deleted:
                return {"message": "Eğer hesap mevcutsa sıfırlama maili gönderilecektir."}, 200
            
            token = secrets.token_urlsafe(32)
            expiry = datetime.now() + timedelta(minutes=30)
            
            # Tokenı belleğe kaydet
            AuthService._reset_tokens[token] = {
                "user_id": user.user_id,
                "expires": expiry
            }

            # Mail Gönder
            await MailService.send_reset_email(email, token)
            logger.info(f"Password reset link sent to: {email}")
            
            return {"message": "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi."}, 200
            
        except DoesNotExist:
            # Kayıtlı olmayan mail için de aynı mesaj (Güvenlik dcheck)
            logger.warning(f"Reset request for non-existent email: {email}")
            return {"message": "Eğer hesap mevcutsa sıfırlama maili gönderilecektir."}, 200
        except Exception as e:
            logger.error(f"Reset Password Error: {str(e)}")
            return {"error": "Bir hata oluştu."}, 500

    @staticmethod
    async def complete_password_reset(token: str, new_password: str) -> Tuple[Dict[str, Any], int]:
        """Token doğrulaması yapar ve şifreyi günceller."""
        try:
            reset_data = AuthService._reset_tokens.get(token)

            if not reset_data:
                return {"error": "Geçersiz veya kullanılmış token."}, 400
            
            if datetime.now() > reset_data["expires"]:
                if token in AuthService._reset_tokens:
                    del AuthService._reset_tokens[token]
                return {"error": "Token süresi dolmuş. Lütfen tekrar deneyin."}, 400

            user = await Users.get(user_id=reset_data["user_id"])
            user.password = hash_password(new_password)
            await user.save()

            # Kullanılan tokenı temizle
            del AuthService._reset_tokens[token]
            
            logger.info(f"Password reset completed for user ID: {user.user_id}")
            return {"message": "Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz."}, 200

        except Exception as e:
            logger.error(f"Reset Completion Error: {str(e)}")
            return {"error": "Şifre güncellenirken bir hata oluştu."}, 500