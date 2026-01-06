import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Tesseract from 'tesseract.js';
import './style.css'; 
import { Camera, LogOut, Eye, Trash2 } from 'lucide-react';

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

  // Estados para formularios
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', nombre: '', sitio_id: '', rol: '' });
  const [nuevoSitio, setNuevoSitio] = useState({ nombre: '', ciudad: '' });
  
  // Estados para captura
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

  const handleGuardarUsuario = async (e) => {
    e.preventDefault();
    setLoading(true);
    const sitioRel = sitios.find(s => s.id === nuevoUsuario.sitio_id);
    const { error } = await supabase.from('perfiles_usuarios').insert([{
      ...nuevoUsuario,
      nombre_sitio: sitioRel?.nombre || '',
      ciudad: sitioRel?.ciudad || ''
    }]);
    if (error) alert("Error: " + error.message);
    else {
      alert("USUARIO CREADO");
      setNuevoUsuario({ email: '', nombre: '', sitio_id: '', rol: '' });
      cargarDatos();
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim().toLowerCase();
    if (email === 'industria.orojuez@gmail.com') {
      setUser({ email, nombre: 'Super Admin', rol: 'admin' });
      setView('dashboard');
    } else {
      const { data } = await supabase.from('perfiles_usuarios').select('*').eq('email', email).single();
      if (data) { setUser(data); setView('dashboard'); }
      else alert("No autorizado");
    }
  };

  const takePhoto = async () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    const imageData = canvasRef.current.toDataURL('image/jpeg');
    setPhoto(imageData);
    setStreaming(false);
    videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    setLoading(true);
    const { data: { text } } = await Tesseract.recognize(imageData, 'eng');
    const num = text.match(/\d+(\.\d+)?/g);
    if (num) setPesoOCR(num[0]);
    setLoading(false);
  };

  if (view === 'login') return (
    <div className="container" style={{padding:'50px'}}>
      <div className="navbar"><h1>ORO JUEZ V3</h1></div>
      <form onSubmit={handleLogin} style={{marginTop:'20px'}}>
        <input name="email" type="email" placeholder="Email" required />
        <button className="navbar" style={{width:'100%', color:'white', border:'none', padding:'10px', marginTop:'10px'}}>ENTRAR</button>
      </form>
    </div>
  );

  return (
    <div className="container">
      <div className="navbar" style={{display:'flex', justifyContent:'space-between'}}>
        <span>ORO JUEZ V3 | {user.rol}</span>
        <button onClick={() => setView('login')} style={{color:'white', background:'none', border:'none'}}><LogOut/></button>
      </div>

      <div style={{display:'flex', gap:'10px', margin:'10px'}}>
        <button onClick={() => setView('dashboard')}>CAPTURA</button>
        <button onClick={() => setView('reportes')}>REPORTES</button>
        {user.rol === 'admin' && (
          <>
            <button onClick={() => setView('sitios')}>SEDES</button>
            <button onClick={() => setView('usuarios')}>USUARIOS</button>
          </>
        )}
      </div>

      <div className="content-box">
        {view === 'usuarios' && (
          <form onSubmit={handleGuardarUsuario} className="card">
            <input value={nuevoUsuario.nombre} onChange={e=>setNuevoUsuario({...nuevoUsuario, nombre:e.target.value})} placeholder="Nombre" required />
            <input value={nuevoUsuario.email} onChange={e=>setNuevoUsuario({...nuevoUsuario, email:e.target.value})} placeholder="Email" required />
            
            <select value={nuevoUsuario.rol} onChange={e=>setNuevoUsuario({...nuevoUsuario, rol:e.target.value})} required style={{margin:'10px 0', padding:'10px', border:'2px solid red'}}>
              <option value="">-- SELECCIONAR ROL --</option>
              <option value="admin">Administrador</option>
              <option value="auditor">Auditor</option>
              <option value="operativo">Operativo</option>
            </select>

            <select value={nuevoUsuario.sitio_id} onChange={e=>setNuevoUsuario({...nuevoUsuario, sitio_id:e.target.value})} required>
              <option value="">-- ASIGNAR SEDE --</option>
              {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            <button type="submit" className="navbar" style={{color:'white', width:'100%', border:'none', marginTop:'10px'}}>{loading?'Guardando...':'REGISTRAR'}</button>
          </form>
        )}

        {view === 'dashboard' && (
           <div className="card">
              {!photo && !streaming && <button onClick={()=>{setStreaming(true); navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s=>videoRef.current.srcObject=s)}}>ABRIR CÁMARA</button>}
              {streaming && <video ref={videoRef} autoPlay playsInline style={{width:'100%'}} />}
              {streaming && <button onClick={takePhoto}>CAPTURAR</button>}
              {photo && <img src={photo} style={{width:'100%'}} />}
              {photo && <div><p>OCR: {pesoOCR || 'leyendo...'}</p><input type="number" value={pesoManual} onChange={e=>setPesoManual(e.target.value)} placeholder="Peso Manual" /></div>}
           </div>
        )}

        {view === 'reportes' && (
          <table>
            <thead><tr><th>Fecha</th><th>Sede</th><th>Peso</th></tr></thead>
            <tbody>
              {reportes.map(r => <tr key={r.id}><td>{new Date(r.created_at).toLocaleDateString()}</td><td>{r.nombre_sitio}</td><td>{r.peso_manual}</td></tr>)}
            </tbody>
          </table>
        )}
      </div>
      <canvas ref={canvasRef} style={{display:'none'}} width="640" height="480" />
      <div style={{fontSize:'10px', marginTop:'20px'}}>SISTEMA V3 - CONTROL DE ROLES ACTIVO</div>
    </div>
  );
};
export default OroJuezApp;