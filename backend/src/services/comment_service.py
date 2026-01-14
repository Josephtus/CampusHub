from src.models import EventComments, Events, Users
from tortoise.exceptions import DoesNotExist

class CommentService:

    @staticmethod
    async def add_comment(user_ctx, event_id: int, content: str):
        # 1. Etkinlik kontrolü
        if not await Events.exists(event_id=event_id):
            return {"error": "Event not found"}, 404

        try:
            # 2. Kullanıcıyı detaylarıyla çek (Bölüm ve Fotoğraf bilgisi için)
            user = await Users.get(user_id=user_ctx["sub"])

            # 3. Yorumu oluştur
            comment = await EventComments.create(
                user_id=user.user_id,
                event_id=event_id,
                content=content
            )

            # 4. Frontend'e hemen göstermek için detaylı obje döndür
            return {
                "message": "Yorum eklendi", 
                "comment": {
                    "id": comment.comment_id,
                    "content": comment.content,
                    "user_name": f"{user.first_name} {user.last_name}",
                    "department": user.department,          # YENİ: Bölüm Bilgisi
                    "user_id": user.user_id,                # YENİ: Profil Linki İçin ID
                    "profile_photo": user.profile_image,    # YENİ: Avatar İçin
                    "created_at": comment.created_at.strftime("%d %b %Y %H:%M") # Formatlı Tarih
                }
            }, 201
        except DoesNotExist:
            return {"error": "User not found"}, 404

    @staticmethod
    async def get_comments(event_id: int):
        # Yorumları ve kullanıcı detaylarını getir
        comments = await EventComments.filter(event_id=event_id).prefetch_related("user").order_by("-created_at")
        
        result = []
        for c in comments:
            # Kullanıcı varsa bilgilerini al, yoksa (silinmişse) anonim yap
            if c.user:
                user_data = {
                    "user_name": f"{c.user.first_name} {c.user.last_name}",
                    "department": c.user.department,        # YENİ
                    "user_id": c.user.user_id,              # YENİ
                    "profile_photo": c.user.profile_image   # YENİ
                }
            else:
                user_data = {
                    "user_name": "Anonim Kullanıcı",
                    "department": "",
                    "user_id": None,
                    "profile_photo": None
                }

            result.append({
                "id": c.comment_id,
                "content": c.content,
                "created_at": c.created_at.strftime("%d %b %Y %H:%M"),
                **user_data # user_data içindeki tüm alanları buraya yay
            })
            
        return {"comments": result}, 200