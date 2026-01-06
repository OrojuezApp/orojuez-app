import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Tesseract from 'tesseract.js';
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
  
  // Estado inicial con ROL incluido
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', nombre: '', sitio_id: '', rol: '' });

  const [filtroCiudad, setFiltroCiudad] = useState('Todas las Ciudades');
  const [fechaInicio, setFechaInicio] = useState('');

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

  const handleGuardarUsuario = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const sitioRel = sitios.find(s => s.id == nuevoUsuario.sitio_id);
      const payload = {
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email.toLowerCase().trim(),
        sitio_id: nuevoUsuario.sitio_id,
        rol: nuevoUsuario.rol, // Capturando el rol del combo
        nombre_sitio: sitioRel?.nombre || '',
        ciudad: sitioRel?.ciudad || ''
      };

      if (editandoUsuario) {
        const { error } = await supabase.from('perfiles_usuarios').update(payload).eq('id', editandoUsuario);
        if (error) throw error;
        setEditandoUsuario(null);
      } else {
        const { error } = await supabase.from('perfiles_usuarios').insert([payload]);
        if (error) throw error;
      }
      setNuevoUsuario({ email: '', nombre: '', sitio_id: '', rol: '' });
      cargarDatos();
      alert("Usuario guardado correctamente");
    } catch (err) {
      alert("Error al guardar usuario: " + err.message);
    }
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
      setUser({ email: emailInput, nombre: 'Super Admin', rol: 'admin', sitio_id: 'all', ciudad: 'CORPORATIVO' });
      setView('dashboard');
    } else {
      const { data, error } = await supabase.from('perfiles_usuarios').select('*').eq('email', emailInput).single();
      if (data) { 
        setUser(data); 
        setView('dashboard'); 
      } else { 
        alert("Acceso denegado. Email no registrado."); 
      }
    }
    setLoading(false);
  };

  const takePhoto = async () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    const imageData = canvasRef.current.toDataURL('image/jpeg');
    setPhoto(imageData);
    setStreaming(false);
    
    if (videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }

    setLoading(true);
    try {
      const { data: { text } } = await Tesseract.recognize(imageData, 'eng');
      const numeros = text.match(/\d+(\.\d+)?/g);
      if (numeros) setPesoOCR(parseFloat(numeros[0]));
    } catch (err) { console.error("Error OCR:", err); }
    setLoading(false);
  };

  const guardarPesaje = async () => {
    setLoading(true);
    const { error } = await supabase.from('reportes_pesaje').insert([{
      sitio_id: user.sitio_id, 
      nombre_sitio: user.nombre_sitio || 'Admin Central', 
      ciudad: user.ciudad,
      usuario_email: user.email, 
      nombre_usuario: user.nombre,
      peso_ocr: pesoOCR || 0, 
      peso_manual: parseFloat(pesoManual),
      diferencia: parseFloat(pesoManual) - (pesoOCR || 0), 
      foto_url: photo, 
      observacion: observacion
    }]);
    
    if (!error) {
      alert("Pesaje guardado exitosamente");
      setPhoto(null); setPesoManual(''); setObservacion(''); setPesoOCR(null);
      cargarDatos();
    } else {
      alert("Error al guardar pesaje: " + error.message);
    }
    setLoading(false);
  };

  const reportesFiltrados = reportes.filter(r => {
    // Admin y Auditor ven todo. Operativo solo lo suyo.
    const cumpleRol = user.rol === 'admin' || user.rol === 'auditor' || r.usuario_email === user.email;
    const cumpleCiudad = filtroCiudad === 'Todas las Ciudades' || r.ciudad === filtroCiudad;
    const fechaR = new Date(r.created_at);
    const cumpleFecha = !fechaInicio || fechaR >= new Date(fechaInicio);
    return cumpleRol && cumpleCiudad && cumpleFecha;
  });

  if (view === 'login') {
    return (
      <div className="container" style={{justifyContent:'center', alignItems:'center', minHeight:'100vh', display:'flex'}}>
        <div className="content-box" style={{maxWidth:'400px', width:'90%'}}>
          <div className="navbar"><h1>ORO JUEZ S.A.</h1></div>
          <form onSubmit={handleLogin}>
            <input name="email" type="email" required placeholder="Correo Corporativo" style={{marginBottom:'10px'}} />
            <button className="navbar" style={{width:'100%', border:'none', color:'white', fontWeight:'bold', padding:'15px'}}>ENTRAR AL SISTEMA</button>
          </form>
          <p style={{fontSize:'10px', marginTop:'20px', color: dbStatus === 'online' ? 'green' : 'red'}}>
            CONEXIÓN: {dbStatus.toUpperCase()}
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
          <small>{user?.nombre} | <span style={{textTransform:'uppercase', fontWeight:'bold'}}>{user?.rol}</span></small>
        </div>
        <button onClick={() => setView('login')} style={{background:'none', border:'none', color:'white'}}><LogOut/></button>
      </div>

      <div style={{display:'flex', gap:'5px', marginBottom:'15px', overflowX:'auto', paddingBottom:'5px'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{flex:1, minWidth:'100px', background: view==='dashboard'?'#333':'#fff', color: view==='dashboard'?'#fff':'#333'}}>CAPTURA</button>
        <button onClick={() => setView('reportes')} className="card" style={{flex:1, minWidth:'100px', background: view==='reportes'?'#333':'#fff', color: view==='reportes'?'#fff':'#333'}}>REPORTES</button>
        {user?.rol === 'admin' && (
          <>
            <button onClick={() => setView('sitios')} className="card" style={{flex:1, minWidth:'100px', background: view==='sitios'?'#333':'#fff', color: view==='sitios'?'#fff':'#333'}}>SEDES</button>
            <button onClick={() => setView('usuarios')} className="card" style={{flex:1, minWidth:'100px', background: view==='usuarios'?'#333':'#fff', color: view==='usuarios'?'#fff':'#333'}}>USUARIOS</button>
          </>
        )}
      </div>

      <div className="content-box">
        {view === 'dashboard' && (
          <div className="grid-layout">
            <div className="card">
              <div style={{background:'#000', borderRadius:'10px', minHeight:'250px', display:'flex', alignItems:'center', justifyContent:'center', position:'relative'}}>
                {!streaming && !photo && (
                  <button onClick={() => {
                    setStreaming(true); 
                    navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s => videoRef.current.srcObject=s);
                  }} style={{background:'#ffc107', padding:'25px', borderRadius:'50%', border:'none'}}>
                    <Camera size={40}/>
                  </button>
                )}
                {streaming && <video ref={videoRef} autoPlay playsInline style={{width:'100%', borderRadius:'10px'}} />}
                {photo && <img src={photo} style={{width:'100%', borderRadius:'10px'}} />}
                {loading && <div style={{position:'absolute', color:'white', background:'rgba(0,0,0,0.7)', padding:'10px', borderRadius:'5px'}}>Analizando visor...</div>}
              </div>
              {streaming && <button onClick={takePhoto} className="navbar" style={{width:'100%', marginTop:'10px', color:'white', border:'none', padding:'15px', fontWeight:'bold'}}>TOMAR FOTO</button>}
              {photo && <button onClick={() => {setPhoto(null); setPesoOCR(null);}} style={{width:'100%', marginTop:'10px', padding:'10px'}}>REPETIR FOTO</button>}
            </div>

            <div className="card">
              <div style={{background:'#fff3cd', padding:'15px', borderRadius:'10px', marginBottom:'10px'}}>
                <small style={{fontWeight:'bold'}}>PESO DETECTADO (OCR)</small>
                <h2 style={{margin:0, fontSize:'2.5rem'}}>{pesoOCR || '--'} <small style={{fontSize:'1rem'}}>kg</small></h2>
              </div>
              <label style={{textAlign:'left', display:'block', fontSize:'12px', fontWeight:'bold'}}>PESO MANUAL:</label>
              <input type="number" value={pesoManual} onChange={e => setPesoManual(e.target.value)} placeholder="0.00" style={{fontSize:'1.8rem', textAlign:'center', marginBottom:'10px'}} />
              <textarea value={observacion} onChange={e => setObservacion(e.target.value)} placeholder="Notas de la auditoría..."></textarea>
              <button disabled={!photo || !pesoManual || loading} onClick={guardarPesaje} className="navbar" style={{width:'100%', color:'white', border:'none', padding:'15px', fontWeight:'bold', marginTop:'10px', opacity:(!photo || !pesoManual)?0.5:1}}>
                {loading ? 'PROCESANDO...' : 'GUARDAR AUDITORÍA'}
              </button>
            </div>
          </div>
        )}

        {view === 'reportes' && (
          <div>
            <div style={{display:'flex', gap:'5px', marginBottom:'15px'}}>
              <select style={{flex:1}} onChange={e => setFiltroCiudad(e.target.value)}>
                <option>Todas las Ciudades</option>
                {Array.from(new Set(sitios.map(s => s.ciudad))).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" style={{flex:1}} onChange={e => setFechaInicio(e.target.value)} />
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%', minWidth:'400px'}}>
                <thead>
                  <tr>
                    <th>FECHA / SEDE</th>
                    <th>PESO</th>
                    <th>DIF.</th>
                    <th>VER</th>
                    {user.rol === 'admin' && <th>ACC</th>}
                  </tr>
                </thead>
                <tbody>
                  {reportesFiltrados.map(r => (
                    <tr key={r.id}>
                      <td style={{fontSize:'11px', textAlign:'left'}}>
                        <strong>{new Date(r.created_at).toLocaleDateString()}</strong><br/>
                        {r.nombre_sitio}
                      </td>
                      <td>{r.peso_manual}</td>
                      <td style={{fontWeight:'bold', color: Math.abs(r.diferencia) > 0.5 ? 'red' : 'green'}}>
                        {r.diferencia.toFixed(2)}
                      </td>
                      <td><button onClick={() => window.open(r.foto_url)} style={{color:'#ffc107', background:'none', border:'none'}}><Eye/></button></td>
                      {user.rol === 'admin' && (
                        <td><button onClick={async () => { if(confirm("¿Borrar?")) { await supabase.from('reportes_pesaje').delete().eq('id', r.id); cargarDatos(); } }} style={{color:'red', background:'none', border:'none'}}><Trash2 size={16}/></button></td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'sitios' && (
          <div>
            <form onSubmit={handleGuardarSitio} className="card" style={{marginBottom:'15px'}}>
              <input value={nuevoSitio.ciudad} onChange={e => setNuevoSitio({...nuevoSitio, ciudad: e.target.value})} placeholder="Ciudad" required />
              <input value={nuevoSitio.nombre} onChange={e => setNuevoSitio({...nuevoSitio, nombre: e.target.value})} placeholder="Nombre Sede" required />
              <button className="navbar" style={{width:'100%', color:'white', border:'none', padding:'12px', marginTop:'5px'}}>GUARDAR SEDE</button>
            </form>
            {sitios.map(s => (
              <div key={s.id} className="card" style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', padding:'10px'}}>
                <div style={{textAlign:'left'}}><strong>{s.ciudad}</strong> - {s.nombre}</div>
                <button onClick={async () => { if(confirm("¿Borrar?")) { await supabase.from('sitios').delete().eq('id', s.id); cargarDatos(); } }} style={{color:'red', background:'none', border:'none'}}><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        )}

        {view === 'usuarios' && (
          <div>
            <form onSubmit={handleGuardarUsuario} className="card" style={{marginBottom:'15px'}}>
              <input value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} placeholder="Nombre Auditor" required />
              <input value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} placeholder="Email Corporativo" required />
              
              {/* COMBO DE ROL - AQUÍ ESTÁ EL SELECTOR */}
              <select value={nuevoUsuario.rol} onChange={e => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})} required>
                <option value="">Seleccionar Rol...</option>
                <option value="admin">Administrador</option>
                <option value="auditor">Auditor (Ver Todo)</option>
                <option value="operativo">Operativo (Solo lo suyo)</option>
              </select>

              <select value={nuevoUsuario.sitio_id} onChange={e => setNuevoUsuario({...nuevoUsuario, sitio_id: e.target.value})} required>
                <option value="">Asignar Sede...</option>
                {sitios.map(s => <option key={s.id} value={s.id}>{s.ciudad} | {s.nombre}</option>)}
              </select>

              <button className="navbar" style={{width:'100%', color:'white', border:'none', padding:'12px', marginTop:'5px'}}>CREAR USUARIO</button>
            </form>
            {usuarios.map(u => (
              <div key={u.id} className="card" style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', padding:'10px', textAlign:'left'}}>
                <div>
                  <strong>{u.nombre}</strong> <small>({u.rol})</small><br/>
                  <small>{u.email} - {u.ciudad}</small>
                </div>
                <button onClick={() => eliminarUsuario(u.id)} style={{color:'red', background:'none', border:'none'}}><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{display:'none'}} width="640" height="480" />
      <div style={{padding:'20px', fontSize:'10px', opacity:0.5}}>© 2026 ORO JUEZ S.A. | V.2.2</div>
    </div>
  );
};

export default OroJuezApp;