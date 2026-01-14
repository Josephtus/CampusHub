from sanic import Blueprint
from sanic.response import json
from src.services.weather_service import WeatherService

# strict_slashes=False: /weather ve /weather/ ikisini de kabul eder
weather_bp = Blueprint("weather", url_prefix="/weather", strict_slashes=False)

@weather_bp.get("/")
async def get_weather(request):
    # Şehir parametresi al (Varsayılan: Ankara)
    city = request.args.get("city", "Ankara")
    lang = request.args.get("language", "tr")

    
    # Redis bağlantısını al
    redis = request.app.ctx.redis
    
    result, status = await WeatherService.get_current_weather(redis, city, lang)
    return json(result, status=status)