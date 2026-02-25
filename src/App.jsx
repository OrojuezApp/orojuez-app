import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './style.css'; 
import { Camera, LogOut, RefreshCw, Search, Image as ImageIcon, Trash2, Edit, FileText, Download, Users, MapPin, ShieldCheck } from 'lucide-react';

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
  
  const corporativoRed = "#b30000";

  const [filtroSede, setFiltroSede] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // --- NUEVOS ESTADOS PARA PAGINACIÓN Y TOTAL ---
  const [pagina, setPagina] = useState(0);
  const [hayMas, setHayMas] = useState(true);
  const [totalGeneral, setTotalGeneral] = useState(0);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState(null);
  const [pesoManual, setPesoManual] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => { if (user) cargarDatos(); }, [user]);

  // --- FUNCIÓN CARGARDATOS ACTUALIZADA CON PAGINACIÓN ---
  const cargarDatos = async (nuevaPagina = 0) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: s } = await supabase.from('sitios').select('*').order('nombre');
      const { data: u } = await supabase.from('perfiles_usuarios').select('*').order('nombre');
      setSitios(s || []);
      setUsuarios(u || []);

      // 1. CONSULTA DE GRAN TOTAL (Sin fotos, muy rápida)
      let sumaQuery = supabase.from('reportes_pesaje').select('peso_manual');
      if (user?.rol === 'operador') {
        sumaQuery = sumaQuery.eq('usuario_email', user?.email);
      }
      const { data: todosLosPesos } = await sumaQuery;
      const sumaTotal = todosLosPesos?.reduce((acc, curr) => acc + (Number(curr.peso_manual) || 0), 0) || 0;
      setTotalGeneral(sumaTotal);

      // 2. CONSULTA PAGINADA (De 50 en 50)
      const desde = nuevaPagina * 50;
      const hasta = desde + 49;

      let query = supabase
        .from('reportes_pesaje')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(desde, hasta);

      if (user?.rol === 'operador') {
        query = query.eq('usuario_email', user?.email);
      }

      const { data: r, count, error } = await query;
      if (error) throw error;

      if (nuevaPagina === 0) {
        setReportes(r || []);
        setReportesFiltrados(r || []);
      } else {
        const acumulados = [...reportes, ...(r || [])];
        setReportes(acumulados);
        setReportesFiltrados(acumulados);
      }

      setHayMas(desde + (r?.length || 0) < (count || 0));
      setPagina(nuevaPagina);

    } catch (err) { 
      console.error("Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const aplicarFiltros = () => {
    let filtrados = [...reportes];
    if (filtroSede) filtrados = filtrados.filter(r => r.nombre_sitio === filtroSede);
    if (fechaInicio) filtrados = filtrados.filter(r => new Date(r.created_at) >= new Date(fechaInicio));
    if (fechaFin) filtrados = filtrados.filter(r => new Date(r.created_at) <= new Date(fechaFin + 'T23:59:59'));
    setReportesFiltrados(filtrados);
  };

  const login = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('perfiles_usuarios').select('*').eq('email', email).eq('password', password).single();
      if (error || !data) throw new Error("Credenciales inválidas");
      setUser(data);
      setView('inicio');
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const startCamera = async () => {
    setView('camera');
    setTimeout(async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoRef.current.srcObject = stream;
    }, 100);
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setPhoto(canvas.toDataURL('image/jpeg', 0.5));
    video.srcObject.getTracks().forEach(track => track.stop());
    setView('formulario');
  };

  const guardarControl = async () => {
    if (!photo || !pesoManual) return alert("Falta foto o peso.");
    setLoading(true);
    try {
      const { error } = await supabase.from('reportes_pesaje').insert([{
        sitio_id: user.sitio_id, 
        nombre_sitio: user.nombre_sitio || 'Sede Principal',
        usuario_email: user.email,
        nombre_usuario: user.nombre,
        peso_manual: parseFloat(pesoManual),
        foto_url: photo,
        observaciones: observaciones || ''
      }]);
      if (error) throw error;
      alert("¡Registro guardado!");
      setPhoto(null); setPesoManual(''); setObservaciones('');
      await cargarDatos(0); // Recargar desde la pag 0
      setView('historial');
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  if (view === 'login') return (
    <div className="login-container">
      <div className="login-card">
        <h1 style={{color: corporativoRed, fontSize:'2rem', marginBottom:'0.5rem'}}>ORO JUEZ</h1>
        <p style={{color:'#666', marginBottom:'2rem'}}>Control de Pesos - V1.0</p>
        <input type="email" placeholder="Correo Electrónico" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} />
        <button onClick={login} disabled={loading} style={{backgroundColor: corporativoRed}}>
          {loading ? <RefreshCw className="animate-spin" /> : 'ENTRAR'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <nav className="navbar" style={{backgroundColor: corporativoRed}}>
        <div style={{fontWeight:'bold'}}>ORO JUEZ</div>
        <div style={{display:'flex', gap:'15px'}}>
          <button onClick={() => setView('inicio')} className="nav-btn"><FileText size={20}/></button>
          {user?.rol === 'admin' && <button onClick={() => setView('admin')} className="nav-btn"><ShieldCheck size={20}/></button>}
          <button onClick={() => setUser(null) || setView('login')} className="nav-btn"><LogOut size={20}/></button>
        </div>
      </nav>

      <div className="content">
        {view === 'inicio' && (
          <div className="menu-grid">
            <button onClick={startCamera} className="menu-card">
              <Camera size={40} color={corporativoRed} />
              <span>NUEVO PESAJE</span>
            </button>
            <button onClick={() => setView('historial')} className="menu-card">
              <Search size={40} color={corporativoRed} />
              <span>HISTORIAL</span>
            </button>
          </div>
        )}

        {view === 'camera' && (
          <div className="camera-view">
            <video ref={videoRef} autoPlay playsInline />
            <button onClick={capturePhoto} className="capture-btn"><Camera size={32}/></button>
          </div>
        )}

        {view === 'formulario' && (
          <div className="card" style={{padding:'20px'}}>
            <h3 style={{color: corporativoRed, marginBottom:'15px'}}>Detalles del Pesaje</h3>
            <img src={photo} style={{width:'100%', borderRadius:'8px', marginBottom:'15px'}} alt="Captura"/>
            <input type="number" placeholder="Peso en KG" value={pesoManual} onChange={e=>setPesoManual(e.target.value)} style={{fontSize:'1.2rem', padding:'12px'}} />
            <textarea placeholder="Observaciones..." value={observaciones} onChange={e=>setObservaciones(e.target.value)} />
            <button onClick={guardarControl} disabled={loading} style={{backgroundColor: corporativoRed, width:'100%', padding:'15px', color:'white', borderRadius:'8px', fontWeight:'bold'}}>
              {loading ? <RefreshCw className="animate-spin" /> : 'GUARDAR REGISTRO'}
            </button>
          </div>
        )}

        {view === 'historial' && (
          <div style={{padding:'5px'}}>
            
            {/* --- TARJETA DE GRAN TOTAL --- */}
            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', borderLeft: `5px solid ${corporativoRed}`, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom:'15px' }}>
              <p style={{ fontSize: '10px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>Gran Total Acumulado</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#333' }}>{totalGeneral.toLocaleString()}</span>
                <span style={{ fontSize: '14px', color: '#999' }}>KG</span>
              </div>
            </div>

            <div className="filters card" style={{padding:'10px', marginBottom:'15px'}}>
              <select value={filtroSede} onChange={e=>setFiltroSede(e.target.value)}>
                <option value="">Todas las Sedes</option>
                {sitios.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
              </select>
              <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
                <input type="date" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} />
                <input type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} />
              </div>
              <button onClick={aplicarFiltros} style={{backgroundColor: corporativoRed, color:'white', width:'100%', marginTop:'5px', border:'none', padding:'8px', borderRadius:'4px'}}>FILTRAR</button>
            </div>

            {reportesFiltrados.map(r => (
              <div key={r.id} className="card" style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', padding:'10px', borderLeft:`5px solid ${corporativoRed}`}}>
                <div style={{textAlign:'left'}}>
                  <strong>{r.nombre_sitio}</strong><br/>
                  <span style={{color: corporativoRed, fontWeight:'bold'}}>{r.peso_manual} kg</span><br/>
                  <small>{new Date(r.created_at).toLocaleString()}</small>
                </div>
                <button onClick={()=>{const w=window.open();w.document.write(`<img src="${r.foto_url}" style="width:100%"/>`)}} style={{background:'none', border:'none', color: corporativoRed}}><ImageIcon size={24}/></button>
              </div>
            ))}

            {/* --- BOTÓN CARGAR MÁS --- */}
            {hayMas && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '30px' }}>
                <button
                  onClick={() => cargarDatos(pagina + 1)}
                  disabled={loading}
                  style={{
                    backgroundColor: 'white',
                    border: `2px solid ${corporativoRed}`,
                    color: corporativoRed,
                    padding: '10px 20px',
                    borderRadius: '25px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
                  Ver más anteriores
                </button>
              </div>
            )}
          </div>
        )}

        {view === 'admin' && (
          <div style={{padding:'10px'}}>
            <h3 style={{color: corporativoRed, marginBottom:'15px'}}>Panel de Administración</h3>
            <form onSubmit={async e=>{
              e.preventDefault();
              const nuevoSitio = { nombre: e.target[0].value, ciudad: e.target[1].value };
              await supabase.from('sitios').insert([nuevoSitio]);
              e.target.reset();
              cargarDatos();
            }} className="card" style={{padding:'15px', marginBottom:'15px'}}>
              <h4 style={{color: corporativoRed}}>Nueva Sede</h4>
              <input placeholder="Nombre Sede" required />
              <input placeholder="Ciudad" required />
              <button style={{backgroundColor: corporativoRed, color:'white', width:'100%', padding:'10px', marginTop:'10px', border:'none', borderRadius:'8px', fontWeight:'bold'}}>CREAR SEDE</button>
            </form>
            <div className="card">
              {sitios.map(s => (
                <div key={s.id} style={{padding:'10px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}>
                  <span>{s.nombre} ({s.ciudad})</span>
                  <button onClick={async()=>{if(confirm('¿Eliminar sede?')){await supabase.from('sitios').delete().eq('id', s.id); cargarDatos();}}} style={{color: corporativoRed, border:'none', background:'none'}}><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{display:'none'}} />
    </div>
  );
};

export default OroJuezApp;