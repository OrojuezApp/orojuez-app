import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './style.css'; 
import { Camera, LogOut, Eye, Trash2, Key, Edit2, X, Check, Clock, Calendar } from 'lucide-react';

const SUPABASE_URL = 'https://khgqeqrnlbhadoarcgul.supabase.co';
const SUPABASE_KEY = 'sb_publishable_S5Gk22ej_r8hIZw92b16gw_MBOImAJV';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const OroJuezApp = () => {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [sitios, setSitios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [photo, setPhoto] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [pesoManual, setPesoManual] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: s } = await supabase.from('sitios').select('*').order('ciudad');
    const { data: u } = await supabase.from('perfiles_usuarios').select('*').order('created_at', { ascending: false });
    const { data: r } = await supabase.from('reportes_pesaje').select('*').order('created_at', { ascending: false });
    if (s) setSitios(s);
    if (u) setUsuarios(u);
    if (r) setReportes(r);
  };

  const takePhoto = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    setPhoto(canvas.toDataURL('image/jpeg'));
    setStreaming(false);
    if (videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
  };

  const guardarControl = async () => {
    if (!photo) return alert("La foto del visor es obligatoria como evidencia.");
    if (!pesoManual) return alert("Debe ingresar el peso que marca la báscula.");

    setLoading(true);
    const ahora = new Date();
    const fechaHoraStr = ahora.toLocaleString(); // Captura fecha y hora local

    const { error } = await supabase.from('reportes_pesaje').insert([{
      sitio_id: user.sitio_id,
      nombre_sitio: user.nombre_sitio || 'Sede Central',
      ciudad: user.ciudad || 'N/A',
      usuario_email: user.email,
      nombre_usuario: user.nombre,
      peso_manual: parseFloat(pesoManual),
      foto_url: photo,
      created_at: ahora.toISOString(),
      // Guardamos la fecha/hora visible para el reporte
      notas: `Capturado el: ${fechaHoraStr}` 
    }]);

    if (!error) {
      alert("Control de peso guardado correctamente.");
      setPhoto(null);
      setPesoManual('');
      cargarDatos();
      setView('reportes');
    } else {
      alert("Error al guardar: " + error.message);
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
      if (data) { setUser(data); setView('dashboard'); } else alert("Acceso denegado.");
    }
  };

  if (view === 'login') return (
    <div className="container" style={{padding:'40px 20px', maxWidth:'400px', margin:'auto'}}>
      <div className="navbar"><h1>ORO JUEZ V4.0</h1></div>
      <form onSubmit={handleLogin} style={{marginTop:'30px', display:'flex', flexDirection:'column', gap:'15px'}}>
        <input name="email" type="email" placeholder="Correo Electrónico" required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ccc'}} />
        <input name="password" type="password" placeholder="Contraseña" required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ccc'}} />
        <button className="navbar" style={{color:'white', border:'none', padding:'15px', borderRadius:'8px', fontWeight:'bold'}}>INICIAR SESIÓN</button>
      </form>
    </div>
  );

  return (
    <div className="container">
      <div className="navbar" style={{display:'flex', justifyContent:'space-between', padding:'10px 20px'}}>
        <span style={{fontWeight:'bold'}}>{user.nombre}</span>
        <button onClick={() => setView('login')} style={{color:'white', background:'none', border:'none'}}><LogOut/></button>
      </div>

      <div style={{display:'flex', gap:'5px', margin:'10px'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{flex:1, padding:'10px', border:view==='dashboard'?'2px solid #ffc107':'none'}}>NUEVO PESAJE</button>
        <button onClick={() => setView('reportes')} className="card" style={{flex:1, padding:'10px', border:view==='reportes'?'2px solid #ffc107':'none'}}>HISTORIAL</button>
      </div>

      <div className="content-box">
        {view === 'dashboard' && (
           <div className="card" style={{padding:'20px'}}>
              <h3 style={{marginBottom:'15px'}}>Paso 1: Foto del Visor</h3>
              {!photo && !streaming && (
                <button onClick={()=>{setStreaming(true); navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s=>videoRef.current.srcObject=s)}} className="navbar" style={{color:'white', border:'none', padding:'40px', borderRadius:'50%', marginBottom:'20px'}}><Camera size={40}/></button>
              )}
              
              {streaming && (
                <div>
                  <video ref={videoRef} autoPlay playsInline style={{width:'100%', borderRadius:'15px', border:'2px solid #000'}} />
                  <button onClick={takePhoto} className="navbar" style={{width:'100%', color:'white', border:'none', padding:'15px', marginTop:'10px', borderRadius:'10px', fontWeight:'bold'}}>TOMAR FOTO AHORA</button>
                </div>
              )}

              {photo && (
                <div>
                  <img src={photo} style={{width:'100%', borderRadius:'15px', border:'2px solid #28a745'}} />
                  <h3 style={{marginTop:'20px'}}>Paso 2: Ingrese el Peso</h3>
                  <input type="number" value={pesoManual} onChange={e=>setPesoManual(e.target.value)} placeholder="0.00 kg" style={{fontSize:'2.5rem', textAlign:'center', width:'100%', border:'2px solid #ffc107', borderRadius:'10px', margin:'10px 0'}} />
                  <button onClick={guardarControl} disabled={loading} className="navbar" style={{width:'100%', color:'white', padding:'20px', marginTop:'15px', borderRadius:'10px', fontSize:'1.2rem', fontWeight:'bold'}}>
                    {loading ? 'GUARDANDO...' : 'CONFIRMAR Y GUARDAR'}
                  </button>
                  <button onClick={()=>{setPhoto(null); setPesoManual('');}} style={{width:'100%', marginTop:'10px', background:'none', border:'none', color:'#666', textDecoration:'underline'}}>Repetir Proceso</button>
                </div>
              )}
           </div>
        )}

        {view === 'reportes' && (
          <div style={{padding:'10px'}}>
            {reportes.map(r => (
               <div key={r.id} className="card" style={{display:'flex', flexDirection:'column', marginBottom:'15px', padding:'15px', textAlign:'left'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px'}}>
                    <div>
                      <div style={{fontWeight:'bold', color:'#333'}}>{r.nombre_sitio}</div>
                      <div style={{fontSize:'1.2rem', fontWeight:'bold', color:'#ffc107'}}>{r.peso_manual} kg</div>
                      <div style={{fontSize:'12px', color:'#666', display:'flex', alignItems:'center', gap:'5px'}}><Calendar size={12}/> {new Date(r.created_at).toLocaleDateString()}</div>
                      <div style={{fontSize:'12px', color:'#666', display:'flex', alignItems:'center', gap:'5px'}}><Clock size={12}/> {new Date(r.created_at).toLocaleTimeString()}</div>
                    </div>
                    <button onClick={()=>window.open(r.foto_url)} className="navbar" style={{color:'white', padding:'8px', borderRadius:'8px', border:'none'}}><Eye size={20}/></button>
                  </div>
                  <div style={{fontSize:'11px', opacity:0.7, borderTop:'1px solid #eee', paddingTop:'5px'}}>Operador: {r.nombre_usuario}</div>
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