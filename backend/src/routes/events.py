from sanic import Blueprint
from sanic.response import json
from src.services.event_service import EventService
from src.middleware import authorized, inject_user

events_bp = Blueprint("events", url_prefix="/events")

# --- ETKİNLİK LİSTELEME VE DETAY ---

@events_bp.get("/")
@inject_user()
async def list_events(request):
    """
    Etkinlikleri sayfalama, arama ve tarih filtresi ile listeler.
    Redis cache mekanizması service katmanında yönetilir.
    """
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
    except ValueError:
        page, limit = 1, 20
        
    search = request.args.get("search")
    date_filter = request.args.get("date")
    redis = request.app.ctx.redis
    
    result, status = await EventService.get_events(redis, page, limit, search, date_filter)
    return json(result, status=status)

@events_bp.get("/<event_id:int>")
@inject_user() # KRİTİK: Refresh sonrası kullanıcının katılım durumunu (is_joined) tespit etmek için
async def get_event_detail(request, event_id: int):
    """
    Bir etkinliğin detaylarını döner. 
    @inject_user sayesinde giriş yapmış kullanıcının ID'si (sub) servise iletilir.
    """
    user_ctx = getattr(request.ctx, "user", None)
    result, status = await EventService.get_event_detail(event_id, user_ctx)
    return json(result, status=status)

# --- ETKİNLİK YÖNETİMİ (KULÜP BAŞKANI / ADMIN) ---

@events_bp.post("/")
@authorized()
async def create_event(request):
    """Yeni bir etkinlik oluşturur (Yetki kontrolü service içindedir)."""
    result, status = await EventService.create_event(request.ctx.user, request.json)
    return json(result, status=status)

@events_bp.put("/<event_id:int>")
@authorized()
async def update_event(request, event_id: int):
    """Mevcut bir etkinliği günceller."""
    if not request.json:
        return json({"error": "No data provided for update"}, 400)
        
    result, status = await EventService.update_event(request.ctx.user, event_id, request.json)
    return json(result, status=status)

@events_bp.delete("/<event_id:int>")
@authorized()
async def delete_event(request, event_id: int):
    """Etkinliği siler (Soft-delete)."""
    result, status = await EventService.delete_event(request.ctx.user, event_id)
    return json(result, status=status)

# --- KATILIM İŞLEMLERİ (ÖĞRENCİLER) ---

@events_bp.post("/<event_id:int>/join")
@authorized()
async def join_event(request, event_id: int):
    """Kullanıcının etkinliğe katılmasına izin verir (Kota kontrolü dahil)."""
    result, status = await EventService.join_event(request.ctx.user, event_id)
    return json(result, status=status)

@events_bp.post("/<event_id:int>/leave")
@authorized()
async def leave_event(request, event_id: int):
    """Kullanıcının etkinlikten ayrılmasını sağlar."""
    result, status = await EventService.leave_event(request.ctx.user, event_id)
    return json(result, status=status)

@events_bp.post("/<event_id:int>/remove-participant")
@authorized()
async def remove_participant(request, event_id: int):
    """Bir katılımcıyı etkinlikten çıkarır (Sadece yetkili kişiler)."""
    target_user_id = request.json.get("user_id")
    if not target_user_id:
        return json({"error": "target user_id is required"}, 400)
        
    result, status = await EventService.remove_participant(request.ctx.user, event_id, target_user_id)
    return json(result, status=status)