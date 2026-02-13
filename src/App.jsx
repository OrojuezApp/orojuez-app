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
  
  // Cambiado 'operador' por 'OPERATIVO' según tu esquema
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', nombre: '', sitio_id: '', rol: 'OPERATIVO', password: '' });
  const [nuevoSitio, setNuevoSitio] = useState({ nombre: '', ciudad: '' });

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
      // CAMBIO: Tabla 'perfiles_usuarios' según tu esquema
      const { data: u } = await supabase.from('perfiles_usuarios').select('*').order('nombre');
      setSitios(s || []);
      setUsuarios(u || []);

      let query = supabase.from('reportes_pesaje').select('*').order('created_at', { ascending: false });
      if (user?.rol !== 'ADMIN') {
        query = query.eq('usuario_email', user?.email);
      }
      const { data: r } = await query;
      setReportes(r || []);
      setReportesFiltrados(r || []);
    } catch (err) { console.error("Error:", err); } 
    finally { setLoading(false); }
  };

  const aplicarFiltros = () => {
    let temp = [...reportes];

    if (filtroSede) {
      temp = temp.filter(r => 
        (r.sitio_nombre && r.sitio_nombre === filtroSede) || 
        (r.nombre_sitio && r.nombre_sitio === filtroSede)
      );
    }

    if (fechaInicio) {
      temp = temp.filter(r => {
        if (!r.created_at) return false;
        const fechaRegistroLiteral = r.created_at.split(' ')[0];
        return fechaRegistroLiteral >= fechaInicio;
      });
    }

    if (fechaFin) {
      temp = temp.filter(r => {
        if (!r.created_at) return false;
        const fechaRegistroLiteral = r.created_at.split(' ')[0];
        return fechaRegistroLiteral <= fechaFin;
      });
    }

    setReportesFiltrados(temp);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { email, password } = e.target.elements;
    
    // CAMBIO: Se usa la tabla 'perfiles_usuarios' para validar el login
    const { data, error } = await supabase
      .from('perfiles_usuarios')
      .select('*')
      .eq('email', email.value)
      .eq('password', password.value)
      .single();

    if (data) { 
      setUser(data); 
      // Ajuste de rol según tu esquema (ADMIN / OPERATIVO)
      setView(data.rol === 'ADMIN' ? 'admin' : 'operador'); 
    } else { 
      alert("Credenciales incorrectas"); 
    }
    setLoading(false);
  };

  const startCamera = async () => {
    setStreaming(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    videoRef.current.srcObject = stream;
  };

  const takePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 400, 300);
    setPhoto(canvasRef.current.toDataURL('image/jpeg'));
    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    setStreaming(false);
  };

  const guardarPesaje = async () => {
    if (!pesoManual) return alert("Ingrese el peso");
    setLoading(true);
    const { error } = await supabase.from('reportes_pesaje').insert([{
      usuario_email: user.email,
      nombre_usuario: user.nombre, // Campo según tu esquema
      sitio_id: user.sitio_id,
      sitio_nombre: sitios.find(s => s.id === user.sitio_id)?.nombre,
      peso_manual: parseFloat(pesoManual), // Campo según tu esquema
      observaciones,
      foto_url: photo
    }]);
    if (!error) { alert("Pesaje Guardado"); setPhoto(null); setPesoManual(''); setObservaciones(''); cargarDatos(); }
    setLoading(false);
  };

  return (
    <div style={{minHeight:'100vh', backgroundColor:'#f4f4f4', fontFamily:'sans-serif'}}>
      <nav style={{backgroundColor: corporativoRed, color:'white', padding:'15px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.2)'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <ShieldCheck size={28}/>
          <h2 style={{margin:0, fontSize:'1.2rem'}}>ORO JUEZ {view.toUpperCase()}</h2>
        </div>
        {user && <button onClick={()=>{setUser(null); setView('login');}} style={{background:'none', border:'none', color:'white'}}><LogOut/></button>}
      </nav>

      <div style={{padding:'20px', maxWidth:'1200px', margin:'0 auto'}}>
        {view === 'login' && (
          <div className="card" style={{maxWidth:'400px', margin:'100px auto', padding:'30px', textAlign:'center'}}>
            <h3 style={{color: corporativoRed, marginBottom:'20px'}}>INICIAR SESIÓN</h3>
            <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
              <input name="email" type="email" placeholder="Correo Electrónico" required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ccc'}} />
              <input name="password" type="password" placeholder="Contraseña" required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ccc'}} />
              <button type="submit" disabled={loading} style={{backgroundColor: corporativoRed, color:'white', padding:'12px', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>
                {loading ? 'CARGANDO...' : 'ENTRAR'}
              </button>
            </form>
          </div>
        )}

        {(view === 'admin' || view === 'operador') && (
          <div>
            <div style={{display:'flex', gap:'10px', marginBottom:'20px', overflowX:'auto', paddingBottom:'10px'}}>
              <button onClick={()=>setEditMode(false)} style={{backgroundColor: !editMode ? corporativoRed : 'white', color: !editMode ? 'white' : '#333', padding:'10px 20px', borderRadius:'8px', border:'1px solid #eee'}}>REGISTRO</button>
              <button onClick={()=>setEditMode(true)} style={{backgroundColor: editMode ? corporativoRed : 'white', color: editMode ? 'white' : '#333', padding:'10px 20px', borderRadius:'8px', border:'1px solid #eee'}}>REPORTES</button>
              {user.rol === 'ADMIN' && <button onClick={()=>setView('config')} style={{backgroundColor:'white', color:'#333', padding:'10px 20px', borderRadius:'8px', border:'1px solid #eee'}}>CONFIG</button>}
            </div>

            {!editMode ? (
              <div className="card" style={{padding:'20px'}}>
                <h3 style={{color: corporativoRed, display:'flex', alignItems:'center', gap:'10px', borderBottom:'2px solid #eee', paddingBottom:'10px'}}><Camera/> Capturar Pesaje</h3>
                <div style={{marginTop:'20px', display:'flex', flexDirection:'column', gap:'15px'}}>
                  <div style={{width:'100%', height:'250px', backgroundColor:'#000', borderRadius:'12px', overflow:'hidden', position:'relative', display:'flex', justifyContent:'center', alignItems:'center'}}>
                    {streaming ? (
                      <video ref={videoRef} autoPlay playsInline style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    ) : photo ? (
                      <img src={photo} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    ) : (
                      <button onClick={startCamera} style={{backgroundColor:'white', border:'none', padding:'15px', borderRadius:'50%'}}><Camera size={30} color={corporativoRed}/></button>
                    )}
                    {streaming && <button onClick={takePhoto} style={{position:'absolute', bottom:'20px', backgroundColor: corporativoRed, color:'white', border:'none', padding:'15px', borderRadius:'50%'}}><Camera/></button>}
                  </div>
                  
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                    <div>
                      <label style={{fontSize:'0.8rem', fontWeight:'bold', color:'#666'}}>PESO (KG)</label>
                      <input type="number" value={pesoManual} onChange={e=>setPesoManual(e.target.value)} placeholder="0.00" style={{width:'100%', padding:'15px', fontSize:'1.5rem', fontWeight:'bold', textAlign:'center', border:'2px solid #eee', borderRadius:'10px'}} />
                    </div>
                    <div>
                      <label style={{fontSize:'0.8rem', fontWeight:'bold', color:'#666'}}>OBSERVACIONES</label>
                      <textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} style={{width:'100%', padding:'10px', height:'55px', borderRadius:'10px', border:'1px solid #ccc'}} />
                    </div>
                  </div>
                  <button onClick={guardarPesaje} disabled={loading} style={{backgroundColor:'#28a745', color:'white', padding:'18px', border:'none', borderRadius:'12px', fontWeight:'bold', fontSize:'1.1rem'}}>{loading ? 'GUARDANDO...' : 'GUARDAR PESAJE'}</button>
                </div>
              </div>
            ) : (
              <div className="card" style={{padding:'20px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                  <h3 style={{margin:0, color: corporativoRed}}><FileText/> Reportes</h3>
                  <button onClick={() => {
                    const headers = "Fecha,Hora,Sede,Usuario,Peso (kg),Observaciones\n";
                    const csvContent = reportesFiltrados.map(r => {
                        const fecha = r.created_at ? new Date(r.created_at).toLocaleDateString() : '';
                        const hora = r.created_at ? new Date(r.created_at).toLocaleTimeString() : '';
                        const sede = r.sitio_nombre || r.nombre_sitio || '';
                        return `"${fecha}","${hora}","${sede}","${r.nombre_usuario || ''}",${r.peso_manual || 0},"${(r.observaciones || '').replace(/\n/g, ' ')}"`;
                    }).join("\n");
                    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.setAttribute("download", `Reporte_Orojuez_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }} style={{backgroundColor:'#28a745', color:'white', border:'none', padding:'8px 15px', borderRadius:'8px', display:'flex', alignItems:'center', gap:'5px'}}><Download size={18}/> CSV</button>
                </div>

                <div style={{backgroundColor:'#f9f9f9', padding:'15px', borderRadius:'12px', marginBottom:'20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                  <div style={{gridColumn:'1 / span 2'}}>
                    <select value={filtroSede} onChange={e=>setFiltroSede(e.target.value)} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #ccc'}}>
                      <option value="">Todas las Sedes</option>
                      {sitios.map(s=><option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                    </select>
                  </div>
                  <input type="date" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} style={{padding:'10px', borderRadius:'8px', border:'1px solid #ccc'}} />
                  <input type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} style={{padding:'10px', borderRadius:'8px', border:'1px solid #ccc'}} />
                  <button onClick={aplicarFiltros} style={{gridColumn:'1 / span 2', backgroundColor: corporativoRed, color:'white', padding:'12px', border:'none', borderRadius:'8px', fontWeight:'bold'}}><Search size={18}/> FILTRAR RESULTADOS</button>
                </div>

                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.9rem'}}>
                    <thead style={{backgroundColor:'#eee'}}>
                      <tr>
                        <th style={{padding:'12px', textAlign:'left'}}>Fecha</th>
                        <th style={{padding:'12px', textAlign:'left'}}>Sede</th>
                        <th style={{padding:'12px', textAlign:'right'}}>Peso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportesFiltrados.map((r, i) => (
                        <tr key={i} style={{borderBottom:'1px solid #eee'}}>
                          <td style={{padding:'12px'}}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'S/F'} {r.created_at ? new Date(r.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</td>
                          <td style={{padding:'12px'}}>{r.sitio_nombre || r.nombre_sitio}</td>
                          <td style={{padding:'12px', textAlign:'right', fontWeight:'bold'}}>{r.peso_manual} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'config' && (
          <div style={{display:'grid', gap:'20px'}}>
            <button onClick={()=>setView('admin')} style={{padding:'10px', backgroundColor:'#666', color:'white', border:'none', borderRadius:'8px'}}>VOLVER</button>
            <form onSubmit={async e=>{e.preventDefault(); await supabase.from('perfiles_usuarios').insert([nuevoUsuario]); setNuevoUsuario({email:'', nombre:'', sitio_id:'', rol:'OPERATIVO', password:''}); cargarDatos();}} className="card" style={{padding:'15px', marginBottom:'15px'}}>
              <h4 style={{color: corporativoRed}}>Nuevo Usuario</h4>
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                <input value={nuevoUsuario.email} onChange={e=>setNuevoUsuario({...nuevoUsuario, email:e.target.value})} placeholder="Email" required />
                <input value={nuevoUsuario.nombre} onChange={e=>setNuevoUsuario({...nuevoUsuario, nombre:e.target.value})} placeholder="Nombre" required />
                <input value={nuevoUsuario.password} onChange={e=>setNuevoUsuario({...nuevoUsuario, password:e.target.value})} placeholder="Contraseña" required />
                <select value={nuevoUsuario.sitio_id} onChange={e=>setNuevoUsuario({...nuevoUsuario, sitio_id:e.target.value})} required>
                  <option value="">Asignar Sede</option>
                  {sitios.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                <button style={{backgroundColor: corporativoRed, color:'white', padding:'10px', border:'none', borderRadius:'8px'}}>CREAR USUARIO</button>
              </div>
            </form>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} width="400" height="300" style={{display:'none'}}></canvas>
    </div>
  );
};

export default OroJuezApp;