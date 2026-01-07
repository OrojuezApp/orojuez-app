import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Tesseract from 'tesseract.js';
import './style.css'; 
import { Camera, LogOut, Eye, Trash2, Lock, Mail, User, Key, Edit2, X, Check, RefreshCw } from 'lucide-react';

const SUPABASE_URL = 'https://khgqeqrnlbhadoarcgul.supabase.co';
const SUPABASE_KEY = 'sb_publishable_S5Gk22ej_r8hIZw92b16gw_MBOImAJV';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const OroJuezApp = () => {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [sitios, setSitios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', nombre: '', sitio_id: '', rol: '', password: '' });
  const [editandoId, setEditandoId] = useState(null);
  const [usuarioEditado, setUsuarioEditado] = useState(null);
  const [nuevaClave, setNuevaClave] = useState('');
  
  const [photo, setPhoto] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [pesoOCR, setPesoOCR] = useState(null);
  const [pesoManual, setPesoManual] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: s } = await supabase.from('sitios').select('*').order('ciudad');
    const { data: u } = await supabase.from('perfiles_usuarios').select('*').order('created_at', { ascending: false });
    const { data: r } = await supabase.from('reportes_pesaje').select('*').order('created_at', { ascending: false });
    if (s) setSitios(s);
    if (u) setUsuarios(u);
    if (r) setReportes(r);
  };

  // --- FILTRO AVANZADO PARA NÚMEROS ROJOS ---
  const aplicarFiltroIndustrial = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      
      // Umbral: Si el pixel tiene mucho ROJO (típico de Cardinal Storm)
      if (r > 130 && r > g * 1.5) {
        data[i] = data[i+1] = data[i+2] = 0; // Lo volvemos NEGRO (el número)
      } else {
        data[i] = data[i+1] = data[i+2] = 255; // Lo volvemos BLANCO (el fondo)
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/jpeg', 1.0);
  };

  const takePhoto = async () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    const originalImage = canvas.toDataURL('image/jpeg');
    setPhoto(originalImage);
    setStreaming(false);
    if (videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());

    setLoading(true);
    try {
      // Aplicamos el filtro para que el OCR vea números negros sobre fondo blanco puro
      const imagenFiltrada = aplicarFiltroIndustrial(canvas);
      
      const { data: { text } } = await Tesseract.recognize(imagenFiltrada, 'eng', {
        tessedit_char_whitelist: '0123456789',
        tessedit_pageseg_mode: '6' // Modo optimizado para bloques de texto/números
      });
      
      const num = text.replace(/\D/g, "");
      setPesoOCR(num || "Reintentar enfoque");
    } catch (err) { 
        setPesoOCR("Error"); 
    }
    setLoading(false);
  };

  const guardarPesaje = async () => {
    if (!pesoManual) return alert("Ingrese el peso manual");
    setLoading(true);
    const pOCR = parseInt(pesoOCR) || 0;
    const { error } = await supabase.from('reportes_pesaje').insert([{
      sitio_id: user.sitio_id, 
      nombre_sitio: user.nombre_sitio || 'Sede', 
      ciudad: user.ciudad || 'N/A',
      usuario_email: user.email, 
      nombre_usuario: user.nombre, 
      peso_ocr: pOCR, 
      peso_manual: parseFloat(pesoManual), 
      diferencia: parseFloat(pesoManual) - pOCR, 
      foto_url: photo
    }]);
    if (!error) { 
      alert("Control Guardado"); 
      setPhoto(null); setPesoManual(''); setPesoOCR(null); 
      cargarDatos();
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim().toLowerCase();
    const password = e.target.password.value.trim();
    if (email === 'industria.orojuez@gmail.com' && password === 'admin123') {
      setUser({ email, nombre: 'Super Admin', rol: 'admin' }); setView('dashboard');
    } else {
      const { data } = await supabase.from('perfiles_usuarios').select('*').eq('email', email).eq('password', password).single();
      if (data) { setUser(data); setView('dashboard'); } else alert("Credenciales incorrectas");
    }
  };

  // --- VISTAS ---
  if (view === 'login') return (
    <div className="container" style={{padding:'40px 20px', maxWidth:'400px', margin:'auto'}}>
      <div className="navbar"><h1>ORO JUEZ V3.8</h1></div>
      <form onSubmit={handleLogin} style={{marginTop:'30px', display:'flex', flexDirection:'column', gap:'15px'}}>
        <input name="email" type="email" placeholder="Email" required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ccc'}} />
        <input name="password" type="password" placeholder="Contraseña" required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ccc'}} />
        <button className="navbar" style={{color:'white', border:'none', padding:'15px', borderRadius:'8px'}}>INGRESAR</button>
      </form>
    </div>
  );

  return (
    <div className="container">
      <div className="navbar" style={{display:'flex', justifyContent:'space-between', padding:'10px 20px'}}>
        <span>{user.nombre}</span>
        <button onClick={() => setView('login')} style={{color:'white', background:'none', border:'none'}}><LogOut/></button>
      </div>

      <div style={{display:'flex', gap:'5px', margin:'10px'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{flex:1, padding:'10px'}}>CAPTURA</button>
        <button onClick={() => setView('reportes')} className="card" style={{flex:1, padding:'10px'}}>REPORTES</button>
        {user.rol === 'admin' && <button onClick={() => setView('usuarios')} className="card" style={{flex:1, padding:'10px'}}>USERS</button>}
      </div>

      <div className="content-box">
        {view === 'dashboard' && (
           <div className="card" style={{padding:'20px'}}>
              {!photo && !streaming && <button onClick={()=>{setStreaming(true); navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s=>videoRef.current.srcObject=s)}} className="navbar" style={{color:'white', border:'none', padding:'30px', borderRadius:'50%'}}><Camera size={40}/></button>}
              {streaming && <video ref={videoRef} autoPlay playsInline style={{width:'100%', borderRadius:'15px'}} />}
              {streaming && <button onClick={takePhoto} className="navbar" style={{width:'100%', color:'white', padding:'15px', marginTop:'10px', borderRadius:'10px'}}>LEER BÁSCULA</button>}
              {photo && (
                <div>
                  <img src={photo} style={{width:'100%', borderRadius:'15px'}} />
                  <div style={{background:'#000', color:'#00ff00', padding:'15px', borderRadius:'10px', margin:'10px 0', fontSize:'1.5rem', fontFamily:'monospace'}}>
                    OCR: {loading ? "Analizando..." : pesoOCR}
                  </div>
                  <input type="number" value={pesoManual} onChange={e=>setPesoManual(e.target.value)} placeholder="PESO MANUAL" style={{fontSize:'1.8rem', textAlign:'center', width:'100%', border:'2px solid #ffc107'}} />
                  <button onClick={guardarPesaje} className="navbar" style={{width:'100%', color:'white', padding:'18px', marginTop:'15px', borderRadius:'10px'}}>GUARDAR REPORTE</button>
                  <button onClick={()=>{setPhoto(null); setPesoOCR(null);}} style={{width:'100%', marginTop:'10px', background:'none', border:'1px solid #ccc', padding:'10px'}}>REPETIR FOTO</button>
                </div>
              )}
           </div>
        )}

        {view === 'reportes' && (
          <div style={{padding:'10px'}}>
            {reportes.map(r => (
               <div key={r.id} className="card" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', padding:'15px', textAlign:'left', borderLeft: Math.abs(r.diferencia) > 5 ? '5px solid red' : '5px solid green'}}>
                  <div>
                    <strong>{r.nombre_sitio}</strong><br/>
                    <small>M: {r.peso_manual} | O: {r.peso_ocr} | Dif: {r.diferencia}kg</small>
                  </div>
                  <button onClick={()=>window.open(r.foto_url)} style={{background:'none', border:'none', color:'#ffc107'}}><Eye/></button>
               </div>
            ))}
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{display:'none'}} width="640" height="480" />
    </div>
  );
};

export default OroJuezApp;