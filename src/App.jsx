import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './style.css'; 
import { Camera, LogOut, RefreshCw, Search, Image as ImageIcon, Trash2, Edit, FileText, Download, Users, MapPin } from 'lucide-react';

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
  
  // Estados para Filtros de Reportes
  const [filtroSede, setFiltroSede] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // Estados para Formularios (Usuarios y Sedes)
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', nombre: '', sitio_id: '', rol: 'operador', password: '' });
  const [nuevoSitio, setNuevoSitio] = useState({ nombre: '', ciudad: '' });

  // Estados de Operación (Captura)
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
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
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

  // --- FUNCIONES DE GESTIÓN ---
  const gestionarUsuario = async (e) => {
    e.preventDefault();
    const sede = sitios.find(s => String(s.id) === String(nuevoUsuario.sitio_id));
    const payload = { ...nuevoUsuario, nombre_sitio: sede?.nombre, ciudad: sede?.ciudad };
    
    const { error } = editMode 
      ? await supabase.from('perfiles_usuarios').update(payload).eq('email', nuevoUsuario.email)
      : await supabase.from('perfiles_usuarios').insert([payload]);

    if (!error) {
      alert("Usuario guardado con éxito");
      setEditMode(false);
      setNuevoUsuario({ email: '', nombre: '', sitio_id: '', rol: 'operador', password: '' });
      cargarDatos();
    } else alert(error.message);
  };

  const gestionarSede = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('sitios').insert([nuevoSitio]);
    if (!error) {
      alert("Sede creada");
      setNuevoSitio({ nombre: '', ciudad: '' });
      cargarDatos();
    } else alert(error.message);
  };

  const eliminarSede = async (id) => {
    if(confirm("¿Eliminar sede?")){
      await supabase.from('sitios').delete().eq('id', id);
      cargarDatos();
    }
  };

  // --- EXPORTACIÓN ---
  const exportarExcel = () => {
    const encabezados = "Fecha,Sede,Usuario,Peso (kg),Observaciones\n";
    const filas = reportesFiltrados.map(r => `"${new Date(r.created_at).toLocaleString()}","${r.nombre_sitio}","${r.nombre_usuario}","${r.peso_manual}","${r.observaciones}"`).join("\n");
    const blob = new Blob([encabezados + filas], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Reporte_OroJuez.csv";
    link.click();
  };

  const guardarControl = async () => {
    if (!photo || !pesoManual) return alert("Falta foto o peso.");
    setLoading(true);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cleanId = uuidRegex.test(user.sitio_id) ? user.sitio_id : null;
    try {
      const { error } = await supabase.from('reportes_pesaje').insert([{
        sitio_id: cleanId, nombre_sitio: user.nombre_sitio || 'Sede',
        usuario_email: user.email, nombre_usuario: user.nombre,
        peso_manual: parseFloat(pesoManual), foto_url: photo, observaciones: observaciones || ''
      }]);
      if (error) throw error;
      alert("Guardado!");
      setPhoto(null); setPesoManual(''); setObservaciones('');
      await cargarDatos(); setView('historial');
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
      if (data) { setUser(data); setView('dashboard'); } else alert("Acceso denegado");
    }
  };

  if (view === 'login') return (
    <div className="container" style={{padding:'40px 20px', maxWidth:'400px', margin:'auto'}}>
      <div className="navbar"><h1>ORO JUEZ V6.9</h1></div>
      <form onSubmit={handleLogin} style={{marginTop:'30px', display:'flex', flexDirection:'column', gap:'15px'}}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Clave" required />
        <button className="navbar" style={{color:'white', padding:'15px', border:'none', borderRadius:'8px', fontWeight:'bold'}}>ENTRAR</button>
      </form>
    </div>
  );

  return (
    <div className="container">
      <div className="navbar no-print" style={{display:'flex', justifyContent:'space-between', padding:'10px 20px'}}>
        <span style={{fontSize:'12px'}}>{user?.nombre}</span>
        <div style={{display:'flex', gap:'15px'}}>
          <button onClick={cargarDatos} style={{background:'none', border:'none', color:'white'}}><RefreshCw size={18} className={loading?'spin':''}/></button>
          <button onClick={() => setView('login')} style={{color:'white', background:'none', border:'none'}}><LogOut size={18}/></button>
        </div>
      </div>

      <div className="no-print" style={{display:'flex', gap:'5px', margin:'10px', overflowX:'auto', paddingBottom:'5px'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{padding:'10px', flex:'1', minWidth:'80px', fontSize:'11px', border:view==='dashboard'?'2px solid #ffc107':'none'}}>CAPTURA</button>
        <button onClick={() => setView('historial')} className="card" style={{padding:'10px', flex:'1', minWidth:'80px', fontSize:'11px', border:view==='historial'?'2px solid #ffc107':'none'}}>HISTORIAL</button>
        {['admin', 'superadmin'].includes(user?.rol) && (
          <>
            <button onClick={() => setView('reportes')} className="card" style={{padding:'10px', flex:'1', minWidth:'80px', fontSize:'11px', border:view==='reportes'?'2px solid #ffc107':'none'}}>REPORTES</button>
            <button onClick={() => setView('usuarios')} className="card" style={{padding:'10px', flex:'1', minWidth:'80px', fontSize:'11px', border:view==='usuarios'?'2px solid #ffc107':'none'}}>USUARIOS</button>
            <button onClick={() => setView('sedes')} className="card" style={{padding:'10px', flex:'1', minWidth:'80px', fontSize:'11px', border:view==='sedes'?'2px solid #ffc107':'none'}}>SEDES</button>
          </>
        )}
      </div>

      <div className="content-box">
        {view === 'dashboard' && (
          <div className="card" style={{padding:'15px'}}>
            {!photo && !streaming && (
              <button onClick={()=>{setStreaming(true); navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s=>videoRef.current.srcObject=s)}} className="navbar" style={{color:'white', padding:'30px', borderRadius:'50%', border:'none'}}><Camera size={30}/></button>
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
                }} className="navbar" style={{width:'100%', color:'white', padding:'12px', border:'none', borderRadius:'8px', marginTop:'10px'}}>TOMAR FOTO</button>
              </div>
            )}
            {photo && (
              <div>
                <img src={photo} style={{width:'100%', borderRadius:'10px'}} />
                <input type="number" value={pesoManual} onChange={e=>setPesoManual(e.target.value)} placeholder="0.00 kg" style={{fontSize:'2rem', textAlign:'center', width:'100%', margin:'10px 0'}} />
                <textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} placeholder="Observaciones..." style={{width:'100%', marginBottom:'10px', padding:'10px'}} />
                <button onClick={guardarControl} disabled={loading} className="navbar" style={{width:'100%', color:'white', padding:'15px', border:'none', borderRadius:'8px', fontWeight:'bold'}}>GUARDAR REGISTRO</button>
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
                  <button onClick={aplicarFiltros} className="navbar" style={{color:'white', border:'none'}}><Search size={14}/></button>
                </div>
                <div style={{display:'flex', gap:'5px', marginTop:'10px'}}>
                  <button onClick={exportarExcel} className="card" style={{flex:1, background:'#28a745', color:'white', border:'none', padding:'8px'}}><Download size={14}/> CSV</button>
                  <button onClick={() => window.print()} className="card" style={{flex:1, background:'#dc3545', color:'white', border:'none', padding:'8px'}}><FileText size={14}/> PDF</button>
                </div>
             </div>
             <div className="card" style={{padding:'5px', overflowX:'auto'}}>
               <table style={{width:'100%', fontSize:'9px', borderCollapse:'collapse'}}>
                  <thead><tr style={{background:'#eee'}}><th>Fecha</th><th>Sede/Usuario</th><th>Peso</th><th>Obs</th><th className="no-print">Ver</th></tr></thead>
                  <tbody>
                    {reportesFiltrados.map(r => (
                      <tr key={r.id} style={{borderBottom:'1px solid #eee'}}>
                        <td style={{padding:'5px'}}>{new Date(r.created_at).toLocaleString()}</td>
                        <td>{r.nombre_sitio}<br/><small>{r.nombre_usuario}</small></td>
                        <td><strong>{r.peso_manual}</strong></td>
                        <td>{r.observaciones}</td>
                        <td className="no-print"><button onClick={()=>{const w=window.open();w.document.write(`<img src="${r.foto_url}" style="width:100%"/>`)}} style={{border:'none', background:'none', color:'#ffc107'}}><ImageIcon size={14}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr style={{background:'#eee', fontWeight:'bold'}}><td colSpan="2">TOTAL:</td><td colSpan="3">{totalPesos.toFixed(2)} kg</td></tr></tfoot>
               </table>
             </div>
          </div>
        )}

        {view === 'usuarios' && (
          <div style={{padding:'10px'}}>
            <form onSubmit={gestionarUsuario} className="card" style={{padding:'15px', marginBottom:'15px'}}>
              <h4>{editMode ? 'Editar' : 'Nuevo'} Usuario</h4>
              <input value={nuevoUsuario.nombre} onChange={e=>setNuevoUsuario({...nuevoUsuario, nombre:e.target.value})} placeholder="Nombre" required />
              <input value={nuevoUsuario.email} onChange={e=>setNuevoUsuario({...nuevoUsuario, email:e.target.value})} placeholder="Email" required disabled={editMode} />
              <input value={nuevoUsuario.password} onChange={e=>setNuevoUsuario({...nuevoUsuario, password:e.target.value})} placeholder="Clave" required />
              <select value={nuevoUsuario.sitio_id} onChange={e=>setNuevoUsuario({...nuevoUsuario, sitio_id:e.target.value})} required>
                <option value="">Sede...</option>
                {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <button className="navbar" style={{color:'white', width:'100%', padding:'10px', marginTop:'10px', border:'none'}}>{editMode ? 'Actualizar' : 'Crear'}</button>
            </form>
            <div className="card" style={{overflowX:'auto'}}>
              <table style={{width:'100%', fontSize:'11px'}}>
                {usuarios.map(u => (
                  <tr key={u.email} style={{borderBottom:'1px solid #eee'}}>
                    <td style={{padding:'10px'}}>{u.nombre}<br/><small>{u.nombre_sitio}</small></td>
                    <td><button onClick={()=>{setNuevoUsuario(u); setEditMode(true);}} style={{color:'blue', border:'none', background:'none'}}><Edit size={14}/></button></td>
                  </tr>
                ))}
              </table>
            </div>
          </div>
        )}

        {view === 'sedes' && (
          <div style={{padding:'10px'}}>
            <form onSubmit={gestionarSede} className="card" style={{padding:'15px', marginBottom:'15px'}}>
              <h4>Nueva Sede</h4>
              <input value={nuevoSitio.nombre} onChange={e=>setNuevoSitio({...nuevoSitio, nombre:e.target.value})} placeholder="Nombre Sede" required />
              <input value={nuevoSitio.ciudad} onChange={e=>setNuevoSitio({...nuevoSitio, ciudad:e.target.value})} placeholder="Ciudad" required />
              <button className="navbar" style={{color:'white', width:'100%', padding:'10px', marginTop:'10px', border:'none'}}>Crear Sede</button>
            </form>
            <div className="card">
              {sitios.map(s => (
                <div key={s.id} style={{padding:'10px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}>
                  <span>{s.nombre} ({s.ciudad})</span>
                  <button onClick={()=>eliminarSede(s.id)} style={{color:'red', border:'none', background:'none'}}><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'historial' && (
          <div style={{padding:'5px'}}>
            {reportesFiltrados.map(r => (
              <div key={r.id} className="card" style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', padding:'10px'}}>
                <div style={{textAlign:'left'}}><strong>{r.nombre_sitio}</strong><br/><span style={{color:'#ffc107'}}>{r.peso_manual} kg</span><br/><small>{new Date(r.created_at).toLocaleString()}</small></div>
                <button onClick={()=>{const w=window.open();w.document.write(`<img src="${r.foto_url}" style="width:100%"/>`)}} style={{background:'none', border:'none', color:'#ffc107'}}><ImageIcon/></button>
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