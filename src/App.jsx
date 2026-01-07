import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './style.css'; 
import { Camera, LogOut, Eye, Trash2, Edit2, Users, MapPin, Calendar, Clock, Plus, ShieldCheck } from 'lucide-react';

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
  
  // Estados de Operación
  const [photo, setPhoto] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [pesoManual, setPesoManual] = useState('');
  
  // Estados de Administración
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', nombre: '', sitio_id: '', rol: '', password: '' });
  const [nuevoSitio, setNuevoSitio] = useState({ nombre: '', ciudad: '' });
  const [editandoId, setEditandoId] = useState(null);
  const [usuarioEditado, setUsuarioEditado] = useState(null);

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

  // --- LÓGICA DE CAPTURA ---
  const takePhoto = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    setPhoto(canvas.toDataURL('image/jpeg'));
    setStreaming(false);
    if (videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
  };

  const guardarControl = async () => {
    if (!photo || !pesoManual) return alert("Por favor, tome la foto e ingrese el peso.");
    setLoading(true);
    
    // Se envían solo las columnas base confirmadas para evitar errores de esquema
    const datos = {
      sitio_id: user.sitio_id,
      nombre_sitio: user.nombre_sitio || 'Sede Principal',
      ciudad: user.ciudad || 'N/A',
      usuario_email: user.email,
      nombre_usuario: user.nombre,
      peso_manual: parseFloat(pesoManual),
      foto_url: photo
    };

    const { error } = await supabase.from('reportes_pesaje').insert([datos]);

    if (!error) {
      alert("¡Pesaje guardado correctamente!");
      setPhoto(null); setPesoManual('');
      await cargarDatos();
      setView('reportes');
    } else {
      alert("Error de base de datos: " + error.message);
    }
    setLoading(false);
  };

  // --- AUTENTICACIÓN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim().toLowerCase();
    const password = e.target.password.value.trim();
    if (email === 'industria.orojuez@gmail.com' && password === 'admin123') {
      setUser({ email, nombre: 'Super Admin', rol: 'admin' }); setView('dashboard');
    } else {
      const { data } = await supabase.from('perfiles_usuarios').select('*').eq('email', email).eq('password', password).single();
      if (data) { setUser(data); setView('dashboard'); } else alert("Credenciales inválidas.");
    }
  };

  // --- CRUD ADMINISTRACIÓN ---
  const crearUsuario = async (e) => {
    e.preventDefault();
    const s = sitios.find(x => x.id === nuevoUsuario.sitio_id);
    await supabase.from('perfiles_usuarios').insert([{ 
        ...nuevoUsuario, 
        nombre_sitio: s?.nombre || '', 
        ciudad: s?.ciudad || '' 
    }]);
    setNuevoUsuario({ email: '', nombre: '', sitio_id: '', rol: '', password: '' });
    cargarDatos();
  };

  const crearSitio = async (e) => {
    e.preventDefault();
    await supabase.from('sitios').insert([nuevoSitio]);
    setNuevoSitio({ nombre: '', ciudad: '' });
    cargarDatos();
  };

  if (view === 'login') return (
    <div className="container" style={{padding:'40px 20px', maxWidth:'400px', margin:'auto'}}>
      <div className="navbar"><h1>ORO JUEZ V4.4</h1></div>
      <form onSubmit={handleLogin} style={{marginTop:'30px', display:'flex', flexDirection:'column', gap:'15px'}}>
        <input name="email" type="email" placeholder="Usuario / Email" required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ccc'}} />
        <input name="password" type="password" placeholder="Contraseña" required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ccc'}} />
        <button className="navbar" style={{color:'white', border:'none', padding:'15px', borderRadius:'8px', fontWeight:'bold'}}>INICIAR SESIÓN</button>
      </form>
    </div>
  );

  return (
    <div className="container">
      <div className="navbar" style={{display:'flex', justifyContent:'space-between', padding:'10px 20px'}}>
        <span style={{fontWeight:'bold'}}>{user.nombre}</span>
        <button onClick={() => setView('login')} style={{color:'white', background:'none', border:'none'}}><LogOut/></button>
      </div>

      {/* BARRA DE NAVEGACIÓN COMPLETA */}
      <div style={{display:'flex', gap:'5px', margin:'10px', overflowX:'auto'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{padding:'10px', flex:1, border:view==='dashboard'?'2px solid #ffc107':'none'}}>CAPTURAR</button>
        <button onClick={() => setView('reportes')} className="card" style={{padding:'10px', flex:1, border:view==='reportes'?'2px solid #ffc107':'none'}}>HISTORIAL</button>
        {user.rol === 'admin' && (
          <>
            <button onClick={() => setView('usuarios')} className="card" style={{padding:'10px', border:view==='usuarios'?'2px solid #ffc107':'none'}}><Users size={18}/></button>
            <button onClick={() => setView('sitios')} className="card" style={{padding:'10px', border:view==='sitios'?'2px solid #ffc107':'none'}}><MapPin size={18}/></button>
          </>
        )}
      </div>

      <div className="content-box">
        {view === 'dashboard' && (
          <div className="card" style={{padding:'20px'}}>
            <h3 style={{marginBottom:'15px'}}>Nuevo Registro de Peso</h3>
            {!photo && !streaming && (
              <button onClick={()=>{setStreaming(true); navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s=>videoRef.current.srcObject=s)}} className="navbar" style={{color:'white', padding:'40px', borderRadius:'50%', marginBottom:'20px'}}><Camera size={45}/></button>
            )}
            {streaming && (
              <div>
                <video ref={videoRef} autoPlay playsInline style={{width:'100%', borderRadius:'15px', border:'2px solid #000'}} />
                <button onClick={takePhoto} className="navbar" style={{width:'100%', color:'white', padding:'15px', marginTop:'10px', borderRadius:'10px', fontWeight:'bold'}}>TOMAR FOTO DEL VISOR</button>
              </div>
            )}
            {photo && (
              <div>
                <img src={photo} style={{width:'100%', borderRadius:'15px', border:'2px solid #28a745'}} />
                <input type="number" value={pesoManual} onChange={e=>setPesoManual(e.target.value)} placeholder="0.00 kg" style={{fontSize:'2.5rem', textAlign:'center', width:'100%', margin:'15px 0', border:'2px solid #ffc107', borderRadius:'10px'}} />
                <button onClick={guardarControl} disabled={loading} className="navbar" style={{width:'100%', color:'white', padding:'20px', borderRadius:'10px', fontSize:'1.2rem', fontWeight:'bold'}}>
                  {loading ? 'PROCESANDO...' : 'GUARDAR EVIDENCIA'}
                </button>
                <button onClick={()=>setPhoto(null)} style={{width:'100%', marginTop:'10px', background:'none', border:'none', textDecoration:'underline', color:'#666'}}>Repetir Fotografía</button>
              </div>
            )}
          </div>
        )}

        {view === 'reportes' && (
          <div style={{padding:'10px'}}>
            {reportes.map(r => (
              <div key={r.id} className="card" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', padding:'15px', textAlign:'left'}}>
                <div>
                  <div style={{fontWeight:'bold'}}>{r.nombre_sitio}</div>
                  <div style={{fontSize:'1.3rem', color:'#ffc107', fontWeight:'bold'}}>{r.peso_manual} kg</div>
                  <small style={{display:'block', opacity:0.7}}>{new Date(r.created_at).toLocaleString()}</small>
                  <small style={{fontSize:'10px'}}>Por: {r.nombre_usuario}</small>
                </div>
                <button onClick={()=>window.open(r.foto_url)} className="navbar" style={{color:'white', border:'none', borderRadius:'8px', width:'45px', height:'45px', display:'flex', alignItems:'center', justifyContent:'center'}}><Eye size={20}/></button>
              </div>
            ))}
          </div>
        )}

        {view === 'usuarios' && (
          <div style={{padding:'10px'}}>
            <form onSubmit={crearUsuario} className="card" style={{padding:'15px', marginBottom:'20px', textAlign:'left'}}>
              <h4 style={{marginBottom:'10px'}}>Añadir Operador</h4>
              <input value={nuevoUsuario.nombre} onChange={e=>setNuevoUsuario({...nuevoUsuario, nombre:e.target.value})} placeholder="Nombre Completo" required />
              <input value={nuevoUsuario.email} onChange={e=>setNuevoUsuario({...nuevoUsuario, email:e.target.value})} placeholder="Correo" required />
              <input value={nuevoUsuario.password} onChange={e=>setNuevoUsuario({...nuevoUsuario, password:e.target.value})} placeholder="Contraseña" required />
              <select value={nuevoUsuario.sitio_id} onChange={e=>setNuevoUsuario({...nuevoUsuario, sitio_id:e.target.value})} required style={{width:'100%', padding:'10px', margin:'10px 0'}}>
                <option value="">-- Seleccionar Sede --</option>
                {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre} ({s.ciudad})</option>)}
              </select>
              <button type="submit" className="navbar" style={{color:'white', width:'100%', padding:'12px', borderRadius:'8px'}}>REGISTRAR USUARIO</button>
            </form>
            {usuarios.map(u => (
              <div key={u.id} className="card" style={{padding:'12px', marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div><strong>{u.nombre}</strong><br/><small>{u.email} | {u.rol}</small></div>
                <button onClick={async()=>{if(confirm("¿Eliminar usuario?")){await supabase.from('perfiles_usuarios').delete().eq('id', u.id); cargarDatos();}}} style={{color:'red', background:'none', border:'none'}}><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        )}

        {view === 'sitios' && (
          <div style={{padding:'10px'}}>
            <form onSubmit={crearSitio} className="card" style={{padding:'15px', marginBottom:'20px', textAlign:'left'}}>
              <h4 style={{marginBottom:'10px'}}>Nueva Sede / Báscula</h4>
              <input value={nuevoSitio.nombre} onChange={e=>setNuevoSitio({...nuevoSitio, nombre:e.target.value})} placeholder="Nombre de la Sede" required />
              <input value={nuevoSitio.ciudad} onChange={e=>setNuevoSitio({...nuevoSitio, ciudad:e.target.value})} placeholder="Ciudad" required />
              <button type="submit" className="navbar" style={{color:'white', width:'100%', padding:'12px', borderRadius:'8px'}}>AGREGAR LUGAR</button>
            </form>
            {sitios.map(s => (
              <div key={s.id} className="card" style={{padding:'12px', marginBottom:'5px', textAlign:'left'}}>
                <MapPin size={14} style={{display:'inline', marginRight:'5px'}}/> {s.nombre} - {s.ciudad}
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