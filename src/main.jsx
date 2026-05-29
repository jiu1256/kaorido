// src/main.jsx
// URLで管理画面とフロントを切り替えます
// http://localhost:5175/       → サイト本体
// http://localhost:5175/admin  → 管理画面

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Admin from './Admin.jsx'

const isAdmin = window.location.hash === '#admin'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdmin ? <Admin /> : <App />}
  </StrictMode>
)
