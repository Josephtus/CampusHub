import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LoadingSpinner({ size = 'md', text }) {
  const { t } = useTranslation();
  const displayText = text || t('loading_spinner.default_text');

  const sizes = {
    sm: 24,
    md: 48,
    lg: 64
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2
        className="animate-spin text-blue-600 mb-4"
        size={sizes[size]}
      />
      <p className="text-gray-500 font-medium">{displayText}</p>
    </div>
  );
}