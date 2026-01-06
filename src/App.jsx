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

  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', nombre: '', sitio_id: '', rol: '' });
  const [nuevoSitio, setNuevoSitio] = useState({ nombre: '', ciudad: '' });
  
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
    if (!nuevoUsuario.rol) return alert("¡ERROR! Debe seleccionar un ROL (Admin, Auditor u Operativo).");
    setLoading(true);
    const sitioRel = sitios.find(s => s.id === nuevoUsuario.sitio_id);
    const { error } = await supabase.from('perfiles_usuarios').insert([{
      ...nuevoUsuario,
      nombre_sitio: sitioRel?.nombre || '',
      ciudad: sitioRel?.ciudad || ''
    }]);
    if (error) alert("Error: " + error.message);
    else {
      alert("USUARIO CREADO CORRECTAMENTE");
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
      else alert("Usuario no autorizado.");
    }
  };

  const takePhoto = async () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    const imageData = canvasRef.current.toDataURL('image/jpeg');
    setPhoto(imageData);
    setStreaming(false);
    if (videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    setLoading(true);
    try {
        const { data: { text } } = await Tesseract.recognize(imageData, 'eng');
        const num = text.match(/\d+(\.\d+)?/g);
        if (num) setPesoOCR(num[0]);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const guardarPesaje = async () => {
    setLoading(true);
    const { error } = await supabase.from('reportes_pesaje').insert([{
      sitio_id: user.sitio_id, 
      nombre_sitio: user.nombre_sitio || 'Sede Central', 
      ciudad: user.ciudad || 'N/A',
      usuario_email: user.email, 
      nombre_usuario: user.nombre,
      peso_ocr: pesoOCR || 0, 
      peso_manual: parseFloat(pesoManual),
      diferencia: parseFloat(pesoManual) - (pesoOCR || 0), 
      foto_url: photo
    }]);
    if (!error) {
      alert("Registro guardado en base de datos.");
      setPhoto(null); setPesoManual(''); setPesoOCR(null);
      cargarDatos();
    }
    setLoading(false);
  };

  if (view === 'login') return (
    <div className="container" style={{padding:'50px'}}>
      <div className="navbar"><h1>ORO JUEZ V3</h1></div>
      <form onSubmit={handleLogin} style={{marginTop:'20px'}}>
        <input name="email" type="email" placeholder="Email Registrado" required style={{padding:'15px', width:'100%'}} />
        <button className="navbar" style={{width:'100%', color:'white', border:'none', padding:'15px', marginTop:'15px', cursor:'pointer'}}>ENTRAR AL SISTEMA</button>
      </form>
    </div>
  );

  return (
    <div className="container">
      <div className="navbar" style={{display:'flex', justifyContent:'space-between', padding:'10px 20px'}}>
        <span style={{fontWeight:'bold'}}>ORO JUEZ V3 | {user.rol?.toUpperCase()}</span>
        <button onClick={() => setView('login')} style={{color:'white', background:'none', border:'none', cursor:'pointer'}}><LogOut/></button>
      </div>

      <div style={{display:'flex', gap:'5px', margin:'10px', overflowX:'auto'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{flex:1, padding:'10px'}}>CAPTURA</button>
        <button onClick={() => setView('reportes')} className="card" style={{flex:1, padding:'10px'}}>REPORTES</button>
        {user.rol === 'admin' && (
          <>
            <button onClick={() => setView('sitios')} className="card" style={{flex:1, padding:'10px'}}>SEDES</button>
            <button onClick={() => setView('usuarios')} className="card" style={{flex:1, padding:'10px'}}>USUARIOS</button>
          </>
        )}
      </div>

      <div className="content-box">
        {view === 'usuarios' && (
          <div>
            <form onSubmit={handleGuardarUsuario} className="card" style={{textAlign:'left', padding:'20px'}}>
              <h3 style={{marginTop:0}}>Nuevo Usuario</h3>
              <input value={nuevoUsuario.nombre} onChange={e=>setNuevoUsuario({...nuevoUsuario, nombre:e.target.value})} placeholder="Nombre Completo" required />
              <input value={nuevoUsuario.email} onChange={e=>setNuevoUsuario({...nuevoUsuario, email:e.target.value})} placeholder="Email Corporativo" required />
              
              <label style={{display:'block', marginTop:'10px', color:'red', fontWeight:'bold'}}>1. SELECCIONAR ROL:</label>
              <select value={nuevoUsuario.rol} onChange={e=>setNuevoUsuario({...nuevoUsuario, rol:e.target.value})} required style={{padding:'12px', border:'2px solid red', marginBottom:'15px', width:'100%', borderRadius:'8px'}}>
                <option value="">-- ELIJA UN ROL --</option>
                <option value="admin">Administrador (Control Total)</option>
                <option value="auditor">Auditor (Ver todos los reportes)</option>
                <option value="operativo">Operativo (Solo sus registros)</option>
              </select>

              <label style={{display:'block', fontWeight:'bold'}}>2. ASIGNAR SEDE:</label>
              <select value={nuevoUsuario.sitio_id} onChange={e=>setNuevoUsuario({...nuevoUsuario, sitio_id:e.target.value})} required style={{width:'100%', padding:'10px'}}>
                <option value="">-- SELECCIONAR SEDE --</option>
                {sitios.map(s => <option key={s.id} value={s.id}>{s.ciudad} | {s.nombre}</option>)}
              </select>
              <button type="submit" className="navbar" style={{color:'white', width:'100%', border:'none', marginTop:'20px', padding:'15px', borderRadius:'10px', cursor:'pointer'}}>{loading?'Guardando...':'CREAR USUARIO'}</button>
            </form>
            <div style={{marginTop:'30px'}}>
              {usuarios.map(u => (
                <div key={u.id} className="card" style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', textAlign:'left', padding:'15px'}}>
                  <div><strong>{u.nombre}</strong> <span style={{fontSize:'10px', background:'#eee', padding:'2px 5px'}}>{u.rol}</span><br/><small>{u.email}</small></div>
                  <button onClick={async () => { if(confirm("¿Eliminar usuario?")) { await supabase.from('perfiles_usuarios').delete().eq('id', u.id); cargarDatos(); } }} style={{color:'red', background:'none', border:'none', cursor:'pointer'}}><Trash2 size={20}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'dashboard' && (
           <div className="card" style={{padding:'20px'}}>
              {!photo && !streaming && <button onClick={()=>{setStreaming(true); navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s=>videoRef.current.srcObject=s)}} className="navbar" style={{color:'white', border:'none', padding:'30px', borderRadius:'50%', cursor:'pointer'}}><Camera size={40}/></button>}
              {streaming && <video ref={videoRef} autoPlay playsInline style={{width:'100%', borderRadius:'15px', border:'3px solid #000'}} />}
              {streaming && <button onClick={takePhoto} className="navbar" style={{width:'100%', color:'white', border:'none', marginTop:'15px', padding:'15px', borderRadius:'10px'}}>CAPTURAR PESO</button>}
              {photo && <img src={photo} style={{width:'100%', borderRadius:'15px'}} />}
              {photo && (
                <div style={{marginTop:'15px'}}>
                  <div style={{background:'#fff3cd', padding:'20px', borderRadius:'10px', fontSize:'1.2rem'}}>Lectura OCR: <strong>{pesoOCR || '---'}</strong> kg</div>
                  <input type="number" value={pesoManual} onChange={e=>setPesoManual(e.target.value)} placeholder="Ingrese Peso Manual" style={{marginTop:'15px', fontSize:'1.8rem', textAlign:'center', width:'100%'}} />
                  <button onClick={guardarPesaje} className="navbar" style={{width:'100%', color:'white', border:'none', padding:'15px', marginTop:'15px', fontSize:'1.1rem', borderRadius:'10px'}}>GUARDAR REPORTE</button>
                  <button onClick={()=>{setPhoto(null); setPesoOCR(null);}} style={{width:'100%', marginTop:'10px', background:'none', border:'1px solid #ccc', padding:'10px'}}>VOLVER A EMPEZAR</button>
                </div>
              )}
           </div>
        )}

        {view === 'reportes' && (
          <div style={{overflowX:'auto', padding:'10px'}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'2px solid #eee'}}>
                  <th style={{textAlign:'left', padding:'10px'}}>Sede</th>
                  <th style={{padding:'10px'}}>Peso</th>
                  <th style={{padding:'10px'}}>Foto</th>
                </tr>
              </thead>
              <tbody>
                {reportes.map(r => (
                  <tr key={r.id} style={{borderBottom:'1px solid #f9f9f9'}}>
                    <td style={{textAlign:'left', padding:'10px', fontSize:'12px'}}>{r.nombre_sitio}</td>
                    <td style={{padding:'10px'}}>{r.peso_manual} kg</td>
                    <td style={{padding:'10px'}}><button onClick={()=>window.open(r.foto_url)} style={{background:'none', border:'none', color:'#ffc107'}}><Eye/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'sitios' && (
          <div style={{padding:'10px'}}>
            <form onSubmit={async (e)=>{e.preventDefault(); await supabase.from('sitios').insert([nuevoSitio]); setNuevoSitio({nombre:'', ciudad:''}); cargarDatos();}} className="card" style={{padding:'20px'}}>
              <input value={nuevoSitio.ciudad} onChange={e=>setNuevoSitio({...nuevoSitio, ciudad:e.target.value})} placeholder="Ciudad" required />
              <input value={nuevoSitio.nombre} onChange={e=>setNuevoSitio({...nuevoSitio, nombre:e.target.value})} placeholder="Nombre de la Sede" required />
              <button type="submit" className="navbar" style={{width:'100%', color:'white', border:'none', padding:'12px', borderRadius:'8px'}}>REGISTRAR SEDE</button>
            </form>
            <div style={{marginTop:'20px'}}>
              {sitios.map(s => <div key={s.id} className="card" style={{marginBottom:'8px', padding:'10px'}}>{s.ciudad.toUpperCase()} - {s.nombre}</div>)}
            </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{display:'none'}} width="640" height="480" />
      <div style={{fontSize:'10px', marginTop:'30px', opacity:0.6}}>SISTEMA ORO JUEZ V3 | 2026 - CONTROL DE AUDITORÍA</div>
    </div>
  );
};

export default OroJuezApp;