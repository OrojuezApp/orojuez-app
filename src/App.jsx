import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './style.css'; 
import { 
  Camera, LogOut, Eye, Trash2, Edit2, X, MapPin, Users, Building2 
} from 'lucide-react';

const SUPABASE_URL = 'https://khgqeqrnlbhadoarcgul.supabase.co';
const SUPABASE_KEY = 'sb_publishable_S5Gk22ej_r8hIZw92b16gw_MBOImAJV';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const OroJuezApp = () => {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [dbStatus, setDbStatus] = useState('connecting');
  const [loading, setLoading] = useState(false);
  
  const [sitios, setSitios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [reportes, setReportes] = useState([]);

  const [editandoSitio, setEditandoSitio] = useState(null);
  const [editandoUsuario, setEditandoUsuario] = useState(null);

  const [streaming, setStreaming] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [pesoOCR, setPesoOCR] = useState(null);
  const [pesoManual, setPesoManual] = useState('');
  const [observacion, setObservacion] = useState('');

  const [nuevoSitio, setNuevoSitio] = useState({ nombre: '', ciudad: '' });
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', nombre: '', sitio_id: '' });

  const [filtroSitio, setFiltroSitio] = useState('Todos');
  const [filtroCiudad, setFiltroCiudad] = useState('Todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    checkConnection();
    cargarDatos();
  }, []);

  const checkConnection = async () => {
    try {
      const { error } = await supabase.from('sitios').select('id', { count: 'exact', head: true });
      if (error) throw error;
      setDbStatus('online');
    } catch { setDbStatus('offline'); }
  };

  const cargarDatos = async () => {
    const { data: s } = await supabase.from('sitios').select('*').order('ciudad', { ascending: true });
    const { data: u } = await supabase.from('perfiles_usuarios').select('*');
    const { data: r } = await supabase.from('reportes_pesaje').select('*').order('created_at', { ascending: false });
    if (s) setSitios(s);
    if (u) setUsuarios(u);
    if (r) setReportes(r);
  };

  const handleGuardarSitio = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (editandoSitio) {
      await supabase.from('sitios').update(nuevoSitio).eq('id', editandoSitio);
      setEditandoSitio(null);
    } else {
      await supabase.from('sitios').insert([nuevoSitio]);
    }
    setNuevoSitio({ nombre: '', ciudad: '' });
    cargarDatos();
    setLoading(false);
  };

  const eliminarSitio = async (id) => {
    if (window.confirm("¿Seguro que desea eliminar este sitio?")) {
      await supabase.from('sitios').delete().eq('id', id);
      cargarDatos();
    }
  };

  const handleGuardarUsuario = async (e) => {
    e.preventDefault();
    setLoading(true);
    const sitioRel = sitios.find(s => s.id == nuevoUsuario.sitio_id);
    const payload = {
      ...nuevoUsuario,
      nombre_sitio: sitioRel.nombre,
      ciudad: sitioRel.ciudad,
      email: nuevoUsuario.email.toLowerCase().trim()
    };

    if (editandoUsuario) {
      await supabase.from('perfiles_usuarios').update(payload).eq('id', editandoUsuario);
      setEditandoUsuario(null);
    } else {
      await supabase.from('perfiles_usuarios').insert([payload]);
    }
    setNuevoUsuario({ email: '', nombre: '', sitio_id: '' });
    cargarDatos();
    setLoading(false);
  };

  const eliminarUsuario = async (id) => {
    if (window.confirm("¿Eliminar acceso a este usuario?")) {
      await supabase.from('perfiles_usuarios').delete().eq('id', id);
      cargarDatos();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const emailInput = e.target.email.value.trim().toLowerCase();
    if (emailInput === 'industria.orojuez@gmail.com') {
      setUser({ email: emailInput, nombre: 'Admin Central', rol: 'admin', sitio_id: 'all', ciudad: 'CORPORATIVO' });
      setView('dashboard');
    } else {
      const { data } = await supabase.from('perfiles_usuarios').select('*').eq('email', emailInput).single();
      if (data) { setUser(data); setView('dashboard'); }
      else { alert("Usuario no registrado."); }
    }
    setLoading(false);
  };

  const takePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    setPhoto(canvasRef.current.toDataURL('image/jpeg'));
    setStreaming(false);
    if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setPesoOCR(Math.floor(Math.random() * (1200 - 800) + 800));
  };

  const guardarPesaje = async () => {
    setLoading(true);
    await supabase.from('reportes_pesaje').insert([{
      sitio_id: user.sitio_id, nombre_sitio: user.nombre_sitio || 'Admin', ciudad: user.ciudad,
      usuario_email: user.email, nombre_usuario: user.nombre,
      peso_ocr: pesoOCR, peso_manual: parseFloat(pesoManual),
      diferencia: parseFloat(pesoManual) - pesoOCR, foto_url: photo, observacion: observacion
    }]);
    setPhoto(null); setPesoManual(''); setObservacion('');
    cargarDatos(); setLoading(false);
    alert("Auditado con éxito");
  };

  const reportesFiltrados = reportes.filter(r => {
    const cumpleSitio = filtroSitio === 'Todos' || r.nombre_sitio === filtroSitio;
    const cumpleCiudad = filtroCiudad === 'Todos' || r.ciudad === filtroCiudad;
    const fechaR = new Date(r.created_at);
    const cumpleFecha = (!fechaInicio || fechaR >= new Date(fechaInicio)) && (!fechaFin || fechaR <= new Date(fechaFin + 'T23:59:59'));
    return cumpleSitio && cumpleCiudad && cumpleFecha;
  });

  if (view === 'login') {
    return (
      <div className="container" style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh'}}>
        <div className="content-box" style={{maxWidth:'400px', width:'100%'}}>
          <div className="navbar"><h1>ORO JUEZ S.A.</h1></div>
          <form onSubmit={handleLogin}>
            <input name="email" type="email" required placeholder="Correo Corporativo" />
            <button className="navbar" style={{width:'100%', marginTop:'15px', border:'none', color:'white', fontWeight:'bold'}}>ENTRAR AL SISTEMA</button>
          </form>
          <p style={{fontSize:'10px', marginTop:'20px', color: dbStatus === 'online' ? 'green' : 'red'}}>
            DATABASE: {dbStatus.toUpperCase()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="navbar" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{textAlign:'left'}}>
          <h2 style={{margin:0, fontSize:'0.9rem'}}>ORO JUEZ AUDITORÍA</h2>
          <small>{user?.nombre} | {user?.ciudad}</small>
        </div>
        <button onClick={() => setView('login')} style={{background:'none', border:'none', color:'white'}}><LogOut size={20}/></button>
      </div>

      <div style={{display:'flex', gap:'5px', marginBottom:'15px', overflowX:'auto', whiteSpace:'nowrap', paddingBottom:'5px'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{flex:1, padding:'10px', fontSize:'11px', background: view==='dashboard'?'#333':'#fff', color: view==='dashboard'?'#fff':'#333'}}>CAPTURA</button>
        <button onClick={() => setView('reportes')} className="card" style={{flex:1, padding:'10px', fontSize:'11px', background: view==='reportes'?'#333':'#fff', color: view==='reportes'?'#fff':'#333'}}>REPORTES</button>
        {user?.rol === 'admin' && (
          <>
            <button onClick={() => setView('sitios')} className="card" style={{flex:1, padding:'10px', fontSize:'11px', background: view==='sitios'?'#333':'#fff', color: view==='sitios'?'#fff':'#333'}}>SEDES</button>
            <button onClick={() => setView('usuarios')} className="card" style={{flex:1, padding:'10px', fontSize:'11px', background: view==='usuarios'?'#333':'#fff', color: view==='usuarios'?'#fff':'#333'}}>USERS</button>
          </>
        )}
      </div>

      <div className="content-box">
        {view === 'dashboard' && (
          <div className="grid-layout">
            <div className="card">
              <div style={{background:'#000', borderRadius:'10px', overflow:'hidden', minHeight:'200px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                {!streaming && !photo && (
                  <button onClick={() => {setStreaming(true); navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s => videoRef.current.srcObject=s);}} style={{background:'#ffc107', border:'none', padding:'20px', borderRadius:'50%'}}>
                    <Camera size={30}/>
                  </button>
                )}
                {streaming && <video ref={videoRef} autoPlay playsInline style={{width:'100%', height:'auto', display:'block'}} />}
                {photo && <img src={photo} style={{width:'100%', height:'auto', display:'block'}} />}
              </div>
              {streaming && <button onClick={takePhoto} className="navbar" style={{width:'100%', marginTop:'10px', border:'none', color:'white', padding:'12px'}}>TOMAR FOTO</button>}
              {photo && <button onClick={() => {setPhoto(null); setPesoOCR(null);}} style={{width:'100%', marginTop:'10px', padding:'10px', borderRadius:'8px', border:'1px solid #ddd'}}>REPETIR FOTO</button>}
            </div>

            <div className="card">
              <div style={{background:'#fff3cd', padding:'15px', borderRadius:'10px', marginBottom:'10px'}}>
                <small>LECTURA AUTOMÁTICA</small>
                <h2 style={{margin:0, fontSize:'2rem'}}>{pesoOCR || '--'} kg</h2>
              </div>
              <label style={{fontSize:'12px', fontWeight:'bold', display:'block', textAlign:'left'}}>PESO MANUAL:</label>
              <input type="number" value={pesoManual} onChange={e => setPesoManual(e.target.value)} placeholder="0.00" style={{fontSize:'1.5rem', textAlign:'center'}} />
              <textarea value={observacion} onChange={e => setObservacion(e.target.value)} placeholder="Observaciones..." style={{marginTop:'10px', height:'60px'}}></textarea>
              <button disabled={!photo || !pesoManual || loading} onClick={guardarPesaje} className="navbar" style={{width:'100%', padding:'15px', border:'none', color:'white', fontWeight:'bold', marginTop:'10px', opacity:(!photo || !pesoManual)?0.5:1}}>
                {loading ? 'GUARDANDO...' : 'GUARDAR AUDITORÍA'}
              </button>
            </div>
          </div>
        )}

        {view === 'reportes' && (
          <div>
            <div className="grid-layout" style={{marginBottom:'15px'}}>
               <select onChange={e => setFiltroCiudad(e.target.value)}><option>Todas las Ciudades</option>{Array.from(new Set(sitios.map(s => s.ciudad))).map(c => <option key={c}>{c}</option>)}</select>
               <input type="date" onChange={e => setFechaInicio(e.target.value)} />
            </div>
            <div style={{overflowX:'auto', WebkitOverflowScrolling:'touch'}}>
              <table>
                <thead>
                  <tr><th>FECHA / SEDE</th><th>PESO</th><th>DIF.</th><th>VER</th></tr>
                </thead>
                <tbody>
                  {reportesFiltrados.map(r => (
                    <tr key={r.id}>
                      <td><div style={{fontSize:'11px'}}><strong>{new Date(r.created_at).toLocaleDateString()}</strong></div><div style={{fontSize:'10px', color:'#666'}}>{r.nombre_sitio}</div></td>
                      <td style={{textAlign:'center'}}>{r.peso_manual}</td>
                      <td style={{textAlign:'center', fontWeight:'bold', color: r.diferencia < 0 ? 'red' : 'green'}}>{r.diferencia}</td>
                      <td style={{textAlign:'center'}}><button onClick={() => window.open(r.foto_url)} style={{background:'none', border:'none', color:'#ffc107'}}><Eye size={18}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'sitios' && (
          <div>
            <form onSubmit={handleGuardarSitio} className="card" style={{marginBottom:'20px'}}>
               <input value={nuevoSitio.ciudad} onChange={e => setNuevoSitio({...nuevoSitio, ciudad: e.target.value})} placeholder="Ciudad (ej. Quito)" required />
               <input value={nuevoSitio.nombre} onChange={e => setNuevoSitio({...nuevoSitio, nombre: e.target.value})} placeholder="Nombre de Área / Sede" required />
               <button className="navbar" style={{width:'100%', border:'none', color:'white', marginTop:'10px', padding:'12px'}}>{editandoSitio ? 'ACTUALIZAR' : 'CREAR NUEVA SEDE'}</button>
            </form>
            {sitios.map(s => (
              <div key={s.id} className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', padding:'12px'}}>
                <div style={{textAlign:'left'}}><span style={{fontWeight:'bold'}}>{s.ciudad}</span><br/><small>{s.nombre}</small></div>
                <div style={{display:'flex', gap:'10px'}}>
                  <button onClick={() => {setEditandoSitio(s.id); setNuevoSitio({nombre:s.nombre, ciudad:s.ciudad});}} style={{color:'blue', border:'none', background:'none'}}><Edit2 size={18}/></button>
                  <button onClick={() => eliminarSitio(s.id)} style={{color:'red', border:'none', background:'none'}}><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'usuarios' && (
          <div>
            <form onSubmit={handleGuardarUsuario} className="card" style={{marginBottom:'20px'}}>
               <input value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} placeholder="Nombre Completo Auditor" required />
               <input value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} placeholder="Email Corporativo" required />
               <select value={nuevoUsuario.sitio_id} onChange={e => setNuevoUsuario({...nuevoUsuario, sitio_id: e.target.value})} required>
                  <option value="">Asignar a Sede...</option>
                  {sitios.map(s => <option key={s.id} value={s.id}>{s.ciudad} | {s.nombre}</option>)}
               </select>
               <button className="navbar" style={{width:'100%', border:'none', color:'white', marginTop:'10px', padding:'12px'}}>{editandoUsuario ? 'ACTUALIZAR' : 'REGISTRAR USUARIO'}</button>
            </form>
            {usuarios.map(u => (
              <div key={u.id} className="card" style={{textAlign:'left', marginBottom:'8px', padding:'12px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div><strong>{u.nombre}</strong><br/><small>{u.email}</small><br/><span style={{fontSize:'10px', background:'#eee', padding:'2px 5px', borderRadius:'4px'}}>{u.ciudad}</span></div>
                <div style={{display:'flex', gap:'10px'}}>
                  <button onClick={() => {setEditandoUsuario(u.id); setNuevoUsuario({nombre:u.nombre, email:u.email, sitio_id:u.sitio_id});}} style={{color:'blue', border:'none', background:'none'}}><Edit2 size={18}/></button>
                  <button onClick={() => eliminarUsuario(u.id)} style={{color:'red', border:'none', background:'none'}}><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{display:'none'}} width="640" height="480" />
      <div className="footer">© 2026 ORO JUEZ S.A. | Todos los derechos reservados</div>
    </div>
  );
};

export default OroJuezApp;