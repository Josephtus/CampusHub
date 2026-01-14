import json
from src.models import Clubs, ClubFollowers, UserRole, Users, Events
from tortoise.exceptions import DoesNotExist
from datetime import datetime, timezone
from src.config import logger

class ClubService:

    @staticmethod
    async def create_club(user_ctx, data, redis=None):
        """Kulüp oluşturma veya başvuru süreci."""
        status = "active" if user_ctx["role"] == UserRole.ADMIN else "pending"

        try:
            club = await Clubs.create(
                club_name=data.get("name"),
                description=data.get("description"),
                logo_url=data.get("image_url"),
                president_id=user_ctx["sub"],
                created_by_id=user_ctx["sub"],
                status=status
            )
            
            if status == "active":
                logger.info(f"Club Created (Active) by Admin: {club.club_name}")
                if redis: await redis.delete("clubs:all_active")
                msg = "Club created successfully"
            else:
                logger.info(f"Club Application Submitted: {club.club_name} by User {user_ctx['sub']}")
                msg = "Club application submitted for approval"

            return {
                "message": msg, 
                "club": {"id": club.club_id, "name": club.club_name, "status": status}
            }, 201
            
        except Exception as e:
            logger.error(f"Club Creation Error: {str(e)}")
            return {"error": "Club could not be created."}, 400

    @staticmethod
    async def approve_club(user_ctx, club_id: int, redis=None):
        """Bekleyen bir kulüp başvurusunu onaylar ve başkanı yetkilendirir."""
        if user_ctx["role"] != UserRole.ADMIN:
            return {"error": "Unauthorized"}, 403
            
        try:
            club = await Clubs.get(club_id=club_id, is_deleted=False)
            if club.status == "active":
                return {"message": "Club is already active"}, 400
                
            # 1. Kulübü aktif et
            club.status = "active"
            await club.save()

            # 2. Kulübü kuran öğrenciyi (president_id) bul ve rolünü yükselt
            if club.president_id:
                user = await Users.get_or_none(user_id=club.president_id)
                if user and user.role == UserRole.STUDENT:
                    user.role = UserRole.CLUB_ADMIN
                    await user.save()
                    logger.info(f"User {user.user_id} promoted to CLUB_ADMIN upon club approval.")
            
            if redis: await redis.delete("clubs:all_active")
            logger.info(f"Club Approved: {club.club_name} by Admin {user_ctx['sub']}")
            return {"message": f"'{club.club_name}' onaylandı ve başkanı yetkilendirildi."}, 200
        except DoesNotExist:
            return {"error": "Club not found"}, 404

    @staticmethod
    async def delete_club(user_ctx, club_id: int, redis=None):
        """Kulübü soft-delete yöntemiyle siler (Sadece Admin)."""
        if user_ctx["role"] != UserRole.ADMIN:
            return {"error": "Unauthorized"}, 403
        try:
            club = await Clubs.get(club_id=club_id)
            club.is_deleted = True
            club.deleted_at = datetime.now(timezone.utc)
            await club.save()
            
            if redis: await redis.delete("clubs:all_active")
            logger.info(f"Club Deleted: {club.club_name} (ID: {club_id})")
            return {"message": "Club deleted successfully"}, 200
        except DoesNotExist:
            return {"error": "Club not found"}, 404

    @staticmethod
    async def get_all_clubs(user_id=None, redis=None, page=1, limit=12):
        """Tüm aktif kulüpleri sayfalar halinde listeler."""
        # Cache key artık sayfaya özel olmalı
        cache_key = f"clubs:active:p{page}:l{limit}"
        
        if not user_id and redis:
            cached_data = await redis.get(cache_key)
            if cached_data:
                return json.loads(cached_data), 200
        
        # Pagination Mantığı
        query = Clubs.filter(is_deleted=False, status="active")
        total_count = await query.count()
        offset = (page - 1) * limit
        
        clubs = await query.offset(offset).limit(limit).all()
        
        followed_club_ids = set()
        if user_id:
            followed_club_ids = set(
                await ClubFollowers.filter(user_id=user_id).values_list('club_id', flat=True)
            )

        clubs_list = [{
            "id": c.club_id,
            "name": c.club_name,
            "description": c.description,
            "image_url": c.logo_url,
            "status": c.status,
            "created_at": str(c.created_at),
            "is_following": c.club_id in followed_club_ids,
            "is_president": c.president_id == user_id 
        } for c in clubs]
            
        response_data = {
            "clubs": clubs_list,
            "pagination": {
                "total": total_count,
                "page": page,
                "limit": limit,
                "total_pages": (total_count + limit - 1) // limit
            }
        }
        
        if not user_id and redis: 
            await redis.set(cache_key, json.dumps(response_data), ex=300)
        
        return response_data, 200

    @staticmethod
    async def get_club_details(club_id: int, user_ctx=None):
        """Kulüp detaylarını getirir (Eventleri ayrıca çekiyoruz, burası sadece temel bilgi)."""
        try:
            # Eventleri prefetch yapmıyoruz, performans için ayrı endpoint kullanacağız.
            club = await Clubs.get(club_id=club_id)
            if club.is_deleted: return {"error": "Club not found"}, 404

            total_followers = await ClubFollowers.filter(club_id=club_id).count()
            
            return {
                "club": {
                    "id": club.club_id,
                    "name": club.club_name,
                    "description": club.description,
                    "image_url": club.logo_url,
                    "status": club.status,
                    "president_id": club.president_id, 
                    "follower_count": total_followers
                }
            }, 200
        except DoesNotExist:
            return {"error": "Club not found"}, 404

    @staticmethod
    async def get_club_events_paginated(club_id: int, page=1, limit=5):
        """Kulüp profili için postları (etkinlikleri) sayfalar."""
        offset = (page - 1) * limit
        query = Events.filter(club_id=club_id, is_deleted=False)
        
        total = await query.count()
        events = await query.order_by("-event_date").offset(offset).limit(limit).all()
        
        events_list = [{
            "id": e.event_id,
            "title": e.title,
            "date": str(e.event_date),
            "location": e.location,
            "image_url": e.image_url,
            "capacity": e.quota
        } for e in events]

        return {
            "events": events_list,
            "pagination": {
                "total": total,
                "page": page,
                "has_more": (page * limit) < total
            }
        }, 200

    @staticmethod
    async def get_club_members(user_ctx, club_id: int):
        try:
            if not await Clubs.exists(club_id=club_id):
                 return {"error": "Club not found"}, 404
            
            followers = await ClubFollowers.filter(club_id=club_id).prefetch_related("user")
            
            return {
                "members": [{
                    "id": f.user.user_id,
                    "full_name": f"{f.user.first_name} {f.user.last_name}",
                    "email": f.user.email,
                    "department": f.user.department,
                    "joined_at": f.created_at.strftime("%d %b %Y"),
                    "profile_photo": f.user.profile_image
                } for f in followers if f.user]
            }, 200
        except DoesNotExist:
            return {"error": "Club not found"}, 404

    @staticmethod
    async def follow_club(user_ctx, club_id: int):
        if user_ctx["role"] == UserRole.ADMIN:
             return {"error": "Admins cannot join clubs as members"}, 400

        try:
            club = await Clubs.get(club_id=club_id)
            if club.is_deleted or club.status != "active": 
                return {"error": "Club not available for joining"}, 404
            
            if club.president_id == user_ctx["sub"]:
                return {"error": "As the president, you are already the primary member."}, 400

            exists = await ClubFollowers.filter(user_id=user_ctx["sub"], club_id=club_id).exists()
            if exists: return {"message": "Already a member"}, 400
            
            await ClubFollowers.create(user_id=user_ctx["sub"], club_id=club_id)
            return {"message": f"Successfully joined {club.club_name}"}, 200
        except DoesNotExist:
            return {"error": "Club not found"}, 404

    @staticmethod
    async def leave_club(user_ctx, club_id: int):
        deleted_count = await ClubFollowers.filter(user_id=user_ctx["sub"], club_id=club_id).delete()
        if deleted_count == 0:
            return {"error": "You are not a member of this club"}, 400
        return {"message": "Successfully left the club"}, 200

    @staticmethod
    async def remove_follower(user_ctx, club_id: int, target_user_id: int):
        try:
            club = await Clubs.get(club_id=club_id)
            if not (user_ctx["role"] == UserRole.ADMIN or club.president_id == user_ctx["sub"]):
                return {"error": "Unauthorized to manage members"}, 403

            deleted_count = await ClubFollowers.filter(user_id=target_user_id, club_id=club_id).delete()
            if deleted_count == 0: return {"error": "User is not a member"}, 404
            
            logger.info(f"User {target_user_id} removed from Club {club_id} by {user_ctx['sub']}")
            return {"message": "Member removed successfully"}, 200
        except DoesNotExist:
            return {"error": "Club not found"}, 404

    @staticmethod
    async def get_my_clubs(user_ctx):
        if user_ctx["role"] == UserRole.ADMIN:
            clubs = await Clubs.filter(is_deleted=False).all()
        else:
            clubs = await Clubs.filter(president_id=user_ctx["sub"], is_deleted=False)
        
        clubs_list = [{
            "id": c.club_id, 
            "name": c.club_name, 
            "image_url": c.logo_url, 
            "status": c.status
        } for c in clubs]
        return {"clubs": clubs_list}, 200