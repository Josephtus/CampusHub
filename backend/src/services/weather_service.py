import aiohttp
import json
from src.config import logger
from typing import Optional, Tuple, Dict, Any

class WeatherService:
    """
    Open-Meteo API kullanarak hava durumu bilgilerini çeken servis.
    Geocoding (Şehir -> Koordinat) ve Hava Durumu (Koordinat -> Veri) işlemlerini yönetir.
    """

    @staticmethod
    async def get_current_weather(redis, city: str = "Ankara", lang: str = "tr" ) -> Tuple[Dict[str, Any], int]:
        """
        Şehir ismine göre güncel hava durumunu döner. 
        Veriler 15 dakika (900 sn) boyunca Redis'te önbelleğe alınır.
        """
        cache_key = f"weather:{city.lower()}:{lang}"
        
        # 1. ADIM: Redis Önbellek Kontrolü
        if redis:
            cached_data = await redis.get(cache_key)
            if cached_data:
                logger.info(f"Weather fetched from Cache for {city}")
                return json.loads(cached_data), 200

        # Güvenlik ve API politikaları için User-Agent tanımlıyoruz
        headers = {
            "User-Agent": "CampusHub-Project/1.0 (Student Project; contact@example.com)"
        }

        try:
            # trust_env=True: Docker veya VPN/Proxy ortamlarında sistem ayarlarını kullanır
            async with aiohttp.ClientSession(trust_env=True) as session:
                
                # 2. ADIM: Geocoding - Şehir isminden koordinat bulma
                geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language={lang}&format=json"
                
                async with session.get(geo_url, headers=headers, timeout=10) as geo_resp:
                    if geo_resp.status != 200:
                        logger.error(f"Geo API Error: {geo_resp.status}")
                        return {"error": "Geocoding service currently unavailable"}, 503
                    
                    geo_data = await geo_resp.json()
                    
                    if not geo_data.get("results"):
                        return {"error": f"City '{city}' not found"}, 404
                    
                    location = geo_data["results"][0]
                    lat = location["latitude"]
                    lon = location["longitude"]
                    city_name = location["name"]

                # 3. ADIM: Weather - Koordinatlardan hava durumu çekme
                weather_url = (
                    f"https://api.open-meteo.com/v1/forecast?"
                    f"latitude={lat}&longitude={lon}&current_weather=true"
                )
                
                async with session.get(weather_url, headers=headers, timeout=10) as weather_resp:
                    if weather_resp.status != 200:
                        logger.error(f"Weather API Error: {weather_resp.status}")
                        return {"error": "Weather service currently unavailable"}, 503
                    
                    w_data = await weather_resp.json()
                    current = w_data.get("current_weather", {})

                    # Weather code'u insan diline çeviriyoruz
                    weather_code = current.get("weathercode", 0)
                    description = WeatherService.get_weather_desc(weather_code, lang)

                    weather_info = {
                        "city": city_name,
                        "temperature": current.get("temperature"),
                        "wind_speed": current.get("windspeed"),
                        "description": description,
                        "latitude": lat,
                        "longitude": lon,
                        "updated_at": str(current.get("time")) # API'den gelen güncelleme zamanı
                    }

                    # 4. ADIM: Redis'e Kaydet (15 Dakika Geçerli)
                    if redis:
                        await redis.set(cache_key, json.dumps(weather_info), ex=900)
                    
                    logger.info(f"Weather fetched from Open-Meteo API for {city}")
                    return {"weather": weather_info}, 200

        except aiohttp.ClientConnectorError as e:
            logger.error(f"Network Connection Error: {str(e)}")
            return {"error": "External API connection failed. Check internet/Docker DNS."}, 500
        except Exception as e:
            logger.error(f"Weather Service Unexpected Error: {str(e)}")
            return {"error": "An internal service error occurred."}, 500

    @staticmethod
    def get_weather_desc(code: int, lang: str = "tr") -> str:
        """WMO Weather Interpretation Codes - Bilingual support (TR/EN)."""
        codes_tr = {
            0: "Açık", 1: "Çoğunlukla Açık", 2: "Parçalı Bulutlu", 3: "Kapalı",
            45: "Sisli", 48: "Kırağı Sis", 51: "Hafif Çiseleme", 53: "Çiseleme",
            55: "Yoğun Çiseleme", 61: "Hafif Yağmur", 63: "Yağmur", 65: "Şiddetli Yağmur",
            71: "Hafif Kar", 73: "Kar Yağışlı", 75: "Yoğun Kar", 77: "Kar Taneleri",
            80: "Hafif Sağanak", 81: "Sağanak Yağmur", 82: "Şiddetli Sağanak",
            95: "Fırtına", 96: "Hafif Dolu Fırtınası", 99: "Şiddetli Dolu Fırtınası"
        }
        codes_en = {
            0: "Clear", 1: "Mostly Clear", 2: "Partly Cloudy", 3: "Overcast",
            45: "Foggy", 48: "Freezing Fog", 51: "Light Drizzle", 53: "Drizzle",
            55: "Heavy Drizzle", 61: "Light Rain", 63: "Rain", 65: "Heavy Rain",
            71: "Light Snow", 73: "Snow", 75: "Heavy Snow", 77: "Snow Grains",
            80: "Light Showers", 81: "Showers", 82: "Heavy Showers",
            95: "Thunderstorm", 96: "Light Hail Storm", 99: "Heavy Hail Storm"
        }
        codes = codes_en if lang == "en" else codes_tr
        default = "Unknown" if lang == "en" else "Bilinmiyor"
        return codes.get(code, default)