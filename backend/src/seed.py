import asyncio
from tortoise import Tortoise
from src.config import DB_URL
from src.models import Users, Clubs, Events, UserRole
from src.security import hash_password
from datetime import datetime, timedelta
import random

async def seed_data():
    print("🌱 Veritabanı bağlantısı kuruluyor...")
    await Tortoise.init(
        db_url=DB_URL,
        modules={'models': ['src.models']}
    )
    await Tortoise.generate_schemas()

    print("🗑️  Mevcut veriler temizleniyor...")
    await Events.all().delete()
    await Clubs.all().delete()
    await Users.all().delete()

    # Ortak Şifre Hash'i (Hız için tek seferde hesapla)
    common_password = hash_password("123456")

    # ---------------------------------------------------------
    # 1. ADMIN OLUŞTURMA
    # ---------------------------------------------------------
    print("👑 Admin kullanıcısı oluşturuluyor...")
    admin = await Users.create(
        user_id=1000, 
        email="admin@campus.hub",
        password=common_password,
        first_name="Sistem",
        last_name="Yöneticisi",
        role=UserRole.ADMIN,
        department="Bilgi İşlem",
        profile_image="https://ui-avatars.com/api/?name=Sistem+Yöneticisi&background=ef4444&color=fff"
    )

    # ---------------------------------------------------------
    # 2. KULÜPLER VE BAŞKANLARI OLUŞTURMA (20 ADET)
    # ---------------------------------------------------------
    print("🏰 20 Kulüp ve Başkanı oluşturuluyor...")
    
    departments = ["Bilgisayar Müh.", "Endüstri Müh.", "Mimarlık", "İşletme", "Hukuk", "Tıp", "Psikoloji"]
    club_types = ["Teknoloji", "Sanat", "Spor", "Müzik", "Girişimcilik", "Doğa", "Sinema", "Tiyatro", "E-Spor", "Dans"]

    for i in range(1, 21):
        # Kulüp Başkanı (ID: 2000 + i)
        president_id = 2000 + i
        dept = random.choice(departments)
        
        president = await Users.create(
            user_id=president_id, 
            email=f"baskan{i}@kulup.com",
            password=common_password,
            first_name=f"Baskan",
            last_name=f"No{i}",
            role=UserRole.CLUB_ADMIN,
            department=dept,
            profile_image=f"https://ui-avatars.com/api/?name=Baskan+{i}&background=random"
        )

        # Kulüp
        club_name = f"{random.choice(club_types)} Kulübü {i}"
        # Benzersiz isim garantisi için sonuna sayı ekliyoruz
        if i > 10: club_name += f" (Şube {i})"

        club = await Clubs.create(
            club_name=club_name,
            description=f"Kampüsün en aktif {i}. topluluğu. Birlikte üretip, birlikte eğleniyoruz.",
            logo_url=f"https://ui-avatars.com/api/?name={club_name.replace(' ', '+')}&rounded=true&background=random",
            president=president,
            created_by=admin,
            status="active"
        )

        # ---------------------------------------------------------
        # 3. HER KULÜP İÇİN 20 ETKİNLİK OLUŞTURMA
        # ---------------------------------------------------------
        print(f"   -> '{club.club_name}' için 20 etkinlik ekleniyor...")
        
        event_locations = ["Ana Kampüs", "B-Blok Konferans Salonu", "Kütüphane", "Online (Zoom)", "Stadyum"]
        
        for j in range(1, 21):
            # Tarihleri bugünden itibaren yayıyoruz
            event_day = datetime.now() + timedelta(days=(j * 2) + i) 
            
            await Events.create(
                title=f"{club.club_name} - Etkinlik #{j}",
                description=f"Bu etkinlikte üyelerimizle bir araya gelip {j}. haftanın gündemini konuşacağız.",
                event_date=event_day,
                location=random.choice(event_locations),
                quota=random.randint(20, 200), # Rastgele kontenjan
                club=club,
                created_by=president,
                image_url=f"https://placehold.co/600x400?text=Etkinlik+{j}"
            )

    # ---------------------------------------------------------
    # 4. ÖĞRENCİLERİ OLUŞTURMA (20 ADET)
    # ---------------------------------------------------------
    print("🎓 20 Öğrenci oluşturuluyor...")
    
    for k in range(1, 21):
        student_id = 3000 + k
        dept = random.choice(departments)
        
        await Users.create(
            user_id=student_id, 
            email=f"ogrenci{k}@univ.edu",
            password=common_password,
            first_name=f"Ogrenci",
            last_name=f"No{k}",
            role=UserRole.STUDENT,
            department=dept,
            profile_image=f"https://ui-avatars.com/api/?name=Ogrenci+{k}&background=random"
        )

    print("\n✅ SEED İŞLEMİ TAMAMLANDI!")
    print("--------------------------------------------------")
    print(f"👤 Admin: admin@campus.hub | Şifre: 123456")
    print(f"👤 Başkanlar: baskan1@kulup.com ... baskan20@kulup.com | Şifre: 123456")
    print(f"👤 Öğrenciler: ogrenci1@univ.edu ... ogrenci20@univ.edu | Şifre: 123456")
    print("--------------------------------------------------")
    
    await Tortoise.close_connections()

if __name__ == "__main__":
    asyncio.run(seed_data())