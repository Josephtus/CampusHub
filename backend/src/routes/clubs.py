from sanic import Blueprint
from sanic.response import json
from src.services.club_service import ClubService
from src.middleware import authorized, inject_user
from src.models import UserRole, Clubs

clubs_bp = Blueprint("clubs", url_prefix="/clubs")

@clubs_bp.get("/")
@inject_user()
async def list_clubs(request):
    """Tüm aktif kulüpleri sayfalama ile listeler."""
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 12)) 
    except ValueError:
        page, limit = 1, 12

    redis = request.app.ctx.redis
    user_id = None
    if hasattr(request.ctx, "user") and request.ctx.user:
        user_id = request.ctx.user.get("sub")
        
    result, status = await ClubService.get_all_clubs(user_id=user_id, redis=redis, page=page, limit=limit)
    return json(result, status=status)

@clubs_bp.get("/pending-requests")
@authorized()
async def get_pending_clubs(request):
    if request.ctx.user["role"] != UserRole.ADMIN:
        return json({"error": "Sadece yöneticiler bu listeyi görebilir."}, 403)
    
    clubs = await Clubs.filter(status="pending", is_deleted=False).prefetch_related("president")
    
    result = [{
        "id": c.club_id,
        "name": c.club_name,
        "description": c.description,
        "image_url": c.logo_url,
        "president_id": c.president_id,
        "created_at": str(c.created_at),
        "president_name": f"{c.president.first_name} {c.president.last_name}" if c.president else "Bilinmiyor"
    } for c in clubs]
    
    return json({"clubs": result}, 200)

@clubs_bp.get("/<club_id:int>")
@inject_user()
async def get_club(request, club_id: int):
    user_ctx = getattr(request.ctx, "user", None)
    result, status = await ClubService.get_club_details(club_id, user_ctx)
    return json(result, status=status)

@clubs_bp.get("/<club_id:int>/posts")
async def get_club_posts(request, club_id: int):
    """Kulüp profilindeki postları sayfalar halinde getirir."""
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 5))
    except ValueError:
        page, limit = 1, 5
        
    result, status = await ClubService.get_club_events_paginated(club_id, page, limit)
    return json(result, status=status)

@clubs_bp.post("/")
@authorized()
async def create_club(request):
    redis = request.app.ctx.redis
    result, status = await ClubService.create_club(request.ctx.user, request.json, redis)
    return json(result, status=status)

@clubs_bp.post("/<club_id:int>/approve")
@authorized()
async def approve_club(request, club_id: int):
    redis = request.app.ctx.redis
    result, status = await ClubService.approve_club(request.ctx.user, club_id, redis)
    return json(result, status=status)

@clubs_bp.delete("/<club_id:int>")
@authorized()
async def delete_club(request, club_id: int):
    redis = request.app.ctx.redis
    result, status = await ClubService.delete_club(request.ctx.user, club_id, redis)
    return json(result, status=status)

@clubs_bp.get("/my-clubs")
@authorized()
async def get_my_clubs(request):
    result, status = await ClubService.get_my_clubs(request.ctx.user)
    return json(result, status=status)

@clubs_bp.get("/<club_id:int>/members")
@authorized()
async def get_club_members(request, club_id: int):
    result, status = await ClubService.get_club_members(request.ctx.user, club_id)
    return json(result, status=status)

@clubs_bp.delete("/<club_id:int>/members/<target_user_id:int>")
@authorized()
async def remove_member_alt(request, club_id: int, target_user_id: int):
    result, status = await ClubService.remove_follower(request.ctx.user, club_id, target_user_id)
    return json(result, status=status)

@clubs_bp.post("/<club_id:int>/follow")
@authorized()
async def follow_club(request, club_id: int):
    result, status = await ClubService.follow_club(request.ctx.user, club_id)
    return json(result, status=status)

@clubs_bp.post("/<club_id:int>/leave")
@authorized()
async def leave_club(request, club_id: int):
    result, status = await ClubService.leave_club(request.ctx.user, club_id)
    return json(result, status=status)

@clubs_bp.post("/<club_id:int>/remove-member")
@authorized()
async def remove_member(request, club_id: int):
    target_user_id = request.json.get("user_id")
    if not target_user_id:
        return json({"error": "User ID is required"}, 400)
    
    result, status = await ClubService.remove_follower(request.ctx.user, club_id, target_user_id)
    return json(result, status=status)