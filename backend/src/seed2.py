import asyncio
from tortoise import Tortoise
from src.config import DB_URL
from src.models import Users, Clubs, Events, UserRole
from src.security import hash_password

async def seed_data():
    print("🌱 Veritabanı bağlantısı kuruluyor...")
    await Tortoise.init(
        db_url=DB_URL,
        modules={'models': ['src.models']}
    )
    await Tortoise.generate_schemas()

    print("🗑️  Mevcut veriler temizleniyor...")
    # Önce bağımlı tabloları (Events, Clubs) silip en son Users'ı siliyoruz
    await Events.all().delete()
    await Clubs.all().delete()
    await Users.all().delete()

    # Ortak Şifre Hash'i
    common_password = hash_password("123456")

    # ---------------------------------------------------------
    # 1. ADMIN OLUŞTURMA
    # ---------------------------------------------------------
    print("👑 Admin kullanıcısı oluşturuluyor...")
    await Users.create(
        user_id=1000, 
        email="admin@gmail.com",
        password=common_password,
        first_name="Sistem",
        last_name="Yöneticisi",
        role=UserRole.ADMIN,
        department="Bilgi İşlem",
        profile_image="https://ui-avatars.com/api/?name=Sistem+Yöneticisi&background=ef4444&color=fff"
    )

    print("\n✅ SEED İŞLEMİ TAMAMLANDI!")
    print("--------------------------------------------------")
    print(f"👤 Admin: admin@campus.hub | Şifre: 123456")
    print("--------------------------------------------------")
    
    await Tortoise.close_connections()

if __name__ == "__main__":
    asyncio.run(seed_data())