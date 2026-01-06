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
    if (!nuevoUsuario.rol) return alert("Por favor seleccione un ROL");
    
    setLoading(true);
    try {
      const sitioRel = sitios.find(s => s.id == nuevoUsuario.sitio_id);
      const payload = {
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email.toLowerCase().trim(),
        sitio_id: nuevoUsuario.sitio_id,
        rol: nuevoUsuario.rol,
        nombre_sitio: sitioRel?.nombre || '',
        ciudad: sitioRel?.ciudad || ''
      };

      const { error } = await supabase.from('perfiles_usuarios').insert([payload]);
      if (error) throw error;
      
      setNuevoUsuario({ email: '', nombre: '', sitio_id: '', rol: '' });
      cargarDatos();
      alert("Usuario creado con éxito");
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
        alert("Email no autorizado"); 
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
    } catch (err) { console.error(err); }
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
      alert("Auditado correctamente");
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
      <div className="container" style={{justifyContent:'center', alignItems:'center', minHeight:'100vh', display:'flex'}}>
        <div className="content-box" style={{maxWidth:'400px', width:'90%'}}>
          <div className="navbar"><h1>ORO JUEZ S.A.</h1></div>
          <form onSubmit={handleLogin}>
            <input name="email" type="email" required placeholder="Email Corporativo" />
            <button className="navbar" style={{width:'100%', border:'none', color:'white', padding:'15px', marginTop:'10px'}}>INGRESAR</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="navbar" style={{display:'flex', justifyContent:'space-between'}}>
        <div style={{textAlign:'left'}}>
          <h2 style={{margin:0, fontSize:'0.9rem'}}>ORO JUEZ AUDITORÍA</h2>
          <small>{user?.nombre} | <strong>{user?.rol?.toUpperCase()}</strong></small>
        </div>
        <button onClick={() => setView('login')} style={{background:'none', border:'none', color:'white'}}><LogOut/></button>
      </div>

      <div style={{display:'flex', gap:'5px', marginBottom:'15px', overflowX:'auto'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{flex:1, background: view==='dashboard'?'#333':'#fff', color: view==='dashboard'?'#fff':'#333'}}>CAPTURA</button>
        <button onClick={() => setView('reportes')} className="card" style={{flex:1, background: view==='reportes'?'#333':'#fff', color: view==='reportes'?'#fff':'#333'}}>REPORTES</button>
        {user?.rol === 'admin' && (
          <>
            <button onClick={() => setView('sitios')} className="card" style={{flex:1, background: view==='sitios'?'#333':'#fff', color: view==='sitios'?'#fff':'#333'}}>SEDES</button>
            <button onClick={() => setView('usuarios')} className="card" style={{flex:1, background: view==='usuarios'?'#333':'#fff', color: view==='usuarios'?'#fff':'#333'}}>USUARIOS</button>
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
            <table>
              <thead><tr><th>FECHA/SEDE</th><th>PESO</th><th>DIF.</th><th>VER</th></tr></thead>
              <tbody>
                {reportesFiltrados.map(r => (
                  <tr key={r.id}>
                    <td style={{fontSize:'11px'}}>{new Date(r.created_at).toLocaleDateString()}<br/>{r.nombre_sitio}</td>
                    <td>{r.peso_manual}</td>
                    <td style={{color: Math.abs(r.diferencia) > 0.5 ? 'red' : 'green'}}>{r.diferencia.toFixed(2)}</td>
                    <td><button onClick={() => window.open(r.foto_url)} style={{color:'#ffc107', background:'none', border:'none'}}><Eye/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'sitios' && (
          <div>
            <form onSubmit={handleGuardarSitio}>
              <input value={nuevoSitio.ciudad} onChange={e => setNuevoSitio({...nuevoSitio, ciudad: e.target.value})} placeholder="Ciudad" required />
              <input value={nuevoSitio.nombre} onChange={e => setNuevoSitio({...nuevoSitio, nombre: e.target.value})} placeholder="Sede" required />
              <button className="navbar" style={{width:'100%', color:'white', border:'none', padding:'10px'}}>GUARDAR SEDE</button>
            </form>
          </div>
        )}

        {view === 'usuarios' && (
          <div>
            <h3 style={{fontSize:'14px', marginBottom:'10px'}}>REGISTRAR NUEVO ACCESO</h3>
            <form onSubmit={handleGuardarUsuario} className="card" style={{border: '2px solid #ffc107', padding: '15px'}}>
              <input value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} placeholder="Nombre del Auditor" required />
              <input value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} placeholder="Email Corporativo" required />
              
              {/* SELECT DE ROL REFORZADO */}
              <div style={{margin: '10px 0'}}>
                <label style={{fontSize:'10px', display:'block', fontWeight:'bold'}}>TIPO DE ROL:</label>
                <select 
                  style={{width:'100%', padding:'10px', border:'1px solid #ccc', background:'#f9f9f9'}}
                  value={nuevoUsuario.rol} 
                  onChange={e => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})} 
                  required
                >
                  <option value="">-- SELECCIONAR ROL --</option>
                  <option value="admin">ADMINISTRADOR</option>
                  <option value="auditor">AUDITOR (VER TODO)</option>
                  <option value="operativo">OPERATIVO (SOLO SUS REGISTROS)</option>
                </select>
              </div>

              <select 
                style={{width:'100%', padding:'10px'}}
                value={nuevoUsuario.sitio_id} 
                onChange={e => setNuevoUsuario({...nuevoUsuario, sitio_id: e.target.value})} 
                required
              >
                <option value="">-- ASIGNAR SEDE --</option>
                {sitios.map(s => <option key={s.id} value={s.id}>{s.ciudad} | {s.nombre}</option>)}
              </select>

              <button className="navbar" style={{width:'100%', color:'white', border:'none', padding:'12px', marginTop:'15px', fontWeight:'bold'}}>CREAR USUARIO</button>
            </form>

            <div style={{marginTop:'20px'}}>
              {usuarios.map(u => (
                <div key={u.id} className="card" style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', padding:'10px', textAlign:'left'}}>
                  <div>
                    <strong>{u.nombre}</strong> <small>({u.rol})</small><br/>
                    <small>{u.email}</small>
                  </div>
                  <button onClick={async () => { if(confirm("¿Eliminar?")) { await supabase.from('perfiles_usuarios').delete().eq('id', u.id); cargarDatos(); } }} style={{color:'red', background:'none', border:'none'}}><Trash2 size={18}/></button>
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