import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'

// PWA Service Worker 更新提示
const updateSW = registerSW({
  onNeedRefresh() {
    // 新版本可用時顯示更新提示
    const toast = document.createElement('div')
    toast.id = 'sw-update-toast'
    toast.innerHTML = `
      <div style="position:fixed;bottom:80px;left:16px;right:16px;z-index:9999;
        background:#1a1a1a;color:white;padding:14px 16px;border-radius:12px;
        display:flex;align-items:center;justify-content:space-between;gap:12px;
        box-shadow:0 4px 20px rgba(0,0,0,0.3);font-family:'Noto Sans TC',sans-serif;font-size:14px;">
        <span>有新版本可用</span>
        <button onclick="document.getElementById('sw-update-toast').remove()"
          style="color:#999;background:none;border:none;font-size:13px;cursor:pointer;padding:4px;">
          稍後
        </button>
        <button id="sw-update-btn"
          style="background:#FC4C02;color:white;border:none;padding:8px 16px;
          border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">
          立即更新
        </button>
      </div>
    `
    document.body.appendChild(toast)
    document.getElementById('sw-update-btn')?.addEventListener('click', () => {
      updateSW(true)
    })
  },
  onOfflineReady() {
    // 離線就緒，可選顯示提示
    console.log('[PWA] 離線就緒')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
