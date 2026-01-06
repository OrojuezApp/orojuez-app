import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Tesseract from 'tesseract.js';
import './style.css'; 
import { 
  Camera, LogOut, Eye, Trash2, Edit2, X, MapPin, Users, Building2, ShieldCheck
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

  const [streaming, setStreaming] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [pesoOCR, setPesoOCR] = useState(null);
  const [pesoManual, setPesoManual] = useState('');
  const [observacion, setObservacion] = useState('');

  const [nuevoSitio, setNuevoSitio] = useState({ nombre: '', ciudad: '' });
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', nombre: '', sitio_id: '', rol: '' });

  const [filtroCiudad, setFiltroCiudad] = useState('Todas las Ciudades');
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
    const { data: u } = await supabase.from('perfiles_usuarios').select('*').order('created_at', { ascending: false });
    const { data: r } = await supabase.from('reportes_pesaje').select('*').order('created_at', { ascending: false });
    if (s) setSitios(s);
    if (u) setUsuarios(u);
    if (r) setReportes(r);
  };

  const handleGuardarSitio = async (e) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('sitios').insert([nuevoSitio]);
    setNuevoSitio({ nombre: '', ciudad: '' });
    cargarDatos();
    setLoading(false);
  };

  const handleGuardarUsuario = async (e) => {
    e.preventDefault();
    if (!nuevoUsuario.rol) return alert("ATENCIÓN: Debe seleccionar un ROL antes de guardar.");
    
    setLoading(true);
    try {
      const sitioRel = sitios.find(s => s.id == nuevoUsuario.sitio_id);
      const payload = {
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email.toLowerCase().trim(),
        sitio_id: nuevoUsuario.sitio_id,
        rol: nuevoUsuario.rol,
        nombre_sitio: sitioRel?.nombre || 'Sede no asignada',
        ciudad: sitioRel?.ciudad || 'Sin ciudad'
      };

      const { error } = await supabase.from('perfiles_usuarios').insert([payload]);
      if (error) throw error;
      
      setNuevoUsuario({ email: '', nombre: '', sitio_id: '', rol: '' });
      await cargarDatos();
      alert("USUARIO REGISTRADO EXITOSAMENTE");
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const emailInput = e.target.email.value.trim().toLowerCase();
    
    if (emailInput === 'industria.orojuez@gmail.com') {
      setUser({ email: emailInput, nombre: 'Super Admin', rol: 'admin', sitio_id: 'all', ciudad: 'CORPORATIVO' });
      setView('dashboard');
    } else {
      const { data } = await supabase.from('perfiles_usuarios').select('*').eq('email', emailInput).single();
      if (data) { 
        setUser(data); 
        setView('dashboard'); 
      } else { 
        alert("Usuario no autorizado."); 
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
    if (videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());

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
      nombre_sitio: user.nombre_sitio || 'Admin', 
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
      alert("Pesaje guardado");
      setPhoto(null); setPesoManual(''); setObservacion(''); setPesoOCR(null);
      cargarDatos();
    }
    setLoading(false);
  };

  const reportesFiltrados = reportes.filter(r => {
    const cumpleRol = user.rol === 'admin' || user.rol === 'auditor' || r.usuario_email === user.email;
    const cumpleCiudad = filtroCiudad === 'Todas las Ciudades' || r.ciudad === filtroCiudad;
    return cumpleRol && cumpleCiudad;
  });

  if (view === 'login') {
    return (
      <div className="container" style={{justifyContent:'center', alignItems:'center', minHeight:'100vh', display:'flex', background:'#f0f2f5'}}>
        <div className="content-box" style={{maxWidth:'400px', width:'90%', padding:'30px', borderRadius:'20px'}}>
          <div className="navbar" style={{borderRadius:'10px', marginBottom:'20px'}}><h1>ORO JUEZ S.A.</h1></div>
          <form onSubmit={handleLogin}>
            <input name="email" type="email" required placeholder="Email de Auditor" style={{padding:'12px', marginBottom:'10px'}} />
            <button className="navbar" style={{width:'100%', border:'none', color:'white', padding:'15px', fontWeight:'bold'}}>INGRESAR</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="navbar" style={{display:'flex', justifyContent:'space-between', padding:'15px 20px'}}>
        <div style={{textAlign:'left'}}>
          <h2 style={{margin:0, fontSize:'1rem'}}>ORO JUEZ AUDITORÍA</h2>
          <small>{user?.nombre} | <span style={{background:'#ffc107', padding:'2px 6px', borderRadius:'4px', color:'#000', fontWeight:'bold'}}>{user?.rol?.toUpperCase()}</span></small>
        </div>
        <button onClick={() => setView('login')} style={{background:'none', border:'none', color:'white'}}><LogOut/></button>
      </div>

      <div style={{display:'flex', gap:'5px', marginBottom:'20px', overflowX:'auto'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{flex:1, background: view==='dashboard'?'#1a1a1a':'#fff', color: view==='dashboard'?'#fff':'#333'}}>CAPTURA</button>
        <button onClick={() => setView('reportes')} className="card" style={{flex:1, background: view==='reportes'?'#1a1a1a':'#fff', color: view==='reportes'?'#fff':'#333'}}>REPORTES</button>
        {user?.rol === 'admin' && (
          <>
            <button onClick={() => setView('sitios')} className="card" style={{flex:1, background: view==='sitios'?'#1a1a1a':'#fff', color: view==='sitios'?'#fff':'#333'}}>SEDES</button>
            <button onClick={() => setView('usuarios')} className="card" style={{flex:1, background: view==='usuarios'?'#1a1a1a':'#fff', color: view==='usuarios'?'#fff':'#333'}}>USUARIOS</button>
          </>
        )}
      </div>

      <div className="content-box">
        {view === 'dashboard' && (
          <div className="grid-layout">
            <div className="card">
               <div style={{background:'#000', borderRadius:'10px', minHeight:'200px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                {!streaming && !photo && (
                  <button onClick={() => {setStreaming(true); navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s => videoRef.current.srcObject=s);}} style={{background:'#ffc107', padding:'20px', borderRadius:'50%', border:'none'}}>
                    <Camera size={30}/>
                  </button>
                )}
                {streaming && <video ref={videoRef} autoPlay playsInline style={{width:'100%'}} />}
                {photo && <img src={photo} style={{width:'100%'}} />}
              </div>
              {streaming && <button onClick={takePhoto} className="navbar" style={{width:'100%', marginTop:'10px', color:'white', border:'none', padding:'12px'}}>CAPTURAR</button>}
              {photo && <button onClick={() => {setPhoto(null); setPesoOCR(null);}} style={{width:'100%', marginTop:'10px'}}>REPETIR</button>}
            </div>
            <div className="card">
              <div style={{background:'#fff3cd', padding:'15px', borderRadius:'10px'}}>
                <small>LECTURA OCR:</small>
                <h2 style={{fontSize:'2rem'}}>{pesoOCR || '--'} kg</h2>
              </div>
              <input type="number" value={pesoManual} onChange={e => setPesoManual(e.target.value)} placeholder="Peso Manual" style={{fontSize:'1.5rem', textAlign:'center', marginTop:'10px'}} />
              <button disabled={!photo || loading} onClick={guardarPesaje} className="navbar" style={{width:'100%', color:'white', border:'none', padding:'15px', marginTop:'10px'}}>GUARDAR</button>
            </div>
          </div>
        )}

        {view === 'reportes' && (
          <div style={{overflowX:'auto'}}>
            <select onChange={e => setFiltroCiudad(e.target.value)} style={{marginBottom:'10px', width:'100%'}}>
              <option>Todas las Ciudades</option>
              {Array.from(new Set(sitios.map(s => s.ciudad))).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <table style={{width:'100%'}}>
              <thead><tr><th>FECHA/SEDE</th><th>PESO</th><th>DIF.</th><th>VER</th></tr></thead>
              <tbody>
                {reportesFiltrados.map(r => (
                  <tr key={r.id}>
                    <td style={{fontSize:'11px', textAlign:'left'}}>{new Date(r.created_at).toLocaleDateString()}<br/>{r.nombre_sitio}</td>
                    <td>{r.peso_manual}</td>
                    <td style={{color: Math.abs(r.diferencia) > 0.5 ? 'red' : 'green'}}>{r.diferencia.toFixed(2)}</td>
                    <td><button onClick={() => window.open(r.foto_url)} style={{background:'none', border:'none', color:'#ffc107'}}><Eye/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'sitios' && (
          <div>
            <form onSubmit={handleGuardarSitio} className="card">
              <input value={nuevoSitio.ciudad} onChange={e => setNuevoSitio({...nuevoSitio, ciudad: e.target.value})} placeholder="Ciudad" required />
              <input value={nuevoSitio.nombre} onChange={e => setNuevoSitio({...nuevoSitio, nombre: e.target.value})} placeholder="Sede" required />
              <button className="navbar" style={{width:'100%', color:'white', border:'none', padding:'10px'}}>GUARDAR SEDE</button>
            </form>
            <div style={{marginTop:'20px'}}>
              {sitios.map(s => <div key={s.id} className="card" style={{marginBottom:'5px'}}>{s.ciudad} - {s.nombre}</div>)}
            </div>
          </div>
        )}

        {view === 'usuarios' && (
          <div style={{padding:'10px'}}>
            <form onSubmit={handleGuardarUsuario} className="card" style={{padding:'20px', textAlign:'left'}}>
              <div style={{marginBottom:'10px'}}>
                <label style={{fontSize:'12px', fontWeight:'bold'}}>NOMBRE AUDITOR:</label>
                <input value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} placeholder="Nombre" required />
              </div>

              <div style={{marginBottom:'10px'}}>
                <label style={{fontSize:'12px', fontWeight:'bold'}}>EMAIL:</label>
                <input value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} placeholder="email@orojuez.com" required />
              </div>

              {/* CONTENEDOR RESALTADO PARA EL ROL */}
              <div style={{marginBottom:'15px', padding:'15px', background:'#fff8e1', borderRadius:'10px', border:'2px dashed #ffc107'}}>
                <label style={{fontSize:'12px', fontWeight:'bold', color:'#d32f2f'}}>ASIGNAR ROL DE ACCESO:</label>
                <select 
                  style={{width:'100%', padding:'12px', marginTop:'5px', border:'2px solid #000', borderRadius:'8px'}}
                  value={nuevoUsuario.rol} 
                  onChange={e => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})} 
                  required
                >
                  <option value="">-- SELECCIONE ROL --</option>
                  <option value="admin">ADMINISTRADOR (TODO)</option>
                  <option value="auditor">AUDITOR (VER TODO)</option>
                  <option value="operativo">OPERATIVO (SOLO LO SUYO)</option>
                </select>
              </div>

              <div style={{marginBottom:'15px'}}>
                <label style={{fontSize:'12px', fontWeight:'bold'}}>SEDE ASIGNADA:</label>
                <select 
                  style={{width:'100%', padding:'12px'}}
                  value={nuevoUsuario.sitio_id} 
                  onChange={e => setNuevoUsuario({...nuevoUsuario, sitio_id: e.target.value})} 
                  required
                >
                  <option value="">-- SELECCIONAR SEDE --</option>
                  {sitios.map(s => <option key={s.id} value={s.id}>{s.ciudad} | {s.nombre}</option>)}
                </select>
              </div>

              <button className="navbar" style={{width:'100%', color:'white', border:'none', padding:'15px', fontWeight:'bold'}}>CREAR USUARIO</button>
            </form>

            <div style={{marginTop:'30px'}}>
              {usuarios.map(u => (
                <div key={u.id} className="card" style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', textAlign:'left'}}>
                  <div>
                    <strong>{u.nombre}</strong> <small>({u.rol})</small><br/>
                    <small>{u.email} • {u.ciudad}</small>
                  </div>
                  <button onClick={async () => { if(confirm("¿Eliminar?")) { await supabase.from('perfiles_usuarios').delete().eq('id', u.id); cargarDatos(); } }} style={{color:'red', background:'none', border:'none'}}><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{display:'none'}} width="640" height="480" />
      <div style={{padding:'20px', fontSize:'10px', opacity:0.5}}>© 2026 ORO JUEZ S.A. | VERSIÓN 2.3 - ROLES FORZADOS</div>
    </div>
  );
};

export default OroJuezApp;