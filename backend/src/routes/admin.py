from sanic import Blueprint
from sanic.response import json
from src.services.admin_service import AdminService
from src.middleware import authorized, admin_only

# Blueprint tanımı
admin_bp = Blueprint("admin", url_prefix="/admin")

# --- KULLANICI YÖNETİMİ ---

@admin_bp.get("/users")
@authorized()
@admin_only()
async def list_users(request):
    """Sistemdeki tüm kullanıcıları sayfalama ve arama ile listeler."""
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
        search = request.args.get("search")
    except ValueError:
        page, limit, search = 1, 20, None

    result, status = await AdminService.get_all_users(page, limit, search)
    return json(result, status=status)

@admin_bp.get("/users/<user_id:int>")
@authorized()
@admin_only()
async def get_user_detail(request, user_id: int):
    """Adminin belirli bir kullanıcının profil detaylarını görmesini sağlar."""
    result, status = await AdminService.get_user_info(user_id)
    return json(result, status=status)

@admin_bp.post("/users/<user_id:int>/ban")
@authorized()
@admin_only()
async def ban_user(request, user_id: int):
    """Kullanıcıyı engeller veya engelini kaldırır."""
    result, status = await AdminService.toggle_user_ban(user_id)
    return json(result, status=status)

@admin_bp.put("/users/<user_id:int>/role")
@authorized()
@admin_only()
async def update_role(request, user_id: int):
    new_role = request.json.get("role")
    club_id = request.json.get("club_id") # Frontend'den gelecek opsiyonel ID
    
    if not new_role:
        return json({"error": "Role field is required"}, 400)
    
    # club_id parametresini de iletiyoruz
    result, status = await AdminService.update_user_role(user_id, new_role, club_id)
    return json(result, status=status)

# --- İSTATİSTİKLER VE DUYURULAR ---

@admin_bp.get("/stats")
@authorized()
@admin_only()
async def get_stats(request):
    """Dashboard için genel sistem istatistiklerini döner."""
    result, status = await AdminService.get_dashboard_stats()
    return json(result, status=status)

@admin_bp.post("/announce")
@authorized()
@admin_only()
async def make_announcement(request):
    """Tüm sisteme veya aktif kullanıcılara duyuru gönderir."""
    message = request.json.get("message")
    if not message:
        return json({"error": "Announcement message cannot be empty"}, 400)
        
    result, status = await AdminService.send_global_announcement(message)
    return json(result, status=status)

# --- İÇERİK VE KULÜP DENETİMİ ---

@admin_bp.delete("/comments/<comment_id:int>")
@authorized()
@admin_only()
async def delete_comment(request, comment_id: int):
    """Uygunsuz bir yorumu kalıcı olarak siler."""
    result, status = await AdminService.delete_comment(comment_id)
    return json(result, status=status)

@admin_bp.put("/clubs/<club_id:int>")
@authorized()
@admin_only()
async def update_club(request, club_id: int):
    """Bir kulübün bilgilerini admin yetkisiyle günceller."""
    if not request.json:
        return json({"error": "Update data is required"}, 400)
        
    result, status = await AdminService.update_club_details(club_id, request.json)
    return json(result, status=status)
# src/routes/admin.py içine eklenecek
@admin_bp.put("/users/<user_id:int>/profile")
@authorized()
@admin_only()
async def admin_update_user_profile(request, user_id: int):
    result, status = await AdminService.update_user_profile_as_admin(user_id, request.json)
    return json(result, status=status)