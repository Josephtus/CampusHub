import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n' // <--- BU SATIRI EKLEDİK

// Basit bir yükleme ekranı
// 1. Bu, "Loading" adında basit bir bileşen. 
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen text-gray-500 font-bold">
    Yükleniyor...
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Suspense, altındaki bileşenler (App) hazır olana kadar 
           fallback (yedek) olarak verdiğimiz Loading bileşenini gösterir. */}
    <Suspense fallback={<Loading />}> 
      <App />
    </Suspense>
  </React.StrictMode>,
)