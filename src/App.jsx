import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './style.css'; 
import { Camera, LogOut, Eye, Users, FileText, Download, RefreshCw, Search, Image as ImageIcon, MapPin, PlusCircle } from 'lucide-react';

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
  
  // Filtros
  const [filtroSede, setFiltroSede] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Gestión (Admin)
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
      const { data: s } = await supabase.from('sitios').select('*').order('ciudad');
      const { data: u } = await supabase.from('perfiles_usuarios').select('*');
      if (s) setSitios(s);
      if (u) setUsuarios(u);

      let query = supabase.from('reportes_pesaje').select('*').order('created_at', { ascending: false });
      if (!['admin', 'superadmin', 'auditor'].includes(user.rol)) {
        query = query.eq('usuario_email', user.email);
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

  const abrirFoto = (base64) => {
    const win = window.open();
    win.document.write(`<img src="${base64}" style="width:100%" />`);
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
      <div className="navbar"><h1>ORO JUEZ V6.0</h1></div>
      <form onSubmit={handleLogin} style={{marginTop:'30px', display:'flex', flexDirection:'column', gap:'15px'}}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Clave" required />
        <button className="navbar" style={{color:'white', padding:'15px', borderRadius:'8px'}}>ENTRAR</button>
      </form>
    </div>
  );

  return (
    <div className="container">
      <div className="navbar" style={{display:'flex', justifyContent:'space-between', padding:'10px 20px'}}>
        <span style={{fontSize:'12px'}}>{user.nombre}</span>
        <div style={{display:'flex', gap:'15px'}}>
          <button onClick={cargarDatos} style={{background:'none', border:'none', color:'white'}}><RefreshCw size={18}/></button>
          <button onClick={() => setView('login')} style={{color:'white', background:'none', border:'none'}}><LogOut size={18}/></button>
        </div>
      </div>

      <div style={{display:'flex', gap:'5px', margin:'10px', overflowX:'auto', paddingBottom:'5px'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{padding:'10px', flex:'0 0 auto', fontSize:'11px'}}>CAPTURA</button>
        <button onClick={() => setView('historial')} className="card" style={{padding:'10px', flex:'0 0 auto', fontSize:'11px'}}>HISTORIAL</button>
        {['admin', 'superadmin'].includes(user.rol) && (
          <>
            <button onClick={() => setView('reportes')} className="card" style={{padding:'10px', flex:'0 0 auto', fontSize:'11px'}}>REPORTES</button>
            <button onClick={() => setView('usuarios')} className="card" style={{padding:'10px', flex:'0 0 auto', fontSize:'11px'}}>USUARIOS</button>
            <button onClick={() => setView('sedes')} className="card" style={{padding:'10px', flex:'0 0 auto', fontSize:'11px'}}>SEDES</button>
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
              </div>
            )}
          </div>
        )}

        {view === 'historial' && (
          <div style={{padding:'5px'}}>
            {reportesFiltrados.map(r => (
              <div key={r.id} className="card" style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', padding:'10px', textAlign:'left'}}>
                <div>
                  <strong>{r.nombre_sitio}</strong><br/>
                  <span style={{color:'#ffc107', fontWeight:'bold'}}>{r.peso_manual} kg</span><br/>
                  <small style={{fontSize:'10px'}}>{new Date(r.created_at).toLocaleString()}</small>
                </div>
                <button onClick={()=>abrirFoto(r.foto_url)} className="navbar" style={{color:'white', padding:'8px', borderRadius:'5px'}}><ImageIcon size={18}/></button>
              </div>
            ))}
          </div>
        )}

        {view === 'reportes' && (
          <div style={{padding:'5px'}}>
             <div className="card" style={{padding:'10px', marginBottom:'10px'}}>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px'}}>
                  <input type="date" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} />
                  <input type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} />
                  <select value={filtroSede} onChange={e=>setFiltroSede(e.target.value)}>
                    <option value="">Todas las Sedes</option>
                    {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                  <button onClick={aplicarFiltros} className="navbar" style={{color:'white'}}><Search size={14}/></button>
                </div>
             </div>
             <table style={{width:'100%', fontSize:'10px', background:'white', borderRadius:'8px'}}>
                <thead><tr style={{background:'#eee'}}><th>Fecha/User</th><th>Sede</th><th>Peso</th><th>Ver</th></tr></thead>
                <tbody>
                  {reportesFiltrados.map(r => (
                    <tr key={r.id} style={{borderBottom:'1px solid #eee'}}>
                      <td>{new Date(r.created_at).toLocaleDateString()}<br/>{r.nombre_usuario}</td>
                      <td>{r.nombre_sitio}</td>
                      <td>{r.peso_manual}</td>
                      <td><button onClick={()=>abrirFoto(r.foto_url)} style={{border:'none', color:'#ffc107'}}><ImageIcon size={14}/></button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr style={{background:'#eee', fontWeight:'bold'}}><td colSpan="2">TOTAL:</td><td colSpan="2">{totalPesos.toFixed(2)} kg</td></tr></tfoot>
             </table>
          </div>
        )}

        {view === 'usuarios' && (
          <div style={{padding:'10px'}}>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const s = sitios.find(x => x.id === nuevoUsuario.sitio_id);
              await supabase.from('perfiles_usuarios').insert([{ ...nuevoUsuario, nombre_sitio: s?.nombre, ciudad: s?.ciudad }]);
              alert("Usuario Creado"); cargarDatos();
            }} className="card" style={{padding:'15px'}}>
              <input value={nuevoUsuario.nombre} onChange={e=>setNuevoUsuario({...nuevoUsuario, nombre:e.target.value})} placeholder="Nombre" required />
              <input value={nuevoUsuario.email} onChange={e=>setNuevoUsuario({...nuevoUsuario, email:e.target.value})} placeholder="Email" required />
              <input value={nuevoUsuario.password} onChange={e=>setNuevoUsuario({...nuevoUsuario, password:e.target.value})} placeholder="Password" required />
              <select value={nuevoUsuario.sitio_id} onChange={e=>setNuevoUsuario({...nuevoUsuario, sitio_id:e.target.value})} required>
                <option value="">Seleccionar Sede</option>
                {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <button type="submit" className="navbar" style={{color:'white', width:'100%', padding:'10px', marginTop:'10px'}}>CREAR USUARIO</button>
            </form>
          </div>
        )}

        {view === 'sedes' && (
          <div style={{padding:'10px'}}>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await supabase.from('sitios').insert([nuevoSitio]);
              alert("Sede Creada"); cargarDatos();
            }} className="card" style={{padding:'15px'}}>
              <input value={nuevoSitio.nombre} onChange={e=>setNuevoSitio({...nuevoSitio, nombre:e.target.value})} placeholder="Nombre Sede" required />
              <input value={nuevoSitio.ciudad} onChange={e=>setNuevoSitio({...nuevoSitio, ciudad:e.target.value})} placeholder="Ciudad" required />
              <button type="submit" className="navbar" style={{color:'white', width:'100%', padding:'10px', marginTop:'10px'}}>CREAR SEDE</button>
            </form>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{display:'none'}} width="640" height="480" />
    </div>
  );
};

export default OroJuezApp;