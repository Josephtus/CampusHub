from sanic import Blueprint
from sanic.response import json
from src.services.user_service import UserService
from src.middleware import authorized, inject_user

users_bp = Blueprint("users", url_prefix="/users")

@users_bp.get("/history")
@authorized()
async def get_history(request):
    user_id = request.ctx.user["sub"]
    result, status = await UserService.get_user_history(user_id)
    return json(result, status=status)

@users_bp.get("/profile")
@authorized()
async def get_profile(request):
    """Get complete user profile"""
    user_id = request.ctx.user["sub"]
    result, status = await UserService.get_user_profile(user_id)
    return json(result, status=status)

@users_bp.put("/profile")
@authorized()
async def update_profile(request):
    user_id = request.ctx.user["sub"]
    result, status = await UserService.update_profile(user_id, request.json)
    return json(result, status=status)

@users_bp.get("/search")
@authorized()
async def search_users(request):
    query = request.args.get("q", "")
    result, status = await UserService.search_users(query)
    return json(result, status=status)

@users_bp.get("/<user_id:int>")
@authorized()
async def get_public_profile(request, user_id: int):
    result, status = await UserService.get_public_user_profile(user_id)
    return json(result, status=status)

# YENİ: Profil Fikir Arşivi için Sayfalama Rotası
@users_bp.get("/<user_id:int>/comments")
@inject_user()
async def get_user_comments(request, user_id: int):
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
    except ValueError:
        page, limit = 1, 10
        
    result, status = await UserService.get_user_comments_paginated(user_id, page, limit)
    return json(result, status=status)