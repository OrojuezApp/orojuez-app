import React from 'react'
import ReactDOM from 'react-dom/client'
import OroJuezApp from './App.jsx'
import './style.css' // Esto busca el archivo en la misma carpeta src

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <OroJuezApp />
  </React.StrictMode>,
)