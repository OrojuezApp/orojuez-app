import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Tesseract from 'tesseract.js';
import './style.css'; 
import { Camera, LogOut, Eye, Trash2, Lock, Mail, User, Key, Edit2, X, Check } from 'lucide-react';

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
      alert("Usuario creado exitosamente");
      setNuevoUsuario({ email: '', nombre: '', sitio_id: '', rol: '', password: '' });
      await cargarDatos();
    }
    setLoading(false);
  };

  const iniciarEdicion = (u) => {
    setEditandoId(u.id);
    setUsuarioEditado({ ...u });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setUsuarioEditado(null);
  };

  const guardarCambiosUsuario = async () => {
    setLoading(true);
    const sitioRel = sitios.find(s => s.id === usuarioEditado.sitio_id);
    const { error } = await supabase.from('perfiles_usuarios')
      .update({
        ...usuarioEditado,
        nombre_sitio: sitioRel?.nombre || '',
        ciudad: sitioRel?.ciudad || ''
      })
      .eq('id', editandoId);
    
    if (error) alert("Error al actualizar: " + error.message);
    else {
      alert("Usuario actualizado correctamente");
      cancelarEdicion();
      await cargarDatos();
    }
    setLoading(false);
  };

  const cambiarMiClave = async (e) => {
    e.preventDefault();
    if (nuevaClave.length < 4) return alert("Mínimo 4 caracteres.");
    setLoading(true);
    const { error } = await supabase.from('perfiles_usuarios').update({ password: nuevaClave }).eq('email', user.email);
    if (error) alert("Error: " + error.message);
    else { alert("Clave cambiada"); setNuevaClave(''); setView('dashboard'); }
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
      if (data) { setUser(data); setView('dashboard'); } else alert("Acceso denegado.");
    }
  };

  const takePhoto = async () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    const imageData = canvasRef.current.toDataURL('image/jpeg');
    setPhoto(imageData); setStreaming(false);
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
      sitio_id: user.sitio_id, nombre_sitio: user.nombre_sitio || 'Sede Central', ciudad: user.ciudad || 'N/A',
      usuario_email: user.email, nombre_usuario: user.nombre, peso_ocr: pesoOCR || 0, 
      peso_manual: parseFloat(pesoManual), diferencia: parseFloat(pesoManual) - (pesoOCR || 0), foto_url: photo
    }]);
    if (!error) { alert("Reporte guardado."); setPhoto(null); setPesoManual(''); setPesoOCR(null); await cargarDatos(); }
    setLoading(false);
  };

  if (view === 'login') return (
    <div className="container" style={{padding:'40px 20px', maxWidth:'400px', margin:'auto'}}>
      <div className="navbar" style={{borderRadius:'10px'}}><h1>ORO JUEZ V3</h1></div>
      <form onSubmit={handleLogin} style={{marginTop:'30px', display:'flex', flexDirection:'column', gap:'15px'}}>
        <input name="email" type="email" placeholder="Correo" required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ccc'}} />
        <input name="password" type="password" placeholder="Contraseña" required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ccc'}} />
        <button className="navbar" style={{width:'100%', color:'white', border:'none', padding:'15px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>INICIAR SESIÓN</button>
      </form>
    </div>
  );

  return (
    <div className="container">
      <div className="navbar" style={{display:'flex', justifyContent:'space-between', padding:'10px 20px'}}>
        <span style={{fontWeight:'bold'}}>V3 | {user.nombre}</span>
        <button onClick={() => setView('login')} style={{color:'white', background:'none', border:'none', cursor:'pointer'}}><LogOut/></button>
      </div>

      <div style={{display:'flex', gap:'5px', margin:'10px', overflowX:'auto'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{flex:1, padding:'10px', border:view==='dashboard'?'2px solid #ffc107':'none'}}>CAPTURA</button>
        <button onClick={() => setView('reportes')} className="card" style={{flex:1, padding:'10px', border:view==='reportes'?'2px solid #ffc107':'none'}}>REPORTES</button>
        {user.rol === 'admin' && (
          <>
            <button onClick={() => setView('sitios')} className="card" style={{flex:1, padding:'10px', border:view==='sitios'?'2px solid #ffc107':'none'}}>SEDES</button>
            <button onClick={() => setView('usuarios')} className="card" style={{flex:1, padding:'10px', border:view==='usuarios'?'2px solid #ffc107':'none'}}>USUARIOS</button>
          </>
        )}
        <button onClick={() => setView('perfil')} className="card" style={{flex:1, padding:'10px', border:view==='perfil'?'2px solid #ffc107':'none'}}><Key size={16}/></button>
      </div>

      <div className="content-box">
        {view === 'perfil' && (
          <div className="card" style={{padding:'20px'}}>
            <h3>Cambiar Clave</h3>
            <form onSubmit={cambiarMiClave}>
              <input type="text" value={nuevaClave} onChange={e=>setNuevaClave(e.target.value)} placeholder="Nueva Clave" required style={{padding:'12px', width:'100%', marginBottom:'15px'}} />
              <button type="submit" className="navbar" style={{color:'white', width:'100%', border:'none', padding:'15px', borderRadius:'10px'}}>ACTUALIZAR MI CLAVE</button>
            </form>
          </div>
        )}

        {view === 'usuarios' && (
          <div style={{padding:'10px'}}>
            <form onSubmit={handleGuardarUsuario} className="card" style={{padding:'15px', marginBottom:'20px', textAlign:'left'}}>
              <h3>Nuevo Usuario</h3>
              <input value={nuevoUsuario.nombre} onChange={e=>setNuevoUsuario({...nuevoUsuario, nombre:e.target.value})} placeholder="Nombre" required />
              <input value={nuevoUsuario.email} onChange={e=>setNuevoUsuario({...nuevoUsuario, email:e.target.value})} placeholder="Email" required />
              <input value={nuevoUsuario.password} onChange={e=>setNuevoUsuario({...nuevoUsuario, password:e.target.value})} placeholder="Clave Inicial" required />
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
              <button type="submit" className="navbar" style={{color:'white', width:'100%', border:'none', marginTop:'15px', padding:'12px', borderRadius:'8px'}}>CREAR</button>
            </form>

            {usuarios.map(u => (
              <div key={u.id} className="card" style={{padding:'15px', marginBottom:'10px', textAlign:'left'}}>
                {editandoId === u.id ? (
                  <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                    <input value={usuarioEditado.nombre} onChange={e=>setUsuarioEditado({...usuarioEditado, nombre:e.target.value})} />
                    <input value={usuarioEditado.email} onChange={e=>setUsuarioEditado({...usuarioEditado, email:e.target.value})} />
                    <input value={usuarioEditado.password} onChange={e=>setUsuarioEditado({...usuarioEditado, password:e.target.value})} placeholder="Clave" />
                    <select value={usuarioEditado.rol} onChange={e=>setUsuarioEditado({...usuarioEditado, rol:e.target.value})} style={{padding:'8px'}}>
                        <option value="admin">Administrador</option>
                        <option value="auditor">Auditor</option>
                        <option value="operativo">Operativo</option>
                    </select>
                    <div style={{display:'flex', gap:'5px', marginTop:'10px'}}>
                        <button onClick={guardarCambiosUsuario} style={{flex:1, padding:'10px', background:'#28a745', color:'white', border:'none', borderRadius:'5px'}}><Check size={18}/></button>
                        <button onClick={cancelarEdicion} style={{flex:1, padding:'10px', background:'#6c757d', color:'white', border:'none', borderRadius:'5px'}}><X size={18}/></button>
                    </div>
                  </div>
                ) : (
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                      <strong>{u.nombre}</strong> <small style={{background:'#eee', padding:'2px 4px'}}>{u.rol}</small><br/>
                      <small style={{opacity:0.7}}>{u.email} | Clave: {u.password}</small><br/>
                      <small style={{fontSize:'10px', color:'#ffc107'}}>{u.ciudad} - {u.nombre_sitio}</small>
                    </div>
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

        {view === 'dashboard' && (
           <div className="card" style={{padding:'20px'}}>
              {!photo && !streaming && <button onClick={()=>{setStreaming(true); navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s=>videoRef.current.srcObject=s)}} className="navbar" style={{color:'white', border:'none', padding:'30px', borderRadius:'50%'}}><Camera size={40}/></button>}
              {streaming && <video ref={videoRef} autoPlay playsInline style={{width:'100%', borderRadius:'15px', border:'2px solid #000'}} />}
              {streaming && <button onClick={takePhoto} className="navbar" style={{width:'100%', color:'white', border:'none', marginTop:'15px', padding:'15px', borderRadius:'10px'}}>CAPTURAR</button>}
              {photo && <img src={photo} style={{width:'100%', borderRadius:'15px'}} />}
              {photo && (
                <div style={{marginTop:'15px'}}>
                  <div style={{background:'#fff3cd', padding:'15px', borderRadius:'10px'}}>OCR: <strong>{pesoOCR || '---'}</strong> kg</div>
                  <input type="number" value={pesoManual} onChange={e=>setPesoManual(e.target.value)} placeholder="Peso Manual" style={{marginTop:'15px', fontSize:'1.5rem', textAlign:'center', width:'100%'}} />
                  <button onClick={guardarPesaje} className="navbar" style={{width:'100%', color:'white', border:'none', padding:'15px', marginTop:'15px', borderRadius:'10px'}}>GUARDAR REPORTE</button>
                  <button onClick={()=>{setPhoto(null); setPesoOCR(null);}} style={{width:'100%', marginTop:'10px', background:'none', border:'1px solid #ccc', padding:'10px', borderRadius:'10px'}}>REPETIR</button>
                </div>
              )}
           </div>
        )}

        {view === 'reportes' && (
          <div style={{padding:'10px'}}>
            {reportes.filter(r => user.rol === 'admin' || user.rol === 'auditor' || r.usuario_email === user.email).map(r => (
               <div key={r.id} className="card" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', padding:'10px', textAlign:'left'}}>
                  <div>
                    <div style={{fontSize:'12px', fontWeight:'bold'}}>{r.nombre_sitio} ({r.ciudad})</div>
                    <div style={{fontSize:'14px'}}>{r.peso_manual} kg - {r.nombre_usuario}</div>
                  </div>
                  <button onClick={()=>window.open(r.foto_url)} style={{background:'none', border:'none', color:'#ffc107'}}><Eye/></button>
               </div>
            ))}
          </div>
        )}

        {view === 'sitios' && (
          <div style={{padding:'10px'}}>
            <form onSubmit={async (e)=>{e.preventDefault(); await supabase.from('sitios').insert([nuevoSitio]); setNuevoSitio({nombre:'', ciudad:''}); await cargarDatos();}} className="card" style={{padding:'20px'}}>
              <input value={nuevoSitio.ciudad} onChange={e=>setNuevoSitio({...nuevoSitio, ciudad:e.target.value})} placeholder="Ciudad" required />
              <input value={nuevoSitio.nombre} onChange={e=>setNuevoSitio({...nuevoSitio, nombre:e.target.value})} placeholder="Nombre Sede" required />
              <button type="submit" className="navbar" style={{width:'100%', color:'white', border:'none', padding:'12px', borderRadius:'8px'}}>GUARDAR SEDE</button>
            </form>
            <div style={{marginTop:'20px'}}>
              {sitios.map(s => <div key={s.id} className="card" style={{marginBottom:'8px', padding:'10px'}}>{s.ciudad.toUpperCase()} - {s.nombre}</div>)}
            </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{display:'none'}} width="640" height="480" />
      <div style={{fontSize:'10px', marginTop:'30px', opacity:0.6}}>ORO JUEZ V3 | GESTIÓN INTEGRAL DE USUARIOS</div>
    </div>
  );
};

export default OroJuezApp;