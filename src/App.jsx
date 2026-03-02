import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './style.css'; 
import { Camera, LogOut, RefreshCw, Search, Image as ImageIcon, Trash2, Edit, FileText, Download, Users, MapPin, ShieldCheck } from 'lucide-react';

// Credenciales originales según tu archivo
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
      // 1. CARGAR SEDES (SITIOS)
      // REQUERIMIENTO: Si es operador, solo tiene acceso a la escala/sede de su sitio
      let { data: s, error: errS } = await supabase.from('sitios').select('*').order('nombre');
      if (errS) throw errS;

      if (user.rol?.toUpperCase() !== 'ADMIN' && user.rol?.toUpperCase() !== 'ADMINISTRADOR' && user.sitio_id) {
        s = s.filter(sitio => String(sitio.id) === String(user.sitio_id));
      }
      setSitios(s || []);

      // 2. CARGAR USUARIOS
      // Solo accesible para administradores
      if (user.rol?.toUpperCase() === 'ADMIN' || user.rol?.toUpperCase() === 'ADMINISTRADOR' || user.email === 'industria.orojuez@gmail.com') {
        const { data: u, error: errU } = await supabase.from('perfiles_usuarios').select('*').order('nombre');
        if (errU) throw errU;
        setUsuarios(u || []);
      }

      // 3. CARGAR REPORTES
      let query = supabase.from('reportes_pesaje').select('*').order('created_at', { ascending: false }).limit(150);
      if (user.rol?.toUpperCase() === 'OPERATIVO') {
        query = query.eq('usuario_email', user.email);
      }
      const { data: r } = await query;
      setReportes(r || []);
      setReportesFiltrados(r || []);

    } catch (err) { 
      console.error("Error cargando datos:", err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const cargarReporteConsolidado = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reportes_pesaje')
        .select('created_at, nombre_sitio, peso_manual, nombre_usuario, observaciones, sitio_id')
        .order('created_at', { ascending: false });

      if (user.rol?.toUpperCase() === 'OPERATIVO') {
        query = query.eq('usuario_email', user.email);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReporteConsolidado(data || []);
      setConsolidadoFiltrado(data || []);
      setView('reporte_gerencial'); 
    } catch (err) {
      alert("Error cargando reporte: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let temp = [...reportes];
    if (filtroSede) {
      temp = temp.filter(r => String(r.sitio_id) === String(filtroSede));
    }
    if (fechaInicio) {
      const inicio = new Date(fechaInicio + 'T00:00:00');
      temp = temp.filter(r => new Date(r.created_at) >= inicio);
    }
    if (fechaFin) {
      const fin = new Date(fechaFin + 'T23:59:59');
      temp = temp.filter(r => new Date(r.created_at) <= fin);
    }
    setReportesFiltrados(temp);
  };

  const aplicarFiltrosConsolidado = () => {
    let temp = [...reporteConsolidado];
    if (filtroSede) {
      temp = temp.filter(r => String(r.sitio_id) === String(filtroSede));
    }
    if (fechaInicio) {
      const inicio = new Date(fechaInicio + 'T00:00:00');
      temp = temp.filter(r => new Date(r.created_at) >= inicio);
    }
    if (fechaFin) {
      const fin = new Date(fechaFin + 'T23:59:59');
      temp = temp.filter(r => new Date(r.created_at) <= fin);
    }
    setConsolidadoFiltrado(temp);
  };

  const totalPesos = reportesFiltrados.reduce((sum, r) => sum + (parseFloat(r.peso_manual) || 0), 0);

  const exportarExcel = () => {
    if (reportesFiltrados.length === 0) return alert("No hay datos para exportar");
    const encabezados = ["Fecha", "Hora", "Sede", "Usuario", "Peso (kg)", "Observaciones"];
    const filas = reportesFiltrados.map(r => [
      new Date(r.created_at).toLocaleDateString(),
      new Date(r.created_at).toLocaleTimeString(),
      `"${r.nombre_sitio}"`, 
      `"${r.nombre_usuario}"`,
      r.peso_manual,
      `"${(r.observaciones || '').replace(/"/g, '""')}"`
    ]);
    const CSV_IDENTIFIER = "\uFEFF"; 
    let csvContent = CSV_IDENTIFIER + encabezados.join(",") + "\n" 
      + filas.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Orojuez_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const gestionarUsuario = async (e) => {
    e.preventDefault();
    const sede = sitios.find(s => String(s.id) === String(nuevoUsuario.sitio_id));
    const payload = { 
        email: nuevoUsuario.email, 
        nombre: nuevoUsuario.nombre, 
        sitio_id: nuevoUsuario.sitio_id ? parseInt(nuevoUsuario.sitio_id) : null, 
        rol: nuevoUsuario.rol, 
        password: nuevoUsuario.password,
        nombre_sitio: sede?.nombre || '',
        ciudad: sede?.ciudad || ''
    };

    const { error } = editMode 
      ? await supabase.from('perfiles_usuarios').update(payload).eq('email', nuevoUsuario.email)
      : await supabase.from('perfiles_usuarios').insert([payload]);

    if (!error) {
      alert("Usuario guardado");
      setEditMode(false);
      setNuevoUsuario({ email: '', nombre: '', sitio_id: '', rol: 'OPERATIVO', password: '' });
      cargarDatos();
    } else alert(error.message);
  };

  const guardarControl = async () => {
    if (!photo || !pesoManual) return alert("Falta foto o peso.");
    setLoading(true);
    try {
      const { error } = await supabase.from('reportes_pesaje').insert([{
        sitio_id: user.sitio_id, 
        nombre_sitio: user.nombre_sitio || 'Sede Principal',
        usuario_email: user.email,
        nombre_usuario: user.nombre,
        peso_manual: parseFloat(pesoManual),
        foto_url: photo,
        observaciones: observaciones || ''
      }]);
      if (error) throw error;
      alert("¡Registro guardado!");
      setPhoto(null); setPesoManual(''); setObservaciones('');
      await cargarDatos();
      setView('historial');
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim().toLowerCase();
    const password = e.target.password.value.trim();
    if (email === 'industria.orojuez@gmail.com' && password === 'admin123') {
      setUser({ email, nombre: 'Super Admin', rol: 'ADMIN' }); setView('dashboard');
    } else {
      const { data } = await supabase.from('perfiles_usuarios').select('*').eq('email', email).eq('password', password).single();
      if (data) { setUser(data); setView('dashboard'); } else alert("Credenciales incorrectas");
    }
  };

  if (view === 'login') return (
    <div className="container" style={{padding:'20px', maxWidth:'450px', margin:'auto', textAlign:'center', display:'flex', flexDirection:'column', minHeight:'100vh', justifyContent:'center'}}>
      <div style={{marginBottom:'20px', display:'flex', justifyContent:'center'}}>
        <img src="https://khgqeqrnlbhadoarcgul.supabase.co/storage/v1/object/public/logos/Logotipo_Orojuez_1.png" alt="LOGO OROJUEZ" style={{width:'220px', height:'auto'}} />
      </div>
      <h1 style={{color: corporativoRed, fontSize:'2.8rem', margin:'0', fontWeight:'bold'}}>OROJUEZ SA.</h1>
      <p style={{fontSize:'1.2rem', color:'#555', marginBottom:'30px'}}>Sistema de Control de Pesos</p>
      <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:'15px', background:'white', padding:'25px', borderRadius:'15px', boxShadow:'0 4px 15px rgba(0,0,0,0.1)'}}>
        <input name="email" type="email" placeholder="Usuario / Correo Electrónico" required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ddd'}} />
        <input name="password" type="password" placeholder="Contraseña" required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ddd'}} />
        <button style={{backgroundColor: corporativoRed, color:'white', padding:'15px', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer', fontSize:'1rem'}}>INICIAR SESIÓN</button>
      </form>
    </div>
  );

  return (
    <div className="container">
      <div className="navbar no-print" style={{backgroundColor: corporativoRed, display:'flex', justifyContent:'space-between', padding:'10px 20px'}}>
        <span style={{fontSize:'12px', color:'white', fontWeight:'bold'}}>{user?.nombre} | {user?.rol?.toUpperCase()}</span>
        <div style={{display:'flex', gap:'15px'}}>
          <button onClick={cargarDatos} style={{background:'none', border:'none', color:'white'}}><RefreshCw size={18} className={loading?'spin':''}/></button>
          <button onClick={() => {setUser(null); setView('login');}} style={{color:'white', background:'none', border:'none'}}><LogOut size={18}/></button>
        </div>
      </div>

      <div className="no-print" style={{display:'flex', gap:'5px', margin:'10px', overflowX:'auto', paddingBottom:'5px'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{padding:'10px', flex:'1', minWidth:'80px', fontSize:'11px', border:view==='dashboard'?`2px solid ${corporativoRed}`:'none'}}>CAPTURA</button>
        <button onClick={cargarReporteConsolidado} className="card" style={{padding:'10px', flex:'1', minWidth:'80px', fontSize:'11px', border: view === 'reporte_gerencial' ? `2px solid ${corporativoRed}` : 'none' }}>COTEJO</button>
        <button onClick={() => setView('historial')} className="card" style={{padding:'10px', flex:'1', minWidth:'80px', fontSize:'11px', border:view==='historial'?`2px solid ${corporativoRed}`:'none'}}>HISTORIAL</button>
        {['admin', 'administrador', 'auditor'].includes(user?.rol?.toLowerCase()) && (
          <button onClick={() => setView('reportes')} className="card" style={{padding:'10px', flex:'1', minWidth:'80px', fontSize:'11px', border:view==='reportes'?`2px solid ${corporativoRed}`:'none'}}>REPORTES</button>
        )}
        {['admin', 'administrador'].includes(user?.rol?.toLowerCase()) && (
          <>
            <button onClick={() => setView('usuarios')} className="card" style={{padding:'10px', flex:'1', minWidth:'80px', fontSize:'11px', border:view==='usuarios'?`2px solid ${corporativoRed}`:'none'}}>USUARIOS</button>
            <button onClick={() => setView('sedes')} className="card" style={{padding:'10px', flex:'1', minWidth:'80px', fontSize:'11px', border:view==='sedes'?`2px solid ${corporativoRed}`:'none'}}>SEDES</button>
          </>
        )}
      </div>

      <div className="content-box">
        {view === 'dashboard' && (
          <div className="card" style={{padding:'15px'}}>
            {!photo && !streaming && (
              <button onClick={()=>{setStreaming(true); navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s=>videoRef.current.srcObject=s)}} style={{backgroundColor: corporativoRed, color:'white', padding:'30px', borderRadius:'50%', border:'none'}}><Camera size={30}/></button>
            )}
            {streaming && (
              <div>
                <video ref={videoRef} autoPlay playsInline style={{width:'100%', borderRadius:'10px'}} />
                <button onClick={() => {
                  const canvas = canvasRef.current;
                  canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 640, 480);
                  setPhoto(canvas.toDataURL('image/jpeg'));
                  setStreaming(false);
                  videoRef.current.srcObject.getTracks().forEach(t => t.stop());
                }} style={{width:'100%', backgroundColor: corporativoRed, color:'white', padding:'12px', border:'none', borderRadius:'8px', marginTop:'10px'}}>CAPTURAR FOTO</button>
              </div>
            )}
            {photo && (
              <div>
                <img src={photo} style={{width:'100%', borderRadius:'10px'}} alt="Pesaje" />
                <input type="number" value={pesoManual} onChange={e=>setPesoManual(e.target.value)} placeholder="0.00 kg" style={{fontSize:'2.5rem', textAlign:'center', width:'100%', margin:'10px 0', border:`2px solid ${corporativoRed}`, borderRadius:'10px'}} />
                <textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} placeholder="Observaciones..." style={{width:'100%', marginBottom:'10px', padding:'10px', borderRadius:'5px', border:'1px solid #ddd'}} />
                <button onClick={guardarControl} disabled={loading} style={{width:'100%', backgroundColor: corporativoRed, color:'white', padding:'15px', border:'none', borderRadius:'8px', fontWeight:'bold'}}>GUARDAR REGISTRO</button>
                <button onClick={()=>setPhoto(null)} style={{width:'100%', marginTop:'10px', background:'none', border:'none', fontSize:'12px'}}>Cancelar foto</button>
              </div>
            )}
          </div>
        )}

        {view === 'reportes' && (
          <div style={{padding:'5px'}}>
             <div className="card no-print" style={{padding:'10px', marginBottom:'10px'}}>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px'}}>
                  <input type="date" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} />
                  <input type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} />
                  <select value={filtroSede} onChange={e=>setFiltroSede(e.target.value)}>
                    <option value="">Todas las Sedes</option>
                    {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                  <button onClick={aplicarFiltros} style={{backgroundColor: corporativoRed, color:'white', border:'none', borderRadius:'5px'}}><Search size={14}/></button>
                </div>
             </div>
             <div className="card" style={{padding:'5px', overflowX:'auto'}}>
               <table style={{width:'100%', fontSize:'10px', borderCollapse:'collapse', textAlign:'center'}}>
                  <thead><tr style={{background:'#f2f2f2'}}><th>Fecha/Hora</th><th>Sede/Usuario</th><th>Peso</th><th>Foto</th><th>Obs.</th></tr></thead>
                  <tbody>
                    {reportesFiltrados.map(r => (
                      <tr key={r.id} style={{borderBottom:'1px solid #eee'}}>
                        <td>{new Date(r.created_at).toLocaleString()}</td>
                        <td>{r.nombre_sitio}<br/><b>{r.nombre_usuario}</b></td>
                        <td><strong>{r.peso_manual}</strong></td>
                        <td><img src={r.foto_url} alt="min" style={{width:'50px'}} onClick={()=>{const w=window.open();w.document.write(`<img src="${r.foto_url}" style="width:100%"/>`)}}/></td>
                        <td>{r.observaciones}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>
        )}

        {view === 'usuarios' && (
          <div style={{padding:'10px'}}>
            <form onSubmit={gestionarUsuario} className="card" style={{padding:'15px', marginBottom:'15px', textAlign:'left'}}>
              <h4>{editMode ? 'Editar' : 'Nuevo'} Usuario</h4>
              <input value={nuevoUsuario.nombre} onChange={e=>setNuevoUsuario({...nuevoUsuario, nombre:e.target.value})} placeholder="Nombre completo" required style={{width:'100%', marginBottom:'10px', padding:'8px'}} />
              <input value={nuevoUsuario.email} onChange={e=>setNuevoUsuario({...nuevoUsuario, email:e.target.value})} placeholder="Email (Usuario)" required disabled={editMode} style={{width:'100%', marginBottom:'10px', padding:'8px'}} />
              <input value={nuevoUsuario.password} onChange={e=>setNuevoUsuario({...nuevoUsuario, password:e.target.value})} placeholder="Contraseña" required style={{width:'100%', marginBottom:'10px', padding:'8px'}} />
              <select value={nuevoUsuario.rol} onChange={e=>setNuevoUsuario({...nuevoUsuario, rol:e.target.value})} required style={{width:'100%', marginBottom:'10px', padding:'8px'}}>
                <option value="OPERATIVO">Operador</option>
                <option value="ADMINISTRADOR">Administrador</option>
                <option value="AUDITOR">Auditor</option>
              </select>
              <select value={nuevoUsuario.sitio_id} onChange={e=>setNuevoUsuario({...nuevoUsuario, sitio_id:e.target.value})} required style={{width:'100%', marginBottom:'10px', padding:'8px'}}>
                <option value="">Sede Asignada...</option>
                {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <button style={{backgroundColor: corporativoRed, color:'white', width:'100%', padding:'10px', border:'none', borderRadius:'8px'}}>{editMode ? 'ACTUALIZAR' : 'CREAR USUARIO'}</button>
            </form>
            <div className="card">
              <table style={{width:'100%', fontSize:'11px'}}>
                <thead><tr><th>Nombre</th><th>Sede</th><th>Acción</th></tr></thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.email}>
                      <td>{u.nombre}</td>
                      <td>{u.nombre_sitio}</td>
                      <td>
                        <button onClick={()=>{setNuevoUsuario(u); setEditMode(true);}} style={{background:'none', border:'none', color:'blue'}}><Edit size={14}/></button>
                        <button onClick={async()=>{if(confirm('¿Eliminar?')){await supabase.from('perfiles_usuarios').delete().eq('email', u.email); cargarDatos();}}} style={{background:'none', border:'none', color:'red'}}><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'sedes' && (
          <div style={{padding:'10px'}}>
            <form onSubmit={async(e)=>{e.preventDefault(); await supabase.from('sitios').insert([nuevoSitio]); setNuevoSitio({nombre:'', ciudad:''}); cargarDatos();}} className="card" style={{padding:'15px', marginBottom:'15px'}}>
              <h4>Nueva Sede</h4>
              <input value={nuevoSitio.nombre} onChange={e=>setNuevoSitio({...nuevoSitio, nombre:e.target.value})} placeholder="Nombre Sede" required style={{width:'100%', marginBottom:'10px', padding:'8px'}} />
              <input value={nuevoSitio.ciudad} onChange={e=>setNuevoSitio({...nuevoSitio, ciudad:e.target.value})} placeholder="Ciudad" required style={{width:'100%', marginBottom:'10px', padding:'8px'}} />
              <button style={{backgroundColor: corporativoRed, color:'white', width:'100%', padding:'10px', border:'none', borderRadius:'8px'}}>CREAR SEDE</button>
            </form>
            <div className="card">
              {sitios.map(s => (
                <div key={s.id} style={{padding:'10px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}>
                  <span>{s.nombre} ({s.ciudad})</span>
                  <button onClick={async()=>{if(confirm('¿Eliminar sede?')){await supabase.from('sitios').delete().eq('id', s.id); cargarDatos();}}} style={{background:'none', border:'none', color:'red'}}><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{display:'none'}} width="640" height="480" />
    </div>
  );
};

export default OroJuezApp;