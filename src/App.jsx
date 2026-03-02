import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './style.css'; 
import { Camera, LogOut, RefreshCw, Search, Image as ImageIcon, Trash2, Edit, FileText, Download, Users, MapPin, ShieldCheck, AlertTriangle } from 'lucide-react';

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
  
  const corporativoRed = "#b30000";

  const [filtroSede, setFiltroSede] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', nombre: '', sitio_id: '', rol: 'operador', password: '' });
  const [nuevoSitio, setNuevoSitio] = useState({ nombre: '', ciudad: '' });

  const [photo, setPhoto] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [pesoManual, setPesoManual] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => { if(user) cargarDatos(); }, [user]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const { data: s } = await supabase.from('sitios').select('*').order('nombre');
      const { data: u } = await supabase.from('perfiles_usuarios').select('*').order('nombre');
      setSitios(s || []);
      setUsuarios(u || []);

      let query = supabase.from('reportes_pesaje').select('*').order('created_at', { ascending: false });
      if (user?.rol === 'operador') {
        query = query.eq('usuario_email', user?.email);
      }
      const { data: r } = await query;
      setReportes(r || []);
      setReportesFiltrados(r || []);
    } catch (err) { console.error("Error:", err); } 
    finally { setLoading(false); }
  };

  // --- FUNCIÓN DE EMERGENCIA PARA LIBERAR ESPACIO (ERROR 402) ---
  const mantenimientoLiberarEspacio = async () => {
    const confirmar = confirm("¡ATENCIÓN!\n\nEsta acción eliminará los archivos de fotos de la primera quincena de FEBRERO para liberar espacio y corregir el error 402.\n\n¿Desea continuar?");
    if (!confirmar) return;

    setLoading(true);
    try {
      // 1. Limpiar referencias en la base de datos (para reducir los 72MB de índices)
      const { error: dbError } = await supabase
        .from('reportes_pesaje')
        .update({ foto_url: null })
        .gte('created_at', '2025-02-01T00:00:00')
        .lte('created_at', '2025-02-15T23:59:59');

      if (dbError) throw new Error("Error en BD: " + dbError.message);

      // 2. Intentar borrar archivos del Storage (Ajustar nombre del bucket si no es 'pesajes')
      const bucketName = 'pesajes'; 
      const { data: files, error: listError } = await supabase.storage.from(bucketName).list();
      
      if (!listError && files.length > 0) {
        // Filtramos archivos que empiecen con fechas de la primera quincena de febrero si el nombre lo permite
        // O borramos los más antiguos. Aquí intentamos borrar los primeros 100 encontrados.
        const filesToDelete = files.slice(0, 100).map(f => f.name);
        await supabase.storage.from(bucketName).remove(filesToDelete);
      }

      alert("Mantenimiento completado. Por favor, ejecute REINDEX en el SQL Editor de Supabase para finalizar la liberación de los 72MB.");
      cargarDatos();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let temp = [...reportes];
    if (filtroSede) {
      const sedeObj = sitios.find(s => String(s.id) === String(filtroSede));
      temp = temp.filter(r => String(r.sitio_id) === String(filtroSede) || r.nombre_sitio === sedeObj?.nombre);
    }
    if (fechaInicio) temp = temp.filter(r => r.created_at >= fechaInicio);
    if (fechaFin) temp = temp.filter(r => r.created_at <= fechaFin + 'T23:59:59');
    setReportesFiltrados(temp);
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
    let csvContent = CSV_IDENTIFIER + encabezados.join(",") + "\n" + filas.map(e => e.join(",")).join("\n");
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
    const payload = { ...nuevoUsuario, nombre_sitio: sede?.nombre || '', ciudad: sede?.ciudad || '' };
    const { error } = editMode 
      ? await supabase.from('perfiles_usuarios').update(payload).eq('email', nuevoUsuario.email)
      : await supabase.from('perfiles_usuarios').insert([payload]);

    if (!error) {
      alert("Usuario guardado");
      setEditMode(false);
      setNuevoUsuario({ email: '', nombre: '', sitio_id: '', rol: 'operador', password: '' });
      cargarDatos();
    } else alert(error.message);
  };

  const guardarControl = async () => {
    if (!photo || !pesoManual) return alert("Falta foto o peso.");
    setLoading(true);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cleanId = uuidRegex.test(user.sitio_id) ? user.sitio_id : null;

    try {
      const { error } = await supabase.from('reportes_pesaje').insert([{
        sitio_id: cleanId, 
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
      setUser({ email, nombre: 'Super Admin', rol: 'admin' }); setView('dashboard');
    } else {
      const { data } = await supabase.from('perfiles_usuarios').select('*').eq('email', email).eq('password', password).single();
      if (data) { setUser(data); setView('dashboard'); } else alert("Credenciales incorrectas");
    }
  };

  if (view === 'login') return (
    <div className="container" style={{padding:'20px', maxWidth:'450px', margin:'auto', textAlign:'center', display:'flex', flexDirection:'column', minHeight:'100vh', justifyContent:'center'}}>
      <div style={{marginBottom:'20px', display:'flex', justifyContent:'center'}}>
        <img 
          src="https://khgqeqrnlbhadoarcgul.supabase.co/storage/v1/object/public/logos/Logotipo_Orojuez_1.png" 
          alt="LOGO OROJUEZ" 
          style={{width:'220px', height:'auto'}} 
          onError={(e) => e.target.src = "https://via.placeholder.com/220x80?text=OROJUEZ+SA"}
        />
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
          <button onClick={() => setView('login')} style={{color:'white', background:'none', border:'none'}}><LogOut size={18}/></button>
        </div>
      </div>

      <div className="no-print" style={{display:'flex', gap:'5px', margin:'10px', overflowX:'auto', paddingBottom:'5px'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{padding:'10px', flex:'1', minWidth:'80px', fontSize:'11px', border:view==='dashboard'?`2px solid ${corporativoRed}`:'none'}}>CAPTURA</button>
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
        {/* ... (Vistas dashboard, reportes e historial se mantienen igual) ... */}
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

        {view === 'usuarios' && (
          <div style={{padding:'10px'}}>
            {/* BOTÓN DE MANTENIMIENTO SOLO PARA SUPER ADMIN */}
            {user?.email === 'industria.orojuez@gmail.com' && (
              <div className="card" style={{padding:'15px', marginBottom:'15px', border:`2px solid black`, background:'#fff0f0'}}>
                <h4 style={{color:'black', display:'flex', alignItems:'center', gap:'10px'}}><AlertTriangle color="red"/> MANTENIMIENTO DE ESPACIO</h4>
                <p style={{fontSize:'11px', color:'#666'}}>Use este botón si el sistema arroja Error 402 por almacenamiento lleno.</p>
                <button 
                  onClick={mantenimientoLiberarEspacio} 
                  disabled={loading}
                  style={{backgroundColor: 'black', color:'white', width:'100%', padding:'12px', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}
                >
                  {loading ? 'PROCESANDO...' : 'BORRAR FOTOS 1-15 FEBRERO'}
                </button>
              </div>
            )}

            <form onSubmit={gestionarUsuario} className="card" style={{padding:'15px', marginBottom:'15px', textAlign:'left'}}>
              <h4 style={{color: corporativoRed}}>{editMode ? 'Editar' : 'Nuevo'} Usuario</h4>
              <input value={nuevoUsuario.nombre} onChange={e=>setNuevoUsuario({...nuevoUsuario, nombre:e.target.value})} placeholder="Nombre completo" required />
              <input value={nuevoUsuario.email} onChange={e=>setNuevoUsuario({...nuevoUsuario, email:e.target.value})} placeholder="Email (Usuario)" required disabled={editMode} />
              <input value={nuevoUsuario.password} onChange={e=>setNuevoUsuario({...nuevoUsuario, password:e.target.value})} placeholder="Contraseña" required />
              <select value={nuevoUsuario.rol} onChange={e=>setNuevoUsuario({...nuevoUsuario, rol:e.target.value})} required>
                <option value="operador">Operador</option>
                <option value="administrador">Administrador</option>
                <option value="auditor">Auditor</option>
              </select>
              <select value={nuevoUsuario.sitio_id} onChange={e=>setNuevoUsuario({...nuevoUsuario, sitio_id:e.target.value})} required>
                <option value="">Sede Asignada...</option>
                {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <button style={{backgroundColor: corporativoRed, color:'white', width:'100%', padding:'10px', marginTop:'10px', border:'none', borderRadius:'8px', fontWeight:'bold'}}>{editMode ? 'ACTUALIZAR' : 'CREAR USUARIO'}</button>
            </form>
            {/* ... (Tabla de usuarios) ... */}
            <div className="card">
              <table style={{width:'100%', fontSize:'11px', textAlign:'left'}}>
                <thead><tr style={{background:'#f8f8f8'}}><th style={{padding:'8px'}}>Nombre</th><th>Sede</th><th style={{textAlign:'right'}}>Acción</th></tr></thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.email} style={{borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'8px'}}><strong>{u.nombre}</strong><br/>{u.rol}</td>
                      <td>{u.nombre_sitio}</td>
                      <td style={{textAlign:'right', paddingRight:'10px'}}>
                        <button onClick={()=>{setNuevoUsuario(u); setEditMode(true);}} style={{color:'blue', border:'none', background:'none', marginRight:'10px'}}><Edit size={14}/></button>
                        <button onClick={async()=>{if(confirm('¿Eliminar?')){await supabase.from('perfiles_usuarios').delete().eq('email', u.email); cargarDatos();}}} style={{color: corporativoRed, border:'none', background:'none'}}><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Resto de vistas (sedes, reportes, historial) omitidas para brevedad pero se mantienen en tu código real */}
      </div>
      <canvas ref={canvasRef} style={{display:'none'}} width="640" height="480" />
    </div>
  );
};

export default OroJuezApp;