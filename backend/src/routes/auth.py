from sanic import Blueprint
from sanic.response import json
from src.services.auth_service import AuthService
from src.middleware import authorized

# Blueprint tanımla (URL ön eki /auth olacak)
auth_bp = Blueprint("auth", url_prefix="/auth")

@auth_bp.post("/register")
async def register(request):
    # AuthService'i çağır
    result, status = await AuthService.register_user(request.json)
    return json(result, status=status)

@auth_bp.post("/login")
async def login(request):
    result, status = await AuthService.login_user(request.json)
    return json(result, status=status)

@auth_bp.get("/me")
@authorized() # Bu endpoint korumalıdır
async def get_me(request):
    # Middleware sayesinde request.ctx.user dolu geliyor
    return json({"user": request.ctx.user})

# --- Şifre Sıfırlama Endpointleri ---

@auth_bp.post("/forgot-password")
async def forgot_password(request):
    """
    Kullanıcı e-postasını gönderir, sistem bir token oluşturup mail atar.
    """
    email = request.json.get("email")
    if not email:
        return json({"error": "E-posta adresi gerekli"}, status=400)
    
    result, status = await AuthService.request_password_reset(email)
    return json(result, status=status)

@auth_bp.post("/reset-password")
async def reset_password(request):
    """
    Kullanıcı yeni şifresini ve maildeki token'ı gönderir.
    """
    token = request.json.get("token")
    new_password = request.json.get("password")
    
    if not token or not new_password:
        return json({"error": "Token ve yeni şifre gerekli"}, status=400)
    
    result, status = await AuthService.complete_password_reset(token, new_password)
    return json(result, status=status)