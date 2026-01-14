import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Cloud, CloudRain, Sun, Wind, Loader2, MapPin, RefreshCcw, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function WeatherWidget() {
  const { t, i18n } = useTranslation();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('Ankara');
  const [inputCity, setInputCity] = useState('Ankara');

  useEffect(() => {
    fetchWeather();
  }, [city, i18n.language]);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      // Backend rotasındaki URL ve parametre uyumsuzluklarını önlemek için params kullanıyoruz
      const { data } = await api.get('/weather', {
        params: { city, language: i18n.language }
      });

      // Hata ayıklama için konsola yazdırıyoruz (Widget çalışınca silebilirsin)
      console.log("Gelen Hava Durumu Verisi:", data);

      // Veri yapısı esnekliği: data.weather (servis katmanı) veya direkt data (proxy katmanı)
      const weatherData = data.weather || data;

      // Sıcaklık verisi var mı kontrol et
      if (weatherData && (weatherData.temperature !== undefined || weatherData.temp !== undefined)) {
        setWeather(weatherData);
      } else {
        console.warn("Hava durumu verisi beklenen formatta değil veya şehir bulunamadı:", data);
        setWeather(null);
      }
    } catch (err) {
      console.error('Hava durumu hatası:', err.response?.status, err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputCity.trim()) {
      setCity(inputCity.trim());
    }
  };

  const getWeatherIcon = (description) => {
    if (!description) return <Sun className="text-yellow-400" size={48} />;
    const desc = description.toLowerCase();
    // Rain keywords (TR + EN)
    if (desc.includes('yağmur') || desc.includes('çiseleme') || desc.includes('sağanak') ||
      desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) {
      return <CloudRain className="text-blue-300" size={48} />;
    }
    // Cloudy keywords (TR + EN)
    if (desc.includes('bulut') || desc.includes('kapalı') || desc.includes('sis') ||
      desc.includes('cloud') || desc.includes('overcast') || desc.includes('fog')) {
      return <Cloud className="text-gray-300" size={48} />;
    }
    // Snow keywords (TR + EN)
    if (desc.includes('kar') || desc.includes('snow')) {
      return <Cloud className="text-blue-100" size={48} />;
    }
    return <Sun className="text-yellow-400" size={48} />;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-xl min-h-[220px] flex flex-col items-center justify-center border border-white/10">
        <Loader2 className="animate-spin mb-3 opacity-80" size={40} />
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{t('weather_widget.loading')}</p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-3xl p-6 text-white shadow-xl min-h-[220px] flex flex-col items-center justify-center border border-white/10 text-center">
        <Cloud size={48} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm font-bold mb-4 opacity-80 italic">{t('weather_widget.not_found', { city })}</p>
        <button
          onClick={fetchWeather}
          className="flex items-center mx-auto text-[10px] font-black uppercase bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-xl transition-all active:scale-95"
        >
          <RefreshCcw size={14} className="mr-2" /> {t('weather_widget.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-2xl border border-white/10 transition-all hover:shadow-indigo-500/20">
      {/* Arama Alanı */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative group">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200 opacity-70" />
          <input
            type="text"
            value={inputCity}
            onChange={(e) => setInputCity(e.target.value)}
            placeholder={t('weather_widget.placeholder')}
            className="w-full bg-white/10 hover:bg-white/20 focus:bg-white/20 backdrop-blur-md rounded-2xl pl-10 pr-12 py-3 outline-none text-sm transition-all border border-white/5 focus:border-white/20"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <Search size={16} />
          </button>
        </div>
      </form>

      {/* Ana Veri Ekranı */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-black tracking-tight uppercase truncate max-w-[150px]">
            {weather.city || city}
          </h3>
          <div className="text-6xl font-black tracking-tighter my-1">
            {Math.round(weather.temperature || weather.temp)}°
          </div>
          <p className="text-sm font-bold text-blue-100/90 capitalize">
            {weather.description || t('weather_widget.default_desc')}
          </p>
        </div>

        <div className="flex flex-col items-center space-y-3">
          <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md border border-white/10 shadow-inner">
            {getWeatherIcon(weather.description || '')}
          </div>
          <div className="flex items-center text-[10px] font-black opacity-60">
            <Wind size={12} className="mr-1" />
            {weather.wind_speed || weather.windspeed || '0'} KM/S
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center opacity-40">
        <span className="text-[9px] font-black tracking-widest italic uppercase">Open-Meteo Proxy</span>
        <span className="text-[9px] font-black tracking-widest">REDIS 15M</span>
      </div>
    </div>
  );
}