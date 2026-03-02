import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './style.css'; 
import { Camera, LogOut, RefreshCw, Search, Image as ImageIcon, Trash2, Edit, FileText, Download, Users, MapPin, ShieldCheck } from 'lucide-react';

const SUPABASE_URL = 'https://khgqeqrnlbhadoarcgul.supabase.co';
const SUPABASE_KEY = 'sb_publishable_S5Gk22ej_r8hIZw92b16gw_MBOImAJV';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const OroJuezApp = () => {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [sitios, setSitios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [reportesFiltrados, setReportesFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [reporteConsolidado, setReporteConsolidado] = useState([]);
  const [consolidadoFiltrado, setConsolidadoFiltrado] = useState([]);
  
  const corporativoRed = "#b30000";

  const [filtroSede, setFiltroSede] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // Estado inicial para nuevos usuarios con campos de vinculación
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', nombre: '', sitio_id: '', rol: 'OPERATIVO', password: '' });
  const [nuevoSitio, setNuevoSitio] = useState({ nombre: '', ciudad: '' });

  const [photo, setPhoto] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [pesoManual, setPesoManual] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => { if(user) cargarDatos(); }, [user]);

  const cargarDatos = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Cargar todas las sedes primero
      let { data: s, error: errS } = await supabase.from('sitios').select('*').order('nombre');
      if (errS) throw errS;

      // REQUERIMIENTO: Si es operador, filtrar para que solo vea SU SEDE
      let sedesPermitidas = s || [];
      const userRol = user.rol?.toUpperCase();
      
      if (userRol !== 'ADMIN' && userRol !== 'ADMINISTRADOR' && user.sitio_id) {
        sedesPermitidas = sedesPermitidas.filter(sitio => String(sitio.id) === String(user.sitio_id));
      }
      setSitios(sedesPermitidas);

      // 2. Cargar Usuarios (Solo Administradores)
      if (['ADMIN', 'ADMINISTRADOR'].includes(userRol) || user.email === 'industria.orojuez@gmail.com') {
        const { data: u, error: errU } = await supabase.from('perfiles_usuarios').select('*').order('nombre');
        if (errU) throw errU;
        setUsuarios(u || []);
      }

      // 3. Cargar Reportes (Filtrados por usuario si es operativo)
      let query = supabase.from('reportes_pesaje').select('*').order('created_at', { ascending: false }).limit(100);
      if (userRol === 'OPERATIVO') {
        query = query.eq('usuario_email', user.email);
      }
      const { data: r } = await query;
      setReportes(r || []);
      setReportesFiltrados(r || []);

    } catch (err) { 
      console.error("Error en carga:", err.message);
      if (err.message.includes('402')) alert("Atención: El servidor reporta límite de cuota excedido (Error 402).");
    } finally { 
      setLoading(false); 
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim().toLowerCase();
    const password = e.target.password.value.trim();
    
    // Login Super Admin Hardcoded
    if (email === 'industria.orojuez@gmail.com' && password === 'admin123') {
      setUser({ email, nombre: 'Super Admin', rol: 'ADMIN' }); 
      setView('dashboard');
    } else {
      const { data, error } = await supabase
        .from('perfiles_usuarios')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();
      
      if (data) { 
        setUser(data); 
        setView('dashboard'); 
      } else { 
        alert("Credenciales incorrectas o problema de conexión."); 
      }
    }
  };

  const gestionarUsuario = async (e) => {
    e.preventDefault();
    if (!nuevoUsuario.sitio_id) return alert("Debes vincular una sede al usuario.");
    
    const sede = sitios.find(s => String(s.id) === String(nuevoUsuario.sitio_id));
    const payload = { 
        ...nuevoUsuario,
        sitio_id: parseInt(nuevoUsuario.sitio_id),
        nombre_sitio: sede?.nombre || '',
        ciudad: sede?.ciudad || ''
    };

    const { error } = editMode 
      ? await supabase.from('perfiles_usuarios').update(payload).eq('email', nuevoUsuario.email)
      : await supabase.from('perfiles_usuarios').insert([payload]);

    if (!error) {
      alert("Usuario guardado con éxito");
      setEditMode(false);
      setNuevoUsuario({ email: '', nombre: '', sitio_id: '', rol: 'OPERATIVO', password: '' });
      cargarDatos();
    } else alert("Error: " + error.message);
  };

  const guardarControl = async () => {
    if (!photo || !pesoManual) return alert("Captura la foto e ingresa el peso.");
    setLoading(true);
    try {
      const { error } = await supabase.from('reportes_pesaje').insert([{
        sitio_id: user.sitio_id, 
        nombre_sitio: user.nombre_sitio || 'Sin Sede',
        usuario_email: user.email,
        nombre_usuario: user.nombre,
        peso_manual: parseFloat(pesoManual),
        foto_url: photo,
        observaciones: observaciones || ''
      }]);
      if (error) throw error;
      alert("¡Registro guardado!");
      setPhoto(null); setPesoManual(''); setObservaciones('');
      cargarDatos();
      setView('historial');
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  // --- INTERFAZ ---
  if (view === 'login') return (
    <div className="container" style={{padding:'20px', maxWidth:'400px', margin:'auto', textAlign:'center', display:'flex', flexDirection:'column', minHeight:'100vh', justifyContent:'center'}}>
      <img src="https://khgqeqrnlbhadoarcgul.supabase.co/storage/v1/object/public/logos/Logotipo_Orojuez_1.png" alt="Logo" style={{width:'200px', margin:'0 auto 20px'}} />
      <h2 style={{color: corporativoRed}}>ACCESO AL SISTEMA</h2>
      <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:'12px', background:'white', padding:'20px', borderRadius:'10px', boxShadow:'0 2px 10px rgba(0,0,0,0.1)'}}>
        <input name="email" type="email" placeholder="Correo" required style={{padding:'10px'}} />
        <input name="password" type="password" placeholder="Contraseña" required style={{padding:'10px'}} />
        <button style={{backgroundColor: corporativoRed, color:'white', padding:'12px', border:'none', borderRadius:'5px', fontWeight:'bold'}}>ENTRAR</button>
      </form>
    </div>
  );

  return (
    <div className="container">
      <div className="navbar" style={{backgroundColor: corporativoRed, display:'flex', justifyContent:'space-between', padding:'10px', color:'white'}}>
        <span style={{fontSize:'12px'}}>{user?.nombre} | {user?.rol}</span>
        <div style={{display:'flex', gap:'10px'}}>
            <button onClick={cargarDatos} style={{background:'none', border:'none', color:'white'}}><RefreshCw size={18}/></button>
            <button onClick={() => setView('login')} style={{background:'none', border:'none', color:'white'}}><LogOut size={18}/></button>
        </div>
      </div>

      <div className="menu-nav" style={{display:'flex', gap:'5px', padding:'10px', overflowX:'auto'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{padding:'8px', fontSize:'11px'}}>CAPTURA</button>
        <button onClick={() => setView('historial')} className="card" style={{padding:'8px', fontSize:'11px'}}>HISTORIAL</button>
        {['ADMIN', 'ADMINISTRADOR'].includes(user?.rol?.toUpperCase()) && (
          <>
            <button onClick={() => setView('usuarios')} className="card" style={{padding:'8px', fontSize:'11px'}}>USUARIOS</button>
            <button onClick={() => setView('sedes')} className="card" style={{padding:'8px', fontSize:'11px'}}>SEDES</button>
          </>
        )}
      </div>

      <div className="content">
        {view === 'dashboard' && (
          <div className="card" style={{padding:'20px'}}>
             {/* Lógica de cámara idéntica a tu original */}
             {!photo && !streaming && <button onClick={()=>setStreaming(true)} className="btn-camera" style={{backgroundColor: corporativoRed, color:'white', padding:'20px', borderRadius:'50%', border:'none'}}><Camera/></button>}
             {streaming && (
                 <div>
                    <video ref={videoRef} autoPlay playsInline style={{width:'100%', borderRadius:'8px'}} />
                    <button onClick={() => {
                        const canvas = canvasRef.current;
                        canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 640, 480);
                        setPhoto(canvas.toDataURL('image/jpeg'));
                        setStreaming(false);
                    }} style={{width:'100%', marginTop:'10px', padding:'10px', backgroundColor: corporativoRed, color:'white', border:'none'}}>FOTO</button>
                 </div>
             )}
             {photo && (
                 <div>
                    <img src={photo} style={{width:'100%'}} />
                    <input type="number" value={pesoManual} onChange={e=>setPesoManual(e.target.value)} placeholder="0.00 kg" style={{fontSize:'2rem', width:'100%', textAlign:'center', margin:'10px 0'}} />
                    <button onClick={guardarControl} style={{width:'100%', padding:'15px', backgroundColor: corporativoRed, color:'white', border:'none', fontWeight:'bold'}}>GUARDAR</button>
                    <button onClick={()=>setPhoto(null)} style={{width:'100%', marginTop:'10px', background:'none', border:'none'}}>Borrar foto</button>
                 </div>
             )}
          </div>
        )}

        {view === 'usuarios' && (
          <div style={{padding:'10px'}}>
            <form onSubmit={gestionarUsuario} className="card" style={{padding:'15px', marginBottom:'15px'}}>
              <h4>Vincular Nuevo Usuario</h4>
              <input value={nuevoUsuario.nombre} onChange={e=>setNuevoUsuario({...nuevoUsuario, nombre:e.target.value})} placeholder="Nombre" required style={{width:'100%', marginBottom:'10px', padding:'8px'}} />
              <input value={nuevoUsuario.email} onChange={e=>setNuevoUsuario({...nuevoUsuario, email:e.target.value})} placeholder="Email" required style={{width:'100%', marginBottom:'10px', padding:'8px'}} />
              <input value={nuevoUsuario.password} onChange={e=>setNuevoUsuario({...nuevoUsuario, password:e.target.value})} placeholder="Password" required style={{width:'100%', marginBottom:'10px', padding:'8px'}} />
              <select value={nuevoUsuario.sitio_id} onChange={e=>setNuevoUsuario({...nuevoUsuario, sitio_id:e.target.value})} required style={{width:'100%', marginBottom:'10px', padding:'8px'}}>
                <option value="">-- SELECCIONAR SEDE --</option>
                {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <button style={{backgroundColor: corporativoRed, color:'white', width:'100%', padding:'10px', border:'none'}}>GUARDAR USUARIO</button>
            </form>
            <div className="card">
              {usuarios.map(u => (
                <div key={u.email} style={{padding:'10px', borderBottom:'1px solid #eee', fontSize:'12px'}}>
                  {u.nombre} - <span style={{color: corporativoRed}}>{u.nombre_sitio}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Vista Sedes */}
        {view === 'sedes' && (
          <div style={{padding:'10px'}}>
             <form onSubmit={async(e)=>{e.preventDefault(); await supabase.from('sitios').insert([nuevoSitio]); setNuevoSitio({nombre:'', ciudad:''}); cargarDatos();}} className="card" style={{padding:'15px'}}>
                <h4>Nueva Sede</h4>
                <input value={nuevoSitio.nombre} onChange={e=>setNuevoSitio({...nuevoSitio, nombre:e.target.value})} placeholder="Nombre Sede" required style={{width:'100%', marginBottom:'10px'}} />
                <button style={{backgroundColor: corporativoRed, color:'white', width:'100%', padding:'10px', border:'none'}}>CREAR SEDE</button>
             </form>
             <div className="card" style={{marginTop:'15px'}}>
                {sitios.map(s => <div key={s.id} style={{padding:'10px', borderBottom:'1px solid #eee'}}>{s.nombre}</div>)}
             </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{display:'none'}} width="640" height="480" />
    </div>
  );
};

export default OroJuezApp;