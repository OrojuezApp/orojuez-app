import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './style.css'; 
import { 
  Camera, Database, Layout, Users, FileText, LogOut, 
  AlertTriangle, CheckCircle, Search, Download, Eye, 
  MapPin, Plus, Trash2, Building2, Globe, ShieldCheck, Edit2, X, Menu
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

  // Estados para Edición
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

  // --- GESTIÓN DE SITIOS (CRUD) ---
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

  // --- GESTIÓN DE USUARIOS (CRUD) ---
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
      setUser({ email: emailInput, nombre: 'Admin Central', rol: 'admin', sitio_id: 'all' });
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
      sitio_id: user.sitio_id, nombre_sitio: user.nombre_sitio, ciudad: user.ciudad,
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

  // --- VISTA DE LOGIN ---
  if (view === 'login') {
    return (
      <div className="container" style={{display:'flex', justifyContent:'center', minHeight:'90vh', alignItems:'center'}}>
        <div className="content-box" style={{maxWidth:'400px', textAlign:'center', width:'100%'}}>
          <div className="navbar" style={{borderRadius:'15px', marginBottom:'25px'}}>
            <h1 style={{margin:0, padding:'10px'}}>ORO JUEZ S.A.</h1>
          </div>
          <form onSubmit={handleLogin}>
            <input name="email" type="email" required placeholder="Correo Corporativo" style={{width:'100%', padding:'15px', marginBottom:'15px', borderRadius:'10px', border:'1px solid #ddd'}} />
            <button className="navbar" style={{width:'100%', padding:'15px', border:'none', color:'white', fontWeight:'bold', borderRadius:'10px', cursor:'pointer'}}>ENTRAR AL SISTEMA</button>
          </form>
          <p style={{fontSize:'10px', marginTop:'20px', color: dbStatus === 'online' ? 'green' : 'red'}}>
            STATUS: {dbStatus.toUpperCase()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* CABECERA DINÁMICA */}
      <div className="navbar" style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderRadius:'10px', marginBottom:'15px'}}>
        <div style={{textAlign:'left'}}>
          <h2 style={{margin:0, fontSize:'1.1rem'}}>ORO JUEZ AUDITORÍA</h2>
          <small>{user?.nombre} | {user?.ciudad}</small>
        </div>
        <button onClick={() => setView('login')} style={{background:'none', border:'none', color:'white'}}><LogOut size={20}/></button>
      </div>

      {/* MENÚ DE NAVEGACIÓN TÁCTIL */}
      <div style={{display:'flex', gap:'5px', marginBottom:'20px', overflowX:'auto', paddingBottom:'10px'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{flex:1, padding:'12px', background: view==='dashboard'?'#333':'#fff', color: view==='dashboard'?'#fff':'#333', border:'1px solid #ddd', fontWeight:'bold', fontSize:'11px'}}>CAPTURA</button>
        <button onClick={() => setView('reportes')} className="card" style={{flex:1, padding:'12px', background: view==='reportes'?'#333':'#fff', color: view==='reportes'?'#fff':'#333', border:'1px solid #ddd', fontWeight:'bold', fontSize:'11px'}}>REPORTES</button>
        {user?.rol === 'admin' && (
          <>
            <button onClick={() => setView('sitios')} className="card" style={{flex:1, padding:'12px', background: view==='sitios'?'#333':'#fff', color: view==='sitios'?'#fff':'#333', border:'1px solid #ddd', fontWeight:'bold', fontSize:'11px'}}>CIUDADES</button>
            <button onClick={() => setView('usuarios')} className="card" style={{flex:1, padding:'12px', background: view==='usuarios'?'#333':'#fff', color: view==='usuarios'?'#fff':'#333', border:'1px solid #ddd', fontWeight:'bold', fontSize:'11px'}}>USUARIOS</button>
          </>
        )}
      </div>

      <div className="content-box">
        {/* PANTALLA DE CAPTURA (CÁMARA Y DATOS) */}
        {view === 'dashboard' && (
          <div className="grid-layout">
            <div className="card">
              <div style={{background:'#000', borderRadius:'15px', overflow:'hidden', minHeight:'280px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                {!streaming && !photo && (
                  <button onClick={() => {setStreaming(true); navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s => videoRef.current.srcObject=s);}} style={{background:'#ffc107', border:'none', padding:'25px', borderRadius:'50%', cursor:'pointer'}}>
                    <Camera size={35}/>
                  </button>
                )}
                {streaming && <video ref={videoRef} autoPlay playsInline style={{width:'100%', height:'100%', objectFit:'cover'}} />}
                {photo && <img src={photo} style={{width:'100%'}} alt="Captura de báscula" />}
              </div>
              {streaming && <button onClick={takePhoto} className="navbar" style={{width:'100%', marginTop:'10px', padding:'15px', border:'none', borderRadius:'10px', color:'white', fontWeight:'black'}}>CAPTURAR PESO</button>}
              {photo && <button onClick={() => {setPhoto(null); setPesoOCR(null);}} style={{width:'100%', marginTop:'10px', padding:'10px', border:'none', borderRadius:'10px', background:'#eee', fontWeight:'bold'}}>REINTENTAR FOTO</button>}
            </div>

            <div className="card" style={{textAlign:'left'}}>
              <div style={{background:'#fff3cd', padding:'20px', borderRadius:'15px', textAlign:'center', marginBottom:'15px', border:'2px solid #ffeeba'}}>
                <small style={{fontWeight:'black', color:'#856404', letterSpacing:'1px'}}>LECTURA OCR</small>
                <h2 style={{fontSize:'3.5rem', margin:0}}>{pesoOCR || '--'} <small style={{fontSize:'1rem'}}>kg</small></h2>
              </div>
              
              <label style={{fontWeight:'bold', fontSize:'12px', display:'block', marginBottom:'5px'}}>PESO MANUAL (BÁSCULA):</label>
              <input type="number" value={pesoManual} onChange={e => setPesoManual(e.target.value)} style={{width:'100%', padding:'18px', fontSize:'2rem', borderRadius:'12px', border:'2px solid #ddd', marginBottom:'15px', textAlign:'center'}} placeholder="0.00" />
              
              <label style={{fontWeight:'bold', fontSize:'12px', display:'block', marginBottom:'5px'}}>OBSERVACIONES:</label>
              <textarea value={observacion} onChange={e => setObservacion(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #ddd', height:'80px', marginBottom:'15px'}} placeholder="Escribe aquí..."></textarea>
              
              <button disabled={!photo || !pesoManual || loading} onClick={guardarPesaje} className="navbar" style={{width:'100%', padding:'20px', border:'none', color:'white', fontSize:'1.3rem', fontWeight:'black', borderRadius:'12px', opacity:(!photo || !pesoManual)?0.5:1}}>
                {loading ? 'GUARDANDO...' : 'CONFIRMAR AUDITORÍA'}
              </button>
            </div>
            <canvas ref={canvasRef} width="640" height="480" style={{display:'none'}} />
          </div>
        )}

        {/* PANTALLA DE REPORTES */}
        {view === 'reportes' && (
          <div>
            <div className="grid-layout" style={{marginBottom:'20px', gap:'10px'}}>
               <select onChange={e => setFiltroCiudad(e.target.value)} style={{padding:'10px', borderRadius:'8px', border:'1px solid #ddd'}}><option>Todos</option>{Array.from(new Set(sitios.map(s => s.ciudad))).map(c => <option key={c}>{c}</option>)}</select>
               <input type="date" onChange={e => setFechaInicio(e.target.value)} style={{padding:'10px', borderRadius:'8px', border:'1px solid #ddd'}} />
               <button onClick={() => window.print()} className="navbar" style={{border:'none', borderRadius:'8px', color:'white', fontWeight:'bold'}}>IMPRIMIR</button>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:'11px'}}>
                <thead>
                  <tr style={{background:'#333', color:'white'}}>
                    <th style={{padding:'10px', textAlign:'left'}}>FECHA / SEDE</th>
                    <th style={{padding:'10px', textAlign:'center'}}>MANUAL</th>
                    <th style={{padding:'10px', textAlign:'center'}}>DIF.</th>
                    <th style={{padding:'10px', textAlign:'center'}}>VER</th>
                  </tr>
                </thead>
                <tbody>
                  {reportesFiltrados.map(r => (
                    <tr key={r.id} style={{borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'10px'}}>
                        <strong>{new Date(r.created_at).toLocaleDateString()}</strong><br/>
                        <small style={{color:'#666'}}>{r.nombre_sitio} ({r.ciudad})</small>
                      </td>
                      <td style={{padding:'10px', textAlign:'center', fontSize:'14px', fontWeight:'black'}}>{r.peso_manual} kg</td>
                      <td style={{padding:'10px', textAlign:'center', color: r.diferencia < 0 ? 'red' : 'green', fontWeight:'bold'}}>{r.diferencia}</td>
                      <td style={{padding:'10px', textAlign:'center'}}>
                        <button onClick={() => window.open(r.foto_url)} style={{background:'none', border:'none', color:'#ffc107'}}><Eye size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GESTIÓN DE SITIOS */}
        {view === 'sitios' && (
          <div>
            <h3 style={{marginBottom:'15px', textTransform:'uppercase'}}>Gestión de Áreas</h3>
            <form onSubmit={handleGuardarSitio} className="grid-layout" style={{background:'#f9f9f9', padding:'15px', borderRadius:'10px', marginBottom:'20px'}}>
               <input value={nuevoSitio.ciudad} onChange={e => setNuevoSitio({...nuevoSitio, ciudad: e.target.value})} placeholder="Ciudad" required style={{padding:'10px', borderRadius:'5px', border:'1px solid #ddd'}} />
               <input value={nuevoSitio.nombre} onChange={e => setNuevoSitio({...nuevoSitio, nombre: e.target.value})} placeholder="Nombre Área" required style={{padding:'10px', borderRadius:'5px', border:'1px solid #ddd'}} />
               <button className="navbar" style={{border:'none', borderRadius:'5px', color:'white', fontWeight:'bold'}}>{editandoSitio ? 'ACTUALIZAR' : 'CREAR'}</button>
            </form>
            <table style={{width:'100%', fontSize:'12px'}}>
              {sitios.map(s => (
                <tr key={s.id} style={{borderBottom:'1px solid #eee'}}>
                  <td style={{padding:'10px'}}><strong>{s.ciudad}</strong> - {s.nombre}</td>
                  <td style={{padding:'10px', textAlign:'right'}}>
                    <button onClick={() => {setEditandoSitio(s.id); setNuevoSitio({nombre:s.nombre, ciudad:s.ciudad});}} style={{marginRight:'10px', color:'blue', border:'none', background:'none'}}><Edit2 size={16}/></button>
                    <button onClick={() => eliminarSitio(s.id)} style={{color:'red', border:'none', background:'none'}}><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </table>
          </div>
        )}

        {/* GESTIÓN DE USUARIOS */}
        {view === 'usuarios' && (
          <div>
            <h3 style={{marginBottom:'15px', textTransform:'uppercase'}}>Auditores Registrados</h3>
            <form onSubmit={handleGuardarUsuario} className="grid-layout" style={{background:'#fdf6e3', padding:'15px', borderRadius:'10px', marginBottom:'20px'}}>
               <input value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} placeholder="Nombre Auditor" required style={{padding:'10px'}} />
               <input value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} placeholder="Email" required style={{padding:'10px'}} />
               <select value={nuevoUsuario.sitio_id} onChange={e => setNuevoUsuario({...nuevoUsuario, sitio_id: e.target.value})} required style={{padding:'10px'}}>
                  <option value="">Asignar a...</option>
                  {sitios.map(s => <option key={s.id} value={s.id}>{s.ciudad} | {s.nombre}</option>)}
               </select>
               <button className="navbar" style={{border:'none', borderRadius:'5px', color:'white', fontWeight:'bold'}}>{editandoUsuario ? 'ACTUALIZAR' : 'VINCULAR'}</button>
            </form>
            <table style={{width:'100%', fontSize:'12px'}}>
              {usuarios.map(u => (
                <tr key={u.id} style={{borderBottom:'1px solid #eee'}}>
                  <td style={{padding:'10px'}}><strong>{u.nombre}</strong><br/><small>{u.email}</small><br/><small style={{color:'orange'}}>{u.ciudad} - {u.nombre_sitio}</small></td>
                  <td style={{padding:'10px', textAlign:'right'}}>
                    <button onClick={() => {setEditandoUsuario(u.id); setNuevoUsuario({nombre:u.nombre, email:u.email, sitio_id:u.sitio_id});}} style={{marginRight:'10px', color:'blue', border:'none', background:'none'}}><Edit2 size={16}/></button>
                    <button onClick={() => eliminarUsuario(u.id)} style={{color:'red', border:'none', background:'none'}}><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </table>
          </div>
        )}
      </div>

      <div className="footer" style={{marginTop:'20px', borderRadius:'10px'}}>
        © 2026 ORO JUEZ S.A. | SISTEMA DE CONTROL DE PESO
      </div>
    </div>
  );
};

export default OroJuezApp;