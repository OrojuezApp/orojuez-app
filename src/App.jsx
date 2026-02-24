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

      let query = supabase.from('reportes_pesaje').select('*').order('created_at', { ascending: false }).limit(20);
      if (user?.rol === 'operador') {
        query = query.eq('usuario_email', user?.email);
      }
      const { data: r } = await query;
      setReportes(r || []);
      setReportesFiltrados(r || []);
    } catch (err) { console.error("Error:", err); } 
    finally { setLoading(false); }
  };

const aplicarFiltros = () => {
    let temp = [...reportes];

    // 1. Filtro por Sede
    if (filtroSede) {
      const sedeObj = sitios.find(s => String(s.id) === String(filtroSede));
      temp = temp.filter(r => 
        String(r.sitio_id) === String(filtroSede) || 
        r.nombre_sitio === sedeObj?.nombre
      );
    }

    // 2. Filtro por Fecha (Ajuste de Zona Horaria)
    if (fechaInicio) {
      // Creamos la fecha de inicio a las 00:00:00 de ese día
      const inicio = new Date(fechaInicio + 'T00:00:00');
      temp = temp.filter(r => new Date(r.created_at) >= inicio);
    }

    if (fechaFin) {
      // Creamos la fecha de fin a las 23:59:59 de ese día para incluir todo el día
      const fin = new Date(fechaFin + 'T23:59:59');
      temp = temp.filter(r => new Date(r.created_at) <= fin);
    }

    setReportesFiltrados(temp);
  };

{/* BOTÓN DE RESPALDO DE EMERGENCIA */}
<button 
  onClick={async () => {
    alert("Iniciando descarga... por favor espera unos segundos sin cerrar la App.");
    setLoading(true);
    try {
      const { data, error } = await supabase.from('reportes_pesaje').select('*');
      if (error) throw error;
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "RESPALDO_TOTAL_PESAJES.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      alert("✅ ¡Respaldo descargado con éxito! Verifica el archivo en tu carpeta de Descargas.");
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }}
  style={{
    backgroundColor: '#ffc107',
    color: 'black',
    padding: '8px 15px',
    borderRadius: '8px',
    marginLeft: '10px',
    cursor: 'pointer',
    border: 'none',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    zIndex: 9999
  }}
>
  💾 RESPALDAR TODO
</button>
  const totalPesos = reportesFiltrados.reduce((sum, r) => sum + (parseFloat(r.peso_manual) || 0), 0);

  // --- FUNCIÓN PARA EXPORTAR A EXCEL (CSV) SIN FOTO ---
  const exportarExcel = () => {
    if (reportesFiltrados.length === 0) return alert("No hay datos para exportar");

    const encabezados = ["Fecha", "Hora", "Sede", "Usuario", "Peso (kg)", "Observaciones"];
    
    const filas = reportesFiltrados.map(r => [
      new Date(r.created_at).toLocaleDateString(),
      new Date(r.created_at).toLocaleTimeString(),
      `"${r.nombre_sitio}"`, 
      `"${r.nombre_usuario}"`,
      r.peso_manual,
      `"${(r.observaciones || '').replace(/"/g, '""')}"` // Escapar comillas dobles internas
    ]);

    // Añadir BOM para que Excel detecte UTF-8 (acentos y ñ)
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

      <div style={{marginTop:'40px', padding:'20px', fontSize:'0.85rem', color:'#888', borderTop:'1px solid #eee'}}>
        <p>© 2026 Todos los derechos reservados a la empresa Orojuez SA.</p>
        <p>Soporte técnico: <a href="mailto:sistemas.industria@orojuez.com.ec" style={{color: corporativoRed, textDecoration:'none', fontWeight:'bold'}}>sistemas.industria@orojuez.com.ec</a></p>
      </div>
    </div>
  );

  return (
    <div className="container">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .container { width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          table { width: 100% !important; border-collapse: collapse !important; table-layout: fixed; }
          th, td { border: 1px solid #ddd !important; padding: 4px !important; word-wrap: break-word; vertical-align: middle !important; }
          .miniatura-reporte { width: 70px !important; height: 70px !important; object-fit: cover !important; }
          body { background: white !important; font-family: sans-serif; }
          @page { margin: 1cm; }
        }
        .miniatura-reporte { width: 70px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; cursor: pointer; transition: transform 0.2s; }
        .miniatura-reporte:hover { transform: scale(1.1); }
      `}</style>

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
                <div style={{display:'flex', gap:'5px', marginTop:'10px'}}>
                  <button onClick={() => window.print()} className="card" style={{flex:1, background: corporativoRed, color:'white', border:'none', padding:'8px', fontWeight:'bold'}}>PDF / IMPRIMIR</button>
                  <button onClick={exportarExcel} className="card" style={{flex:1, background: '#1D6F42', color:'white', border:'none', padding:'8px', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px'}}>
                    <Download size={14}/> EXCEL
                  </button>
                </div>
             </div>

             <div className="card" style={{padding:'5px', overflowX:'auto'}}>
               <table style={{width:'100%', fontSize:'10px', borderCollapse:'collapse', textAlign:'center'}}>
                  <thead>
                    <tr style={{background:'#f2f2f2'}}>
                      <th style={{width:'80px'}}>Fecha/Hora</th>
                      <th>Sede/Usuario</th>
                      <th style={{width:'70px'}}>Peso</th>
                      <th style={{width:'85px'}}>Foto</th>
                      <th>Obs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportesFiltrados.map(r => (
                      <tr key={r.id} style={{borderBottom:'1px solid #eee'}}>
                        <td>
                          {new Date(r.created_at).toLocaleDateString()}<br/>
                          <span style={{color: corporativoRed, fontWeight:'bold'}}>{new Date(r.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </td>
                        <td style={{fontSize:'9px'}}>{r.nombre_sitio}<br/><b>{r.nombre_usuario}</b></td>
                        <td><strong style={{fontSize:'1.1rem'}}>{r.peso_manual}</strong></td>
                        <td>
                          <img 
                            src={r.foto_url} 
                            className="miniatura-reporte"
                            alt="min" 
                            onClick={()=>{const w=window.open();w.document.write(`<img src="${r.foto_url}" style="width:100%"/>`)}}
                          />
                        </td>
                        <td style={{fontSize:'8px'}}>{r.observaciones || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{background:'#eee', fontWeight:'bold'}}>
                      <td colSpan="2" style={{padding:'8px', textAlign:'right'}}>TOTAL PESO:</td>
                      <td colSpan="3" style={{fontSize:'1.1rem', textAlign:'left'}}>{totalPesos.toFixed(2)} kg</td>
                    </tr>
                  </tfoot>
               </table>
             </div>
          </div>
        )}

        {view === 'historial' && (
          <div style={{padding:'5px'}}>
            {reportesFiltrados.map(r => (
              <div key={r.id} className="card" style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', padding:'10px', borderLeft:`5px solid ${corporativoRed}`}}>
                <div style={{textAlign:'left'}}>
                  <strong>{r.nombre_sitio}</strong><br/>
                  <span style={{color: corporativoRed, fontWeight:'bold'}}>{r.peso_manual} kg</span><br/>
                  <small>{new Date(r.created_at).toLocaleString()}</small>
                </div>
                <button onClick={()=>{const w=window.open();w.document.write(`<img src="${r.foto_url}" style="width:100%"/>`)}} style={{background:'none', border:'none', color: corporativoRed}}><ImageIcon size={24}/></button>
              </div>
            ))}
          </div>
        )}

        {/* MODULOS DE ADMIN */}
        {view === 'usuarios' && (
          <div style={{padding:'10px'}}>
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

        {view === 'sedes' && (
          <div style={{padding:'10px'}}>
            <form onSubmit={async(e)=>{e.preventDefault(); await supabase.from('sitios').insert([nuevoSitio]); setNuevoSitio({nombre:'', ciudad:''}); cargarDatos();}} className="card" style={{padding:'15px', marginBottom:'15px'}}>
              <h4 style={{color: corporativoRed}}>Nueva Sede</h4>
              <input value={nuevoSitio.nombre} onChange={e=>setNuevoSitio({...nuevoSitio, nombre:e.target.value})} placeholder="Nombre Sede" required />
              <input value={nuevoSitio.ciudad} onChange={e=>setNuevoSitio({...nuevoSitio, ciudad:e.target.value})} placeholder="Ciudad" required />
              <button style={{backgroundColor: corporativoRed, color:'white', width:'100%', padding:'10px', marginTop:'10px', border:'none', borderRadius:'8px', fontWeight:'bold'}}>CREAR SEDE</button>
            </form>
            <div className="card">
              {sitios.map(s => (
                <div key={s.id} style={{padding:'10px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}>
                  <span>{s.nombre} ({s.ciudad})</span>
                  <button onClick={async()=>{if(confirm('¿Eliminar sede?')){await supabase.from('sitios').delete().eq('id', s.id); cargarDatos();}}} style={{color: corporativoRed, border:'none', background:'none'}}><Trash2 size={16}/></button>
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