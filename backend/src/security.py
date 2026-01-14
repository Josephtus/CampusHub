import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from src.config import SECRET_KEY

# Algoritmayı tek bir yerden yönetmek daha sağlıklıdır
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    """Parolayı tuzlayarak hashler."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Girilen parola ile hashlenmiş parolayı karşılaştırır."""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

def create_access_token(user_id: int, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Kullanıcı ID ve rolüne göre JWT Access Token üretir."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=1)
    
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": datetime.now(timezone.utc), # Token oluşturulma zamanı
        "exp": expire
    }
    
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)



def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Tokenı doğrular ve içeriğini döner. Geçersizse None döner."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        # Token süresi dolmuş
        return None
    except jwt.InvalidTokenError:
        # Token hatalı veya imza geçersiz
        return None
    except Exception:
        # Diğer beklenmedik hatalar
        return None