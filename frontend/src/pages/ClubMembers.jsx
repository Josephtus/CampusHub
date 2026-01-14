import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { UserMinus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ClubMembers() {
  const { t } = useTranslation();
  const { clubId } = useParams();
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetchMembers();
  }, [clubId]);

  const fetchMembers = async () => {
    // Kulüp detayından üyeleri (followers) çeker
    const { data } = await api.get(`/clubs/${clubId}`);
    setMembers(data.club.events); // Gerçek projede backend'e 'get_followers' rotası eklenirse daha temiz olur
  };

  const handleKick = async (userId) => {
    if (!window.confirm(t('club_members.confirm_kick'))) return;
    try {
      await api.post(`/clubs/${clubId}/remove-member`, { user_id: userId }); //
      alert(t('club_members.kick_success'));
      fetchMembers();
    } catch (err) {
      alert(t('club_members.error_auth'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-2xl font-black mb-8">{t('club_members.title')}</h2>
      <div className="bg-white rounded-2xl border overflow-hidden">
        {/* Örnek Satır */}
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-bold">{t('club_members.col_name')}</span>
          <button onClick={() => handleKick(123)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
            <UserMinus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}