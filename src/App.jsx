import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './style.css'; 
import { Camera, LogOut, Eye, Trash2, Users, MapPin, FileText, Download, Filter, Search, RefreshCw } from 'lucide-react';

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
  
  // Estados de Filtros
  const [filtroSede, setFiltroSede] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Estados de Operación
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
      // 1. Cargar Sedes y Usuarios
      const { data: s } = await supabase.from('sitios').select('*').order('ciudad');
      const { data: u } = await supabase.from('perfiles_usuarios').select('*');
      if (s) setSitios(s);
      if (u) setUsuarios(u);

      // 2. Consulta de Historial con Lógica de Roles
      let query = supabase.from('reportes_pesaje').select('*').order('created_at', { ascending: false });
      
      // Si no es admin/superadmin/auditor, filtrar solo sus registros
      const rolesAdmin = ['admin', 'superadmin', 'auditor'];
      if (!rolesAdmin.includes(user.rol)) {
        query = query.eq('usuario_email', user.email);
      }
      
      const { data: r, error } = await query;
      if (error) throw error;
      
      setReportes(r || []);
      setReportesFiltrados(r || []);
    } catch (err) {
      console.error("Error cargando datos:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let temp = [...reportes];
    if (filtroSede) temp = temp.filter(r => String(r.sitio_id) === String(filtroSede));
    if (filtroUsuario) temp = temp.filter(r => r.usuario_email === filtroUsuario);
    if (fechaInicio) temp = temp.filter(r => r.created_at >= fechaInicio);
    if (fechaFin) temp = temp.filter(r => r.created_at <= fechaFin + 'T23:59:59');
    setReportesFiltrados(temp);
  };

  const exportarExcel = () => {
    const encabezados = "Fecha,Sede,Ciudad,Usuario,Peso(kg),Observaciones\n";
    const filas = reportesFiltrados.map(r => 
      `${new Date(r.created_at).toLocaleString().replace(',', ' ')},${r.nombre_sitio},${r.ciudad},${r.nombre_usuario},${r.peso_manual},${r.observaciones || ''}`
    ).join("\n");
    const blob = new Blob([encabezados + filas], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_OroJuez_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const guardarControl = async () => {
    if (!photo || !pesoManual) return alert("Complete foto y peso.");
    setLoading(true);
    
    const registro = {
      sitio_id: user.sitio_id,
      nombre_sitio: user.nombre_sitio || 'Sede',
      ciudad: user.ciudad || 'N/A',
      usuario_email: user.email,
      nombre_usuario: user.nombre,
      peso_manual: parseFloat(pesoManual),
      foto_url: photo,
      observaciones: observaciones
    };

    const { error } = await supabase.from('reportes_pesaje').insert([registro]);

    if (!error) {
      alert("Registro guardado con éxito");
      setPhoto(null); setPesoManual(''); setObservaciones('');
      await cargarDatos();
      setView('historial');
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim().toLowerCase();
    const password = e.target.password.value.trim();
    
    if (email === 'industria.orojuez@gmail.com' && password === 'admin123') {
      setUser({ email, nombre: 'Super Admin', rol: 'admin' });
      setView('dashboard');
    } else {
      const { data } = await supabase.from('perfiles_usuarios').select('*').eq('email', email).eq('password', password).single();
      if (data) { setUser(data); setView('dashboard'); } else alert("Credenciales incorrectas");
    }
  };

  if (view === 'login') return (
    <div className="container" style={{padding:'40px 20px', maxWidth:'400px', margin:'auto'}}>
      <div className="navbar"><h1>ORO JUEZ V5.5</h1></div>
      <form onSubmit={handleLogin} style={{marginTop:'30px', display:'flex', flexDirection:'column', gap:'15px'}}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Contraseña" required />
        <button className="navbar" style={{color:'white', border:'none', padding:'15px', borderRadius:'8px', fontWeight:'bold'}}>INGRESAR</button>
      </form>
    </div>
  );

  return (
    <div className="container">
      <div className="navbar" style={{display:'flex', justifyContent:'space-between', padding:'10px 20px'}}>
        <span>{user.nombre} ({user.rol})</span>
        <div style={{display:'flex', gap:'10px'}}>
          <button onClick={cargarDatos} style={{background:'none', border:'none', color:'white'}}><RefreshCw size={20} className={loading ? 'spin' : ''}/></button>
          <button onClick={() => setView('login')} style={{color:'white', background:'none', border:'none'}}><LogOut/></button>
        </div>
      </div>

      <div style={{display:'flex', gap:'5px', margin:'10px', overflowX:'auto'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{padding:'10px', flex:1, border:view==='dashboard'?'2px solid #ffc107':'none'}}>CAPTURA</button>
        <button onClick={() => setView('historial')} className="card" style={{padding:'10px', flex:1, border:view==='historial'?'2px solid #ffc107':'none'}}>HISTORIAL</button>
        {['admin', 'superadmin', 'auditor'].includes(user.rol) && (
          <>
            <button onClick={() => setView('reportes')} className="card" style={{padding:'10px', flex:1, border:view==='reportes'?'2px solid #ffc107':'none'}}><FileText size={18}/></button>
            <button onClick={() => setView('usuarios')} className="card" style={{padding:'10px', border:view==='usuarios'?'2px solid #ffc107':'none'}}><Users size={18}/></button>
          </>
        )}
      </div>

      <div className="content-box">
        {view === 'dashboard' && (
          <div className="card" style={{padding:'20px'}}>
            {!photo && !streaming && (
              <button onClick={()=>{setStreaming(true); navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s=>videoRef.current.srcObject=s)}} className="navbar" style={{color:'white', padding:'40px', borderRadius:'50%'}}><Camera size={40}/></button>
            )}
            {streaming && (
              <div>
                <video ref={videoRef} autoPlay playsInline style={{width:'100%', borderRadius:'15px'}} />
                <button onClick={() => {
                  const canvas = canvasRef.current;
                  canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 640, 480);
                  setPhoto(canvas.toDataURL('image/jpeg'));
                  setStreaming(false);
                  videoRef.current.srcObject.getTracks().forEach(t => t.stop());
                }} className="navbar" style={{width:'100%', color:'white', padding:'15px', marginTop:'10px', borderRadius:'10px'}}>TOMAR FOTO</button>
              </div>
            )}
            {photo && (
              <div>
                <img src={photo} style={{width:'100%', borderRadius:'15px'}} />
                <input type="number" value={pesoManual} onChange={e=>setPesoManual(e.target.value)} placeholder="0.00 kg" style={{fontSize:'2.5rem', textAlign:'center', width:'100%', margin:'15px 0', border:'2px solid #ffc107', borderRadius:'10px'}} />
                <textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} placeholder="Observaciones..." style={{width:'100%', padding:'10px', borderRadius:'8px', marginBottom:'10px'}} />
                <button onClick={guardarControl} disabled={loading} className="navbar" style={{width:'100%', color:'white', padding:'20px', borderRadius:'10px', fontWeight:'bold'}}>GUARDAR PESAJE</button>
                <button onClick={()=>setPhoto(null)} style={{width:'100%', marginTop:'10px', background:'none', border:'none', textDecoration:'underline'}}>Repetir Foto</button>
              </div>
            )}
          </div>
        )}

        {view === 'historial' && (
          <div style={{padding:'10px'}}>
            {reportesFiltrados.length === 0 ? <p>No se encontraron registros.</p> : 
              reportesFiltrados.map(r => (
                <div key={r.id} className="card" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', padding:'15px', textAlign:'left'}}>
                  <div>
                    <strong>{r.nombre_sitio}</strong><br/>
                    <span style={{fontSize:'1.3rem', color:'#ffc107', fontWeight:'bold'}}>{r.peso_manual} kg</span><br/>
                    <small>{new Date(r.created_at).toLocaleString()}</small>
                  </div>
                  <button onClick={()=>window.open(r.foto_url)} className="navbar" style={{color:'white', padding:'10px', borderRadius:'8px'}}><Eye/></button>
                </div>
              ))
            }
          </div>
        )}

        {view === 'reportes' && (
          <div style={{padding:'10px'}}>
             <div className="card" style={{padding:'15px', textAlign:'left', marginBottom:'15px'}}>
                <h4>Filtros de Reporte</h4>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginTop:'10px'}}>
                  <input type="date" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} />
                  <input type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} />
                  <select value={filtroSede} onChange={e=>setFiltroSede(e.target.value)}>
                    <option value="">Todas las Sedes</option>
                    {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                  <select value={filtroUsuario} onChange={e=>setFiltroUsuario(e.target.value)}>
                    <option value="">Todos los Usuarios</option>
                    {usuarios.map(u => <option key={u.email} value={u.email}>{u.nombre}</option>)}
                  </select>
                  <button onClick={aplicarFiltros} className="navbar" style={{color:'white', gridColumn:'span 2', padding:'10px', borderRadius:'8px'}}>APLICAR FILTROS</button>
                </div>
                <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                  <button onClick={exportarExcel} style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid #28a745', color:'#28a745'}}><Download size={16}/> EXCEL</button>
                  <button onClick={()=>window.print()} style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid #007bff', color:'#007bff'}}><FileText size={16}/> PDF</button>
                </div>
             </div>
             <div className="card" style={{overflowX:'auto'}}>
                <table style={{width:'100%', fontSize:'12px', textAlign:'left', borderCollapse:'collapse'}}>
                    <thead><tr style={{background:'#eee'}}><th>Fecha</th><th>Sede</th><th>Usuario</th><th>Peso</th></tr></thead>
                    <tbody>
                        {reportesFiltrados.map(r => (
                            <tr key={r.id} style={{borderBottom:'1px solid #eee'}}>
                                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                <td>{r.nombre_sitio}</td>
                                <td>{r.nombre_usuario}</td>
                                <td>{r.peso_manual}kg</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          </div>
        )}

        {view === 'usuarios' && (
          <div style={{padding:'10px'}}>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const s = sitios.find(x => x.id === nuevoUsuario.sitio_id);
              await supabase.from('perfiles_usuarios').insert([{ 
                ...nuevoUsuario, 
                nombre_sitio: s?.nombre || '', 
                ciudad: s?.ciudad || '' 
              }]);
              setNuevoUsuario({ email: '', nombre: '', sitio_id: '', rol: 'operador', password: '' });
              cargarDatos();
              alert("Usuario creado");
            }} className="card" style={{padding:'15px', textAlign:'left'}}>
              <h4>Nuevo Operador</h4>
              <input value={nuevoUsuario.nombre} onChange={e=>setNuevoUsuario({...nuevoUsuario, nombre:e.target.value})} placeholder="Nombre" required />
              <input value={nuevoUsuario.email} onChange={e=>setNuevoUsuario({...nuevoUsuario, email:e.target.value})} placeholder="Email" required />
              <input value={nuevoUsuario.password} onChange={e=>setNuevoUsuario({...nuevoUsuario, password:e.target.value})} placeholder="Contraseña" required />
              <select value={nuevoUsuario.sitio_id} onChange={e=>setNuevoUsuario({...nuevoUsuario, sitio_id:e.target.value})} required style={{width:'100%', padding:'10px', margin:'10px 0'}}>
                <option value="">-- Seleccionar Sede --</option>
                {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <button type="submit" className="navbar" style={{color:'white', width:'100%', padding:'12px', borderRadius:'8px'}}>CREAR USUARIO</button>
            </form>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{display:'none'}} width="640" height="480" />
    </div>
  );
};

export default OroJuezApp;