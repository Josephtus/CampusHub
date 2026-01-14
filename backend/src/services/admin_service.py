from src.models import Users, Clubs, Events, UserRole, EventComments, Notifications
from tortoise.exceptions import DoesNotExist
from tortoise.expressions import Q 
from tortoise.transactions import in_transaction 
from src.config import logger

class AdminService:

    @staticmethod
    async def get_dashboard_stats():
        """Dashboard için özet istatistikler (Model uyumlu)"""
        try:
            return {
                "stats": {
                    "users": await Users.filter(is_deleted=False).count(),
                    "active_clubs": await Clubs.filter(status="active", is_deleted=False).count(),
                    "pending_clubs": await Clubs.filter(status="pending", is_deleted=False).count(),
                    "events": await Events.filter(is_deleted=False).count()
                }
            }, 200
        except Exception as e:
            logger.error(f"Stats Error: {str(e)}")
            return {"error": "Failed to fetch stats"}, 500

    @staticmethod
    async def get_all_users(page: int, limit: int, search: str = None):
        """Kullanıcıları listeleme (is_active alanından arındırıldı)"""
        try:
            query = Users.filter(is_deleted=False)

            if search:
                query = query.filter(
                    Q(email__icontains=search) | 
                    Q(first_name__icontains=search) | 
                    Q(last_name__icontains=search)
                )

            total = await query.count()
            users = await query.offset((page - 1) * limit).limit(limit).order_by("-created_at")

            users_list = [{
                "id": u.user_id,
                "full_name": f"{u.first_name} {u.last_name}",
                "email": u.email,
                "role": u.role,
                "department": u.department,
                "profile_photo": u.profile_image 
            } for u in users]

            return {
                "users": users_list,
                "pagination": {
                    "total": total,
                    "page": page,
                    "limit": limit,
                    "total_pages": (total + limit - 1) // limit
                }
            }, 200
        except Exception as e:
            logger.error(f"User List Error: {str(e)}")
            return {"error": "Failed to fetch users"}, 500

    @staticmethod
    async def update_user_role(target_user_id: int, new_role: str, club_id: int = None):
        """Kullanıcı yetkisini değiştir ve Kulüp ataması yap."""
        try:
            if new_role not in [r.value for r in UserRole]:
                return {"error": "Geçersiz rol tanımlaması"}, 400

            user = await Users.get(user_id=target_user_id)

            if new_role == UserRole.CLUB_ADMIN:
                if not club_id:
                    return {"error": "Başkanlık yetkisi verirken bir kulüp seçmelisiniz."}, 400
                
                club = await Clubs.get_or_none(club_id=club_id)
                if not club:
                    return {"error": "Seçilen kulüp bulunamadı."}, 404
                
                if club.president_id and club.president_id != target_user_id:
                    current_president = await Users.get_or_none(user_id=club.president_id)
                    p_name = f"{current_president.first_name} {current_president.last_name}" if current_president else "Bilinmiyor"
                    return {"error": f"Bu kulübün zaten bir başkanı var: {p_name}"}, 400

                club.president_id = target_user_id
                await club.save()
                
            elif new_role == UserRole.STUDENT:
                await Clubs.filter(president_id=target_user_id).update(president_id=None)

            user.role = UserRole(new_role)
            await user.save()
            
            logger.info(f"Role Updated: User {target_user_id} is now {new_role}")
            return {"message": "Kullanıcı rolü ve kulüp bağlantısı güncellendi"}, 200

        except DoesNotExist:
            return {"error": "Kullanıcı bulunamadı"}, 404
        except Exception as e:
            logger.error(f"Role Update Error: {str(e)}")
            return {"error": f"İşlem başarısız: {str(e)}"}, 500

    @staticmethod
    async def toggle_user_ban(target_user_id: int):
        """Kullanıcıyı sil/silme (is_deleted üzerinden)"""
        try:
            user = await Users.get(user_id=target_user_id)
            if user.role == UserRole.ADMIN:
                return {"error": "Admin hesabı kısıtlanamaz"}, 400
            
            user.is_deleted = not user.is_deleted
            await user.save()
            
            action = "engellendi" if user.is_deleted else "etkinleştirildi"
            return {"message": f"Kullanıcı başarıyla {action}"}, 200
        except DoesNotExist:
            return {"error": "Kullanıcı bulunamadı"}, 404

    @staticmethod
    async def delete_comment(comment_id: int):
        """Yorum denetimi"""
        try:
            deleted_count = await EventComments.filter(comment_id=comment_id).delete()
            if deleted_count == 0:
                return {"error": "Yorum bulunamadı"}, 404
            return {"message": "Yorum başarıyla silindi"}, 200
        except Exception as e:
            return {"error": str(e)}, 500

    @staticmethod
    async def send_global_announcement(message: str):
        """Tüm kullanıcılara duyuru gönder"""
        try:
            users = await Users.filter(is_deleted=False).all()
            notif_objects = [
                Notifications(user_id=u.user_id, message=f"📢 DUYURU: {message}") 
                for u in users
            ]
            await Notifications.bulk_create(notif_objects)
            return {"message": f"Duyuru {len(users)} kişiye iletildi"}, 200
        except Exception as e:
            return {"error": "Duyuru gönderilemedi"}, 500

    @staticmethod
    async def update_club_details(club_id: int, data: dict):
        """Kulüp bilgilerini ve başkanını güncelle"""
        try:
            async with in_transaction():
                club = await Clubs.get(club_id=club_id)
                
                if "name" in data: club.club_name = data["name"]
                if "description" in data: club.description = data["description"]
                if "image_url" in data: club.logo_url = data["image_url"]
                
                if "president_id" in data:
                    new_pid = int(data["president_id"])
                    if club.president_id != new_pid:
                        new_president = await Users.get_or_none(user_id=new_pid)
                        if not new_president:
                            return {"error": "Yeni başkan bulunamadı"}, 404
                        
                        if club.president_id:
                            old_p = await Users.get_or_none(user_id=club.president_id)
                            if old_p and old_p.role == UserRole.CLUB_ADMIN:
                                old_p.role = UserRole.STUDENT
                                await old_p.save()

                        new_president.role = UserRole.CLUB_ADMIN
                        await new_president.save()
                        club.president_id = new_pid

                await club.save()
                return {"message": "Kulüp başarıyla güncellendi"}, 200
        except DoesNotExist:
            return {"error": "Kulüp bulunamadı"}, 404
        except Exception as e:
            return {"error": str(e)}, 500

    @staticmethod
    async def update_user_profile_as_admin(target_user_id: int, data: dict):
        """Adminin bir kullanıcının profil bilgilerini değiştirmesini sağlar"""
        try:
            user = await Users.get(user_id=target_user_id)
            
            if "bio" in data: user.bio = data["bio"]
            if "interests" in data: user.interests = data["interests"]
            if "department" in data: user.department = data["department"]
            if "profile_photo" in data: user.profile_image = data["profile_photo"]
            
            if "full_name" in data:
                names = data["full_name"].strip().split(" ")
                user.first_name = names[0]
                user.last_name = " ".join(names[1:]) if len(names) > 1 else ""
                
            await user.save()
            logger.info(f"Admin updated profile for user {target_user_id}")
            return {"message": "Kullanıcı profili başarıyla güncellendi"}, 200
        except DoesNotExist:
            return {"error": "Kullanıcı bulunamadı"}, 404
        except Exception as e:
            logger.error(f"Admin Profile Update Error: {str(e)}")
            return {"error": f"Güncelleme başarısız: {str(e)}"}, 500