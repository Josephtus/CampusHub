from src.models import EventParticipation, ParticipationStatus, Users, EventComments, ClubFollowers, UserRole
from tortoise.exceptions import DoesNotExist
from src.config import logger
from tortoise.expressions import Q

class UserService:

    @staticmethod
    async def get_user_history(user_id: int):
        """Kullanıcının katıldığı etkinliklerin geçmişini döner."""
        participations = await EventParticipation.filter(
            user_id=user_id, 
            status=ParticipationStatus.GOING
        ).prefetch_related("event", "event__club").order_by("-created_at")
        
        history = []
        for p in participations:
            if p.event:
                history.append({
                    "event_id": p.event.event_id,
                    "title": p.event.title,
                    "date": str(p.event.event_date),
                    "club_name": p.event.club.club_name if p.event.club else "Bilinmiyor",
                    "joined_at": str(p.created_at)
                })
        
        return {"history": history}, 200

    @staticmethod
    async def get_user_profile(user_id: int):
        """
        Kullanıcı profilini döner. Yorumlar artık ayrı çekileceği için buradan kaldırıldı veya limitlendi.
        """
        try:
            user = await Users.get(user_id=user_id)
            
            # Katıldığı Etkinlikler
            participations = await EventParticipation.filter(user_id=user_id).prefetch_related("event", "event__club")
            participated_events = [
                {
                    "id": p.event.event_id,
                    "title": p.event.title,
                    "date": str(p.event.event_date),
                    "club_name": p.event.club.club_name if p.event.club else "Unknown",
                     "image_url": p.event.image_url
                } for p in participations if p.event
            ]
            
            # Takip Edilen Kulüpler
            followed = await ClubFollowers.filter(user_id=user_id).prefetch_related("club")
            clubs = [{"id": f.club.club_id, "name": f.club.club_name} for f in followed if f.club]
            
            return {
                "profile": {
                    "id": user.user_id,
                    "email": user.email,
                    "full_name": f"{user.first_name} {user.last_name}",
                    "department": user.department,
                    "role": user.role,
                    "profile_photo": user.profile_image,
                    "bio": user.bio,
                    "interests": user.interests,
                    "is_deleted": user.is_deleted
                },
                "activities": {
                    "participated_events": participated_events,
                    "followed_clubs": clubs,
                    # Yorumlar artık burada değil, get_user_comments_paginated ile çekilecek
                }
            }, 200
        except DoesNotExist:
            return {"error": "User not found"}, 404

    @staticmethod
    async def get_user_comments_paginated(user_id: int, page=1, limit=10):
        """Kullanıcının yorumlarını sayfalar (Profil Fikir Arşivi)."""
        offset = (page - 1) * limit
        query = EventComments.filter(user_id=user_id).prefetch_related("event")
        
        total = await query.count()
        comments = await query.order_by("-created_at").offset(offset).limit(limit).all()
        
        comments_list = [{
            "id": c.comment_id,
            "content": c.content,
            "event_id": c.event.event_id if c.event else None,
            "event_title": c.event.title if c.event else "Deleted Event",
            "created_at": str(c.created_at)
        } for c in comments]

        return {
            "comments": comments_list,
            "pagination": {
                "total": total,
                "page": page,
                "has_more": (page * limit) < total
            }
        }, 200

    @staticmethod
    async def update_profile(user_id: int, data: dict):
        try:
            user = await Users.get(user_id=user_id)
            
            if "full_name" in data:
                names = data["full_name"].strip().split(" ")
                user.first_name = names[0]
                user.last_name = " ".join(names[1:]) if len(names) > 1 else ""
            
            if "bio" in data: user.bio = data["bio"]
            if "interests" in data: user.interests = data["interests"]
            if "department" in data: user.department = data["department"]
            
            if "profile_photo" in data:
                photo_url = data["profile_photo"]
                if photo_url and not photo_url.startswith(("http://", "https://")):
                    return {"error": "Lütfen geçerli bir resim URL'si giriniz (http/https)."}, 400
                user.profile_image = photo_url
                
            await user.save()
            return {
                "message": "Profil başarıyla güncellendi",
                "profile": {
                    "full_name": f"{user.first_name} {user.last_name}",
                    "bio": user.bio,
                    "profile_photo": user.profile_image
                }
            }, 200
        except DoesNotExist:
            return {"error": "User not found"}, 404

    @staticmethod
    async def update_role(admin_ctx, target_user_id: int, new_role: str):
        if admin_ctx["role"] != UserRole.ADMIN:
            return {"error": "Bu işlem için yetkiniz yok."}, 403

        try:
            user = await Users.get(user_id=target_user_id)
            
            if new_role not in [r.value for r in UserRole]:
                return {"error": "Geçersiz rol tanımlaması."}, 400

            user.role = UserRole(new_role)
            await user.save()
            
            logger.info(f"Admin {admin_ctx['sub']} changed role of User {target_user_id} to {new_role}")
            return {"message": f"Kullanıcı rolü başarıyla {new_role} olarak güncellendi."}, 200
        except DoesNotExist:
            return {"error": "Kullanıcı bulunamadı."}, 404

    @staticmethod
    async def toggle_status(admin_ctx, target_user_id: int):
        if admin_ctx["role"] != UserRole.ADMIN:
            return {"error": "Yetkisiz işlem."}, 403

        try:
            user = await Users.get(user_id=target_user_id)
            if user.role == UserRole.ADMIN:
                return {"error": "Bir admin yasaklanamaz."}, 400

            user.is_deleted = not user.is_deleted
            await user.save()

            status_text = "yasaklandı" if user.is_deleted else "erişime açıldı"
            return {"message": f"Kullanıcı başarıyla {status_text}."}, 200
        except DoesNotExist:
            return {"error": "Kullanıcı bulunamadı."}, 404
        
    @staticmethod
    async def search_users(query: str):
        if not query or len(query) < 2:
            return {"users": []}, 200

        users = await Users.filter(
            Q(first_name__icontains=query) | 
            Q(last_name__icontains=query)
        ).filter(is_deleted=False).limit(10).all()

        result = [{
            "id": u.user_id,
            "full_name": f"{u.first_name} {u.last_name}",
            "department": u.department,
            "profile_photo": u.profile_image
        } for u in users]
        
        return {"users": result}, 200
    
    @staticmethod
    async def get_public_user_profile(target_user_id: int):
        """Başka bir kullanıcının herkese açık profilini görüntüler."""
        try:
            user = await Users.get(user_id=target_user_id, is_deleted=False)
            
            # Katıldığı Etkinlikler
            participations = await EventParticipation.filter(
                user_id=target_user_id,
                status=ParticipationStatus.GOING
            ).prefetch_related("event")
            
            participated_events = [
                {
                    "id": p.event.event_id,
                    "title": p.event.title,
                    "date": str(p.event.event_date),
                    "image_url": p.event.image_url 
                } for p in participations if p.event
            ]
            
            # Takip Edilen Kulüpler
            followed = await ClubFollowers.filter(user_id=target_user_id).prefetch_related("club")
            clubs = [{"id": f.club.club_id, "name": f.club.club_name} for f in followed if f.club]

            # Yorumlar buradan kaldırıldı, ayrı endpointten çekilecek.

            return {
                "profile": {
                    "id": user.user_id,
                    "full_name": f"{user.first_name} {user.last_name}",
                    "department": user.department,
                    "role": user.role,
                    "profile_photo": user.profile_image,
                    "bio": user.bio,
                    "interests": user.interests
                },
                "activities": {
                    "participated_events": participated_events,
                    "followed_clubs": clubs
                }
            }, 200
        except DoesNotExist:
            return {"error": "Kullanıcı bulunamadı"}, 404