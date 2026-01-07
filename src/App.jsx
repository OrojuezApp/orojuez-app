import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './style.css'; 
import { Camera, LogOut, Eye, Users, FileText, Download, RefreshCw, Search, Image as ImageIcon, Trash2, Edit, Save, MapPin } from 'lucide-react';

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
  
  // Filtros
  const [filtroSede, setFiltroSede] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // Gestión
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', nombre: '', sitio_id: '', rol: 'operador', password: '' });
  const [nuevoSitio, setNuevoSitio] = useState({ nombre: '', ciudad: '' });

  // Captura
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
      if (s) setSitios(s);
      if (u) setUsuarios(u);

      let query = supabase.from('reportes_pesaje').select('*').order('created_at', { ascending: false });
      if (!['admin', 'superadmin', 'auditor'].includes(user?.rol)) {
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
    if (filtroSede) temp = temp.filter(r => String(r.sitio_id) === String(filtroSede));
    if (filtroUsuario) temp = temp.filter(r => r.usuario_email === filtroUsuario);
    if (fechaInicio) temp = temp.filter(r => r.created_at >= fechaInicio);
    if (fechaFin) temp = temp.filter(r => r.created_at <= fechaFin + 'T23:59:59');
    setReportesFiltrados(temp);
  };

  const totalPesos = reportesFiltrados.reduce((sum, r) => sum + (parseFloat(r.peso_manual) || 0), 0);

  const gestionarUsuario = async (e) => {
    e.preventDefault();
    const s = sitios.find(x => String(x.id) === String(nuevoUsuario.sitio_id));
    const payload = { ...nuevoUsuario, nombre_sitio: s?.nombre, ciudad: s?.ciudad };
    
    let error;
    if (editMode) {
      const { error: err } = await supabase.from('perfiles_usuarios').update(payload).eq('email', nuevoUsuario.email);
      error = err;
    } else {
      const { error: err } = await supabase.from('perfiles_usuarios').insert([payload]);
      error = err;
    }

    if(!error) {
      alert(editMode ? "Usuario Actualizado" : "Usuario Creado");
      setEditMode(false);
      setNuevoUsuario({ email: '', nombre: '', sitio_id: '', rol: 'operador', password: '' });
      cargarDatos();
    } else alert(error.message);
  };

  const prepararEdicion = (u) => {
    setNuevoUsuario(u);
    setEditMode(true);
    setView('usuarios');
  };

  const guardarControl = async () => {
    if (!photo || !pesoManual) return alert("Falta foto o peso.");
    setLoading(true);
    const { error } = await supabase.from('reportes_pesaje').insert([{
      sitio_id: user.sitio_id,
      nombre_sitio: user.nombre_sitio,
      usuario_email: user.email,
      nombre_usuario: user.nombre,
      peso_manual: parseFloat(pesoManual),
      foto_url: photo,
      observaciones: observaciones
    }]);
    if (!error) {
      alert("¡Guardado!"); setPhoto(null); setPesoManual(''); setObservaciones('');
      await cargarDatos(); setView('historial');
    }
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
      if (data) { setUser(data); setView('dashboard'); } else alert("Error de acceso");
    }
  };

  if (view === 'login') return (
    <div className="container" style={{padding:'40px 20px', maxWidth:'400px', margin:'auto'}}>
      <div className="navbar"><h1>ORO JUEZ V6.2</h1></div>
      <form onSubmit={handleLogin} style={{marginTop:'30px', display:'flex', flexDirection:'column', gap:'15px'}}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Clave" required />
        <button className="navbar" style={{color:'white', padding:'15px', borderRadius:'8px', fontWeight:'bold'}}>ENTRAR</button>
      </form>
    </div>
  );

  return (
    <div className="container">
      <div className="navbar" style={{display:'flex', justifyContent:'space-between', padding:'10px 20px'}}>
        <span style={{fontSize:'12px'}}>{user?.nombre} ({user?.rol})</span>
        <div style={{display:'flex', gap:'15px'}}>
          <button onClick={cargarDatos} style={{background:'none', border:'none', color:'white'}}><RefreshCw size={18}/></button>
          <button onClick={() => setView('login')} style={{color:'white', background:'none', border:'none'}}><LogOut size={18}/></button>
        </div>
      </div>

      <div style={{display:'flex', gap:'5px', margin:'10px', overflowX:'auto', paddingBottom:'5px'}}>
        <button onClick={() => {setView('dashboard'); setEditMode(false);}} className="card" style={{padding:'10px', flex:'0 0 auto', fontSize:'11px', border:view==='dashboard'?'2px solid #ffc107':'none'}}>CAPTURA</button>
        <button onClick={() => setView('historial')} className="card" style={{padding:'10px', flex:'0 0 auto', fontSize:'11px', border:view==='historial'?'2px solid #ffc107':'none'}}>HISTORIAL</button>
        {['admin', 'superadmin'].includes(user?.rol) && (
          <>
            <button onClick={() => setView('reportes')} className="card" style={{padding:'10px', flex:'0 0 auto', fontSize:'11px', border:view==='reportes'?'2px solid #ffc107':'none'}}>REPORTES</button>
            <button onClick={() => setView('usuarios')} className="card" style={{padding:'10px', flex:'0 0 auto', fontSize:'11px', border:view==='usuarios'?'2px solid #ffc107':'none'}}>USUARIOS</button>
            <button onClick={() => setView('sedes')} className="card" style={{padding:'10px', flex:'0 0 auto', fontSize:'11px', border:view==='sedes'?'2px solid #ffc107':'none'}}>SEDES</button>
          </>
        )}
      </div>

      <div className="content-box">
        {view === 'dashboard' && (
          <div className="card" style={{padding:'15px'}}>
            {!photo && !streaming && (
              <button onClick={()=>{setStreaming(true); navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s=>videoRef.current.srcObject=s)}} className="navbar" style={{color:'white', padding:'30px', borderRadius:'50%'}}><Camera size={30}/></button>
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
                }} className="navbar" style={{width:'100%', color:'white', padding:'12px', marginTop:'10px'}}>TOMAR FOTO</button>
              </div>
            )}
            {photo && (
              <div>
                <img src={photo} style={{width:'100%', borderRadius:'10px'}} />
                <input type="number" value={pesoManual} onChange={e=>setPesoManual(e.target.value)} placeholder="0.00 kg" style={{fontSize:'2rem', textAlign:'center', width:'100%', margin:'10px 0'}} />
                <textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} placeholder="Notas..." style={{width:'100%', marginBottom:'10px'}} />
                <button onClick={guardarControl} className="navbar" style={{width:'100%', color:'white', padding:'15px', borderRadius:'8px'}}>GUARDAR</button>
                <button onClick={()=>setPhoto(null)} style={{width:'100%', marginTop:'5px', background:'none', border:'none', fontSize:'11px'}}>Repetir</button>
              </div>
            )}
          </div>
        )}

        {view === 'historial' && (
          <div style={{padding:'5px'}}>
            {reportesFiltrados.map(r => (
              <div key={r.id} className="card" style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', padding:'10px'}}>
                <div style={{textAlign:'left'}}>
                  <strong style={{fontSize:'12px'}}>{r.nombre_sitio}</strong><br/>
                  <span style={{color:'#ffc107', fontWeight:'bold'}}>{r.peso_manual} kg</span><br/>
                  <small style={{fontSize:'10px'}}>{new Date(r.created_at).toLocaleString()}</small>
                </div>
                <button onClick={()=>{const w=window.open();w.document.write(`<img src="${r.foto_url}" style="width:100%"/>`)}} className="navbar" style={{color:'white', padding:'8px', borderRadius:'5px'}}><ImageIcon size={18}/></button>
              </div>
            ))}
          </div>
        )}

        {view === 'reportes' && (
          <div style={{padding:'5px'}}>
             <div className="card" style={{padding:'10px', marginBottom:'10px'}}>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px'}}>
                  <input type="date" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} style={{fontSize:'11px'}} />
                  <input type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} style={{fontSize:'11px'}} />
                  <select value={filtroSede} onChange={e=>setFiltroSede(e.target.value)} style={{fontSize:'11px'}}>
                    <option value="">Todas las Sedes</option>
                    {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                  <button onClick={aplicarFiltros} className="navbar" style={{color:'white'}}><Search size={14}/></button>
                </div>
             </div>
             <div className="card" style={{overflowX:'auto', padding:'5px'}}>
               <table style={{width:'100%', fontSize:'10px', borderCollapse:'collapse'}}>
                  <thead><tr style={{background:'#eee'}}><th>Fecha/User</th><th>Sede</th><th>Peso</th><th>Ver</th></tr></thead>
                  <tbody>
                    {reportesFiltrados.map(r => (
                      <tr key={r.id} style={{borderBottom:'1px solid #eee'}}>
                        <td>{new Date(r.created_at).toLocaleDateString()}<br/>{r.nombre_usuario}</td>
                        <td>{r.nombre_sitio}</td>
                        <td><strong>{r.peso_manual}</strong></td>
                        <td><button onClick={()=>{const w=window.open();w.document.write(`<img src="${r.foto_url}" style="width:100%"/>`)}} style={{border:'none', color:'#ffc107', background:'none'}}><ImageIcon size={14}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr style={{background:'#eee', fontWeight:'bold'}}><td colSpan="2">TOTAL:</td><td colSpan="2">{totalPesos.toFixed(2)} kg</td></tr></tfoot>
               </table>
             </div>
          </div>
        )}

        {view === 'usuarios' && (
          <div style={{padding:'10px'}}>
            <form onSubmit={gestionarUsuario} className="card" style={{padding:'15px', marginBottom:'20px', border: editMode ? '2px solid #ffc107' : 'none'}}>
              <h4>{editMode ? 'Editar Usuario' : 'Nuevo Usuario'}</h4>
              <input value={nuevoUsuario.nombre} onChange={e=>setNuevoUsuario({...nuevoUsuario, nombre:e.target.value})} placeholder="Nombre" required />
              <input value={nuevoUsuario.email} onChange={e=>setNuevoUsuario({...nuevoUsuario, email:e.target.value})} placeholder="Email" required disabled={editMode} />
              <input value={nuevoUsuario.password} onChange={e=>setNuevoUsuario({...nuevoUsuario, password:e.target.value})} placeholder="Clave" required />
              <select value={nuevoUsuario.rol} onChange={e=>setNuevoUsuario({...nuevoUsuario, rol:e.target.value})}>
                <option value="operador">Operador</option>
                <option value="admin">Administrador</option>
                <option value="auditor">Auditor</option>
              </select>
              <select value={nuevoUsuario.sitio_id} onChange={e=>setNuevoUsuario({...nuevoUsuario, sitio_id:e.target.value})} required>
                <option value="">Seleccionar Sede</option>
                {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <button type="submit" className="navbar" style={{color:'white', width:'100%', padding:'10px', marginTop:'10px'}}>
                {editMode ? 'GUARDAR CAMBIOS' : 'CREAR'}
              </button>
              {editMode && <button onClick={()=>{setEditMode(false); setNuevoUsuario({email:'', nombre:'', sitio_id:'', rol:'operador', password:''});}} style={{width:'100%', marginTop:'5px', background:'none', border:'none', fontSize:'12px'}}>Cancelar</button>}
            </form>
            <div className="card" style={{padding:'10px', overflowX:'auto'}}>
              <table style={{width:'100%', fontSize:'11px', textAlign:'left'}}>
                <thead><tr style={{background:'#eee'}}><th>Nombre</th><th>Sede</th><th>Acción</th></tr></thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.email} style={{borderBottom:'1px solid #eee'}}>
                      <td>{u.nombre}<br/><span style={{fontSize:'9px', color:'gray'}}>{u.rol}</span></td>
                      <td>{u.nombre_sitio}</td>
                      <td style={{display:'flex', gap:'5px'}}>
                        <button onClick={()=>prepararEdicion(u)} style={{color:'blue', border:'none', background:'none'}}><Edit size={14}/></button>
                        <button onClick={async()=>{if(confirm('¿Eliminar?')){await supabase.from('perfiles_usuarios').delete().eq('email',u.email); cargarDatos();}}} style={{color:'red', border:'none', background:'none'}}><Trash2 size={14}/></button>
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
            <form onSubmit={async (e) => {
              e.preventDefault();
              await supabase.from('sitios').insert([nuevoSitio]);
              alert("Sede Creada"); cargarDatos(); setNuevoSitio({ nombre:'', ciudad:'' });
            }} className="card" style={{padding:'15px', marginBottom:'20px'}}>
              <h4>Nueva Sede</h4>
              <input value={nuevoSitio.nombre} onChange={e=>setNuevoSitio({...nuevoSitio, nombre:e.target.value})} placeholder="Nombre Sede" required />
              <input value={nuevoSitio.ciudad} onChange={e=>setNuevoSitio({...nuevoSitio, ciudad:e.target.value})} placeholder="Ciudad" required />
              <button type="submit" className="navbar" style={{color:'white', width:'100%', padding:'10px', marginTop:'10px'}}>CREAR SEDE</button>
            </form>
            <div className="card" style={{padding:'10px', overflowX:'auto'}}>
              <table style={{width:'100%', fontSize:'11px', textAlign:'left'}}>
                <thead><tr style={{background:'#eee'}}><th>Sede</th><th>Ciudad</th><th>Acción</th></tr></thead>
                <tbody>
                  {sitios.map(s => (
                    <tr key={s.id} style={{borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'5px'}}>{s.nombre}</td>
                      <td>{s.ciudad}</td>
                      <td><button onClick={async()=>{if(confirm('¿Eliminar sede?')){await supabase.from('sitios').delete().eq('id',s.id); cargarDatos();}}} style={{color:'red', border:'none', background:'none'}}><Trash2 size={14}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{display:'none'}} width="640" height="480" />
    </div>
  );
};

export default OroJuezApp;