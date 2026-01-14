import json
from src.models import Events, Clubs, EventParticipation, ParticipationStatus, UserRole, EventComments, Users
from tortoise.exceptions import DoesNotExist
from src.services.notification_service import NotificationService
from datetime import datetime, timezone
from tortoise.expressions import Q
from src.config import logger

class EventService:

    @staticmethod
    async def create_event(user_ctx, data):
        """
        Yeni bir etkinlik oluşturur ve takipçilere bildirim gönderir.
        Kapasite (kontenjan) kontrolü eklenmiştir.
        """
        club_id = data.get("club_id")
        club = await Clubs.get_or_none(club_id=club_id)
        
        if not club or club.is_deleted:
            return {"error": "Club not found"}, 404

        # Yetki Kontrolü
        if user_ctx["role"] != UserRole.ADMIN and club.president_id != user_ctx["sub"]:
            logger.warning(f"Unauthorized Event Creation Attempt by {user_ctx['sub']} for Club {club_id}")
            return {"error": "Unauthorized. Only presidents or admins can create events."}, 403

        # Kapasite Doğrulaması (0 ve altı engellendi)
        try:
            capacity = int(data.get("capacity", 0))
            if capacity <= 0:
                return {"error": "Etkinlik kapasitesi en az 1 olmalıdır."}, 400
        except (ValueError, TypeError):
            return {"error": "Lütfen geçerli bir sayısal kapasite değeri girin."}, 400

        try:
            event = await Events.create(
                title=data.get("title"),
                description=data.get("description"),
                event_date=data.get("date"),
                location=data.get("location"),
                quota=capacity,
                club_id=club_id,
                image_url=data.get("image_url"),
                created_by_id=user_ctx["sub"]
            )
            
            logger.info(f"Event Created: '{event.title}' (ID: {event.event_id})")
            await NotificationService.notify_followers(club.club_id, club.club_name, event.title)
            
            return {"message": "Event created successfully", "event_id": event.event_id}, 201
        except Exception as e:
            logger.error(f"Event Creation Error: {str(e)}")
            return {"error": "An error occurred while creating the event."}, 500

    @staticmethod
    async def update_event(user_ctx, event_id: int, data: dict):
        """Var olan bir etkinliği günceller."""
        try:
            event = await Events.get(event_id=event_id).prefetch_related("club")
            if not (user_ctx["role"] == UserRole.ADMIN or event.club.president_id == user_ctx["sub"]):
                return {"error": "Unauthorized"}, 403

            if "title" in data: event.title = data["title"]
            if "description" in data: event.description = data["description"]
            if "date" in data: event.event_date = data["date"]
            if "location" in data: event.location = data["location"]
            if "image_url" in data: event.image_url = data["image_url"]
            
            # Güncelleme sırasında kapasite kontrolü
            if "capacity" in data:
                try:
                    cap = int(data["capacity"])
                    if cap > 0: 
                        event.quota = cap
                    else:
                        return {"error": "Kapasite 0'dan büyük olmalıdır."}, 400
                except ValueError: 
                    return {"error": "Invalid capacity"}, 400

            await event.save()
            return {"message": "Event updated successfully"}, 200
        except DoesNotExist:
            return {"error": "Event not found"}, 404

    @staticmethod
    async def delete_event(user_ctx, event_id: int):
        """Etkinliği siler (Soft-delete)."""
        try:
            event = await Events.get(event_id=event_id).prefetch_related("club")
            if not (user_ctx["role"] == UserRole.ADMIN or event.club.president_id == user_ctx["sub"]):
                return {"error": "Unauthorized"}, 403

            event.is_deleted = True
            event.deleted_at = datetime.now(timezone.utc)
            await event.save()
            return {"message": "Event deleted successfully"}, 200
        except DoesNotExist:
            return {"error": "Event not found"}, 404

    @staticmethod
    async def get_event_detail(event_id: int, user_ctx=None): 
        """Etkinlik detaylarını getirir."""
        try:
            event = await Events.get(event_id=event_id).prefetch_related("club")
            if event.is_deleted: return {"error": "Event not found"}, 404
            
            participant_count = await EventParticipation.filter(
                event_id=event_id, status=ParticipationStatus.GOING
            ).count()

            is_joined = False
            if user_ctx and user_ctx.get("sub"):
                is_joined = await EventParticipation.filter(
                    event_id=event_id, 
                    user_id=user_ctx["sub"], 
                    status=ParticipationStatus.GOING
                ).exists()
            
            return {
                "event": {
                    "id": event.event_id,
                    "title": event.title,
                    "description": event.description,
                    "date": str(event.event_date),
                    "location": event.location,
                    "capacity": event.quota,
                    "image_url": event.image_url,
                    "club_name": event.club.club_name if event.club else "Unknown",
                    "club_id": event.club.club_id if event.club else None,
                    "participant_count": participant_count,
                    "is_joined": is_joined,
                    "is_full": event.quota > 0 and participant_count >= event.quota
                }
            }, 200
        except DoesNotExist:
            return {"error": "Event not found"}, 404

    @staticmethod
    async def add_comment(user_ctx, event_id: int, content: str):
        """Etkinliğe yorum ekler ve tam detaylı yorum objesini döner."""
        try:
            event = await Events.get(event_id=event_id)
            user = await Users.get(user_id=user_ctx["sub"])

            comment = await EventComments.create(
                event=event,
                user=user,
                content=content
            )

            return {
                "message": "Comment added successfully",
                "comment": {
                    "id": comment.comment_id,
                    "content": comment.content,
                    "username": f"{user.first_name} {user.last_name}",
                    "user_id": user.user_id,
                    "event_id": event.event_id,
                    "event_title": event.title,
                    "created_at": comment.created_at.strftime("%d %b %H:%M")
                }
            }, 201
        except DoesNotExist:
            return {"error": "Event or User not found"}, 404

    @staticmethod
    async def get_event_comments(event_id: int):
        """Bir etkinliğe yapılan tüm yorumları getirir."""
        comments = await EventComments.filter(event_id=event_id).prefetch_related("user").order_by("-created_at")
        
        return {
            "comments": [{
                "id": c.comment_id,
                "content": c.content,
                "username": f"{c.user.first_name} {c.user.last_name}" if c.user else "Anonymous",
                "created_at": c.created_at.strftime("%d %b %Y %H:%M")
            } for c in comments]
        }, 200

    @staticmethod
    async def get_events(redis, page: int = 1, limit: int = 20, search: str = None, date_filter: str = None):
        """Etkinlikleri listeler."""
        cache_key = f"events:page:{page}:lim:{limit}:s:{search}:d:{date_filter}"
        if redis:
            cached_data = await redis.get(cache_key)
            if cached_data: return json.loads(cached_data), 200

        query = Events.filter(is_deleted=False, club__status="active")
        if search:
            query = query.filter(Q(title__icontains=search) | Q(description__icontains=search))
        if date_filter:
            query = query.filter(event_date__gte=date_filter)

        total_count = await query.count()
        offset = (page - 1) * limit
        events = await query.prefetch_related("club").order_by("event_date").offset(offset).limit(limit)
        
        result_list = [{
            "id": e.event_id,
            "title": e.title,
            "description": e.description,
            "date": str(e.event_date),
            "club_name": e.club.club_name if e.club else "Unknown",
            "location": e.location,
            "image_url": e.image_url,
            "capacity": e.quota
        } for e in events]
            
        response_data = {
            "events": result_list,
            "pagination": {
                "total": total_count,
                "page": page,
                "limit": limit,
                "total_pages": (total_count + limit - 1) // limit
            }
        }
        if redis: await redis.set(cache_key, json.dumps(response_data), ex=60)
        return response_data, 200

    @staticmethod
    async def join_event(user_ctx, event_id: int):
        """Etkinliğe katılma."""
        try:
            event = await Events.get(event_id=event_id)
            if event.is_deleted: return {"error": "Event not found"}, 404
            current_count = await EventParticipation.filter(event_id=event_id, status=ParticipationStatus.GOING).count()
            if event.quota > 0 and current_count >= event.quota:
                return {"error": "Etkinlik kontenjanı dolu."}, 400
            exists = await EventParticipation.filter(user_id=user_ctx["sub"], event_id=event_id).exists()
            if exists: return {"message": "Zaten bu etkinliğe kayıtlısınız."}, 400
            await EventParticipation.create(user_id=user_ctx["sub"], event_id=event_id, status=ParticipationStatus.GOING)
            return {"message": "Successfully joined"}, 200
        except DoesNotExist:
            return {"error": "Event not found"}, 404

    @staticmethod
    async def leave_event(user_ctx, event_id: int):
        deleted_count = await EventParticipation.filter(user_id=user_ctx["sub"], event_id=event_id).delete()
        if deleted_count == 0: return {"error": "Not joined"}, 400
        return {"message": "Successfully left"}, 200