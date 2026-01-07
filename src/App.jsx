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
  const [nuevoSitio, setNuevoSitio] = useState({ nombre: '', ciudad: '' });
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
    if (s) setSitios(s || []);
    if (u) setUsuarios(u || []);
    if (r) setReportes(r || []);
  };

  // --- LÓGICA DE PROCESAMIENTO OCR PARA NÚMEROS ROJOS ---
  const procesarImagenParaOCR = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Filtro de umbral: Resaltar lo que sea predominantemente ROJO
      if (r > 120 && r > g * 1.4 && r > b * 1.4) {
        data[i] = data[i+1] = data[i+2] = 0; // Negro para el texto
      } else {
        data[i] = data[i+1] = data[i+2] = 255; // Blanco para el fondo
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/jpeg');
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
      const imageProcesada = procesarImagenParaOCR(canvas);
      const { data: { text } } = await Tesseract.recognize(imageProcesada, 'eng', {
        tessedit_char_whitelist: '0123456789'
      });
      const num = text.replace(/\D/g, "");
      setPesoOCR(num || "No detectado");
    } catch (err) { setPesoOCR("Error"); }
    setLoading(false);
  };

  const guardarPesaje = async () => {
    if (!pesoManual) return alert("Ingrese el peso manual");
    setLoading(true);
    const pOCR = isNaN(parseInt(pesoOCR)) ? 0 : parseInt(pesoOCR);
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
      alert("Reporte guardado exitosamente"); 
      setPhoto(null); setPesoManual(''); setPesoOCR(null); 
      cargarDatos();
    }
    setLoading(false);
  };

  // --- GESTIÓN DE USUARIOS (CREACIÓN Y EDICIÓN) ---
  const handleGuardarUsuario = async (e) => {
    e.preventDefault();
    setLoading(true);
    const sitioRel = sitios.find(s => s.id === nuevoUsuario.sitio_id);
    const { error } = await supabase.from('perfiles_usuarios').insert([{
      ...nuevoUsuario,
      nombre_sitio: sitioRel?.nombre || '',
      ciudad: sitioRel?.ciudad || ''
    }]);
    if (error) alert(error.message);
    else { alert("Usuario Creado"); setNuevoUsuario({ email: '', nombre: '', sitio_id: '', rol: '', password: '' }); cargarDatos(); }
    setLoading(false);
  };

  const iniciarEdicion = (u) => { setEditandoId(u.id); setUsuarioEditado({ ...u }); };
  const cancelarEdicion = () => { setEditandoId(null); setUsuarioEditado(null); };

  const guardarCambiosUsuario = async () => {
    setLoading(true);
    const sitioRel = sitios.find(s => s.id === usuarioEditado.sitio_id);
    const { error } = await supabase.from('perfiles_usuarios').update({
        ...usuarioEditado,
        nombre_sitio: sitioRel?.nombre || '',
        ciudad: sitioRel?.ciudad || ''
    }).eq('id', editandoId);
    if (!error) { alert("Actualizado"); cancelarEdicion(); cargarDatos(); }
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

  const cambiarMiClave = async (e) => {
    e.preventDefault();
    if (nuevaClave.length < 4) return alert("Mínimo 4 caracteres");
    setLoading(true);
    const { error } = await supabase.from('perfiles_usuarios').update({ password: nuevaClave }).eq('email', user.email);
    if (!error) { alert("Clave cambiada"); setNuevaClave(''); setView('dashboard'); }
    setLoading(false);
  };

  if (view === 'login') return (
    <div className="container" style={{padding:'40px 20px', maxWidth:'400px', margin:'auto'}}>
      <div className="navbar"><h1>ORO JUEZ V3.5</h1></div>
      <form onSubmit={handleLogin} style={{marginTop:'30px', display:'flex', flexDirection:'column', gap:'15px'}}>
        <input name="email" type="email" placeholder="Email" required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ccc'}} />
        <input name="password" type="password" placeholder="Contraseña" required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ccc'}} />
        <button className="navbar" style={{color:'white', border:'none', padding:'15px', borderRadius:'8px', fontWeight:'bold'}}>INGRESAR</button>
      </form>
    </div>
  );

  return (
    <div className="container">
      <div className="navbar" style={{display:'flex', justifyContent:'space-between', padding:'10px 20px'}}>
        <span>{user.nombre}</span>
        <button onClick={() => setView('login')} style={{color:'white', background:'none', border:'none'}}><LogOut/></button>
      </div>

      <div style={{display:'flex', gap:'5px', margin:'10px', overflowX:'auto'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{flex:1, padding:'10px'}}>CAPTURA</button>
        <button onClick={() => setView('reportes')} className="card" style={{flex:1, padding:'10px'}}>REPORTES</button>
        {user.rol === 'admin' && (
            <button onClick={() => setView('usuarios')} className="card" style={{flex:1, padding:'10px'}}>USUARIOS</button>
        )}
        <button onClick={() => setView('perfil')} className="card" style={{padding:'10px'}}><Key size={18}/></button>
      </div>

      <div className="content-box">
        {view === 'dashboard' && (
           <div className="card" style={{padding:'20px'}}>
              {!photo && !streaming && <button onClick={()=>{setStreaming(true); navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s=>videoRef.current.srcObject=s)}} className="navbar" style={{color:'white', border:'none', padding:'30px', borderRadius:'50%'}}><Camera size={40}/></button>}
              {streaming && <video ref={videoRef} autoPlay playsInline style={{width:'100%', borderRadius:'15px'}} />}
              {streaming && <button onClick={takePhoto} className="navbar" style={{width:'100%', color:'white', padding:'15px', marginTop:'10px', borderRadius:'10px'}}>CAPTURAR VISOR</button>}
              {photo && (
                <div>
                  <img src={photo} style={{width:'100%', borderRadius:'15px'}} />
                  <div style={{background:'#fff3cd', padding:'15px', borderRadius:'10px', margin:'10px 0', fontWeight:'bold'}}>
                    OCR: {loading ? "Procesando..." : pesoOCR} kg
                  </div>
                  <input type="number" value={pesoManual} onChange={e=>setPesoManual(e.target.value)} placeholder="PESO MANUAL" style={{fontSize:'1.8rem', textAlign:'center', width:'100%', border:'2px solid #ffc107'}} />
                  <button onClick={guardarPesaje} className="navbar" style={{width:'100%', color:'white', padding:'18px', marginTop:'15px', borderRadius:'10px'}}>GUARDAR REPORTE</button>
                  <button onClick={()=>{setPhoto(null); setPesoOCR(null);}} style={{width:'100%', marginTop:'10px', background:'none', border:'1px solid #ccc', padding:'10px'}}>REPETIR</button>
                </div>
              )}
           </div>
        )}

        {view === 'reportes' && (
          <div style={{padding:'10px'}}>
            {reportes.filter(r => user.rol === 'admin' || user.rol === 'auditor' || r.usuario_email === user.email).map(r => (
               <div key={r.id} className="card" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', padding:'15px', textAlign:'left', borderLeft: Math.abs(r.diferencia) > 20 ? '5px solid red' : '5px solid green'}}>
                  <div>
                    <div style={{fontSize:'12px', fontWeight:'bold'}}>{r.nombre_sitio}</div>
                    <div>Manual: {r.peso_manual} kg | OCR: {r.peso_ocr}</div>
                    <small style={{opacity:0.6}}>Por: {r.nombre_usuario}</small>
                  </div>
                  <button onClick={()=>window.open(r.foto_url)} style={{background:'none', border:'none', color:'#ffc107'}}><Eye/></button>
               </div>
            ))}
          </div>
        )}

        {view === 'perfil' && (
          <div className="card" style={{padding:'20px'}}>
            <h3>Cambiar mi Clave</h3>
            <input type="text" value={nuevaClave} onChange={e=>setNuevaClave(e.target.value)} placeholder="Nueva Clave" style={{padding:'12px', width:'100%', marginBottom:'15px'}} />
            <button onClick={cambiarMiClave} className="navbar" style={{width:'100%', color:'white', border:'none', padding:'15px', borderRadius:'10px'}}>ACTUALIZAR</button>
          </div>
        )}

        {view === 'usuarios' && (
          <div style={{padding:'10px'}}>
            <form onSubmit={handleGuardarUsuario} className="card" style={{padding:'15px', marginBottom:'20px', textAlign:'left'}}>
              <h3>Nuevo Usuario</h3>
              <input value={nuevoUsuario.nombre} onChange={e=>setNuevoUsuario({...nuevoUsuario, nombre:e.target.value})} placeholder="Nombre" required />
              <input value={nuevoUsuario.email} onChange={e=>setNuevoUsuario({...nuevoUsuario, email:e.target.value})} placeholder="Email" required />
              <input value={nuevoUsuario.password} onChange={e=>setNuevoUsuario({...nuevoUsuario, password:e.target.value})} placeholder="Clave" required />
              <select value={nuevoUsuario.rol} onChange={e=>setNuevoUsuario({...nuevoUsuario, rol:e.target.value})} required style={{width:'100%', padding:'10px', margin:'10px 0'}}>
                <option value="">-- Rol --</option>
                <option value="admin">Administrador</option>
                <option value="auditor">Auditor</option>
                <option value="operativo">Operativo</option>
              </select>
              <select value={nuevoUsuario.sitio_id} onChange={e=>setNuevoUsuario({...nuevoUsuario, sitio_id:e.target.value})} required style={{width:'100%', padding:'10px'}}>
                <option value="">-- Sede --</option>
                {sitios.map(s => <option key={s.id} value={s.id}>{s.ciudad} - {s.nombre}</option>)}
              </select>
              <button type="submit" className="navbar" style={{color:'white', width:'100%', padding:'12px', marginTop:'10px', borderRadius:'8px'}}>CREAR</button>
            </form>

            {usuarios.map(u => (
              <div key={u.id} className="card" style={{padding:'15px', marginBottom:'10px', textAlign:'left'}}>
                {editandoId === u.id ? (
                  <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                    <input value={usuarioEditado.nombre} onChange={e=>setUsuarioEditado({...usuarioEditado, nombre:e.target.value})} />
                    <input value={usuarioEditado.password} onChange={e=>setUsuarioEditado({...usuarioEditado, password:e.target.value})} />
                    <select value={usuarioEditado.rol} onChange={e=>setUsuarioEditado({...usuarioEditado, rol:e.target.value})}>
                        <option value="admin">Admin</option><option value="auditor">Auditor</option><option value="operativo">Operativo</option>
                    </select>
                    <button onClick={guardarCambiosUsuario} style={{background:'green', color:'white', padding:'10px', border:'none', borderRadius:'5px'}}>GUARDAR</button>
                    <button onClick={cancelarEdicion} style={{background:'gray', color:'white', padding:'5px', border:'none', borderRadius:'5px'}}>CANCELAR</button>
                  </div>
                ) : (
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div><strong>{u.nombre}</strong><br/><small>{u.email} | Clave: {u.password}</small></div>
                    <div style={{display:'flex', gap:'10px'}}>
                      <button onClick={() => iniciarEdicion(u)} style={{background:'none', border:'none', color:'#007bff'}}><Edit2 size={18}/></button>
                      <button onClick={async () => { if(confirm("¿Eliminar?")) { await supabase.from('perfiles_usuarios').delete().eq('id', u.id); cargarDatos(); } }} style={{background:'none', border:'none', color:'red'}}><Trash2 size={18}/></button>
                    </div>
                  </div>
                )}
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