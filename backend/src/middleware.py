from functools import wraps
from sanic.response import json
from src.security import decode_access_token
from src.models import UserRole
from src.config import logger

# --- YARDIMCI FONKSİYON ---
def _extract_user_payload(request):
    """Token'ı çözen ve 'sub' alanını (ID) integer'a çeviren yardımcı fonksiyon."""
    token = request.token
    if not token:
        return None
    
    payload = decode_access_token(token)
    if payload:
        # User ID'yi (sub) güvenli bir şekilde integer'a çevir
        if "sub" in payload and isinstance(payload["sub"], (str, int)):
            try:
                payload["sub"] = int(payload["sub"])
            except ValueError:
                pass
        return payload
    return None

# --- DEKORATÖRLER ---

def authorized():
    """ZORUNLU Yetkilendirme: Geçerli bir token yoksa 401 hatası döndürür."""
    def decorator(f):
        @wraps(f)
        async def decorated_function(request, *args, **kwargs):
            payload = _extract_user_payload(request)
            
            if not payload:
                logger.warning(f"Unauthorized access attempt to {request.path}: Missing or invalid token")
                return json({"error": "Unauthorized: Invalid or missing token"}, 401)
            
            request.ctx.user = payload
            return await f(request, *args, **kwargs)
        return decorated_function
    return decorator

def inject_user():
    """OPSİYONEL Yetkilendirme: Token varsa kullanıcıyı yükler, yoksa devam eder."""
    def decorator(f):
        @wraps(f)
        async def decorated_function(request, *args, **kwargs):
            # Token varsa payload'u al, yoksa None ata
            request.ctx.user = _extract_user_payload(request)
            return await f(request, *args, **kwargs)
        return decorated_function
    return decorator

def admin_only():
    """ROL KONTROLÜ: Sadece admin yetkisi olan kullanıcılara izin verir."""
    def decorator(f):
        @wraps(f)
        async def decorated_function(request, *args, **kwargs):
            # Önce kullanıcının auth olup olmadığını kontrol et
            user = getattr(request.ctx, "user", None)
            
            if not user:
                return json({"error": "Authentication required for this resource"}, 401)
            
            # Rol kontrolü
            if user.get("role") != UserRole.ADMIN:
                logger.warning(f"Forbidden Access: User {user.get('sub')} attempted to access Admin-only route: {request.path}")
                return json({"error": "Admin privileges required"}, 403)
                
            return await f(request, *args, **kwargs)
        return decorated_function
    return decorator