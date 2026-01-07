import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './style.css'; 
import { Camera, LogOut, Eye, Users, FileText, Download, RefreshCw, Search, Image as ImageIcon } from 'lucide-react';

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
      
      const rolesAdmin = ['admin', 'superadmin', 'auditor'];
      if (!rolesAdmin.includes(user.rol)) {
        query = query.eq('usuario_email', user.email);
      }
      
      const { data: r, error } = await query;
      if (error) throw error;
      setReportes(r || []);
      setReportesFiltrados(r || []);
    } catch (err) {
      console.error("Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let temp = [...reportes];
    if (filtroSede) temp = temp.filter(r => String(r.sitio_id) === String(filtroSede));
    if (filtroUsuario) temp = temp.filter(r => r.usuario_email === filtroUsuario);
    if (fechaInicio) temp = temp.filter(r => r.created_at >= fechaInicio);
    if (fechaFin) temp = temp.filter(r => r.created_at <= fechaFin + 'T23:59:59');
    setReportesFiltrados(temp);
  };

  // Cálculo del Total de Pesos
  const totalPesos = reportesFiltrados.reduce((sum, r) => sum + (parseFloat(r.peso_manual) || 0), 0);

  const exportarExcel = () => {
    const encabezados = "Fecha,Sede,Usuario,Peso(kg),Observaciones\n";
    const filas = reportesFiltrados.map(r => 
      `${new Date(r.created_at).toLocaleString().replace(',', ' ')},${r.nombre_sitio},${r.nombre_usuario},${r.peso_manual},${r.observaciones || ''}`
    ).join("\n");
    const totalFila = `,,,TOTAL,${totalPesos.toFixed(2)}`;
    const blob = new Blob([encabezados + filas + "\n" + totalFila], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_OroJuez.csv`;
    link.click();
  };

  const guardarControl = async () => {
    if (!photo || !pesoManual) return alert("Falta foto o peso.");
    setLoading(true);
    const { error } = await supabase.from('reportes_pesaje').insert([{
      sitio_id: user.sitio_id,
      nombre_sitio: user.nombre_sitio || 'Sede',
      usuario_email: user.email,
      nombre_usuario: user.nombre,
      peso_manual: parseFloat(pesoManual),
      foto_url: photo,
      observaciones: observaciones
    }]);

    if (!error) {
      alert("¡Registro guardado!");
      setPhoto(null); setPesoManual(''); setObservaciones('');
      await cargarDatos();
      setView('historial');
    } else {
      alert("Error: " + error.message);
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
      <div className="navbar"><h1>ORO JUEZ V5.9</h1></div>
      <form onSubmit={handleLogin} style={{marginTop:'30px', display:'flex', flexDirection:'column', gap:'15px'}}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Clave" required />
        <button className="navbar" style={{color:'white', border:'none', padding:'15px', borderRadius:'8px', fontWeight:'bold'}}>INGRESAR</button>
      </form>
    </div>
  );

  return (
    <div className="container">
      <div className="navbar" style={{display:'flex', justifyContent:'space-between', padding:'10px 20px'}}>
        <span style={{fontSize:'0.9rem'}}>{user.nombre}</span>
        <div style={{display:'flex', gap:'10px'}}>
          <button onClick={cargarDatos} style={{background:'none', border:'none', color:'white'}}><RefreshCw size={18} className={loading ? 'spin' : ''}/></button>
          <button onClick={() => setView('login')} style={{color:'white', background:'none', border:'none'}}><LogOut size={18}/></button>
        </div>
      </div>

      <div style={{display:'flex', gap:'5px', margin:'10px'}}>
        <button onClick={() => setView('dashboard')} className="card" style={{flex:1, padding:'10px', fontSize:'12px', border:view==='dashboard'?'2px solid #ffc107':'none'}}>CAPTURAR</button>
        <button onClick={() => setView('historial')} className="card" style={{flex:1, padding:'10px', fontSize:'12px', border:view==='historial'?'2px solid #ffc107':'none'}}>HISTORIAL</button>
        {['admin', 'superadmin', 'auditor'].includes(user.rol) && (
          <button onClick={() => setView('reportes')} className="card" style={{flex:1, padding:'10px', fontSize:'12px', border:view==='reportes'?'2px solid #ffc107':'none'}}>REPORTES</button>
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
                }} className="navbar" style={{width:'100%', color:'white', padding:'12px', marginTop:'10px', borderRadius:'8px'}}>TOMAR FOTO</button>
              </div>
            )}
            {photo && (
              <div>
                <img src={photo} style={{width:'100%', borderRadius:'10px', border:'2px solid #ffc107'}} />
                <input type="number" value={pesoManual} onChange={e=>setPesoManual(e.target.value)} placeholder="0.00 kg" style={{fontSize:'2rem', textAlign:'center', width:'100%', margin:'10px 0', border:'1px solid #ddd'}} />
                <textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} placeholder="Observaciones..." style={{width:'100%', padding:'8px', marginBottom:'10px'}} />
                <button onClick={guardarControl} disabled={loading} className="navbar" style={{width:'100%', color:'white', padding:'15px', borderRadius:'8px'}}>GUARDAR</button>
                <button onClick={()=>setPhoto(null)} style={{width:'100%', marginTop:'5px', background:'none', border:'none', fontSize:'12px'}}>Repetir</button>
              </div>
            )}
          </div>
        )}

        {view === 'historial' && (
          <div style={{padding:'5px'}}>
            {reportesFiltrados.length === 0 ? <p>No hay registros.</p> : 
              reportesFiltrados.map(r => (
                <div key={r.id} className="card" style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', padding:'10px', textAlign:'left'}}>
                  <div>
                    <strong style={{fontSize:'0.8rem'}}>{r.nombre_sitio}</strong><br/>
                    <span style={{fontSize:'1.1rem', color:'#ffc107', fontWeight:'bold'}}>{r.peso_manual} kg</span><br/>
                    <small style={{fontSize:'0.7rem'}}>{new Date(r.created_at).toLocaleString()}</small>
                  </div>
                  <button onClick={()=>window.open(r.foto_url, '_blank')} className="navbar" style={{color:'white', padding:'8px', borderRadius:'5px'}}><ImageIcon size={18}/></button>
                </div>
              ))
            }
          </div>
        )}

        {view === 'reportes' && (
          <div style={{padding:'5px'}}>
             <div className="card" style={{padding:'10px', textAlign:'left', marginBottom:'10px'}}>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px'}}>
                  <input type="date" value={fechaInicio} onChange={e=>setFiltroSede(e.target.value)} style={{fontSize:'11px'}} />
                  <input type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} style={{fontSize:'11px'}} />
                  <select value={filtroSede} onChange={e=>setFiltroSede(e.target.value)} style={{fontSize:'11px'}}>
                    <option value="">Sedes</option>
                    {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                  <button onClick={aplicarFiltros} className="navbar" style={{color:'white', fontSize:'11px', borderRadius:'5px'}}><Search size={14}/> FILTRAR</button>
                </div>
                <button onClick={exportarExcel} style={{width:'100%', marginTop:'5px', padding:'8px', borderRadius:'5px', border:'1px solid #28a745', color:'#28a745', fontSize:'11px'}}><Download size={14}/> EXCEL</button>
             </div>
             
             <div className="card" style={{overflowX:'auto', padding:'5px'}}>
                <table style={{width:'100%', fontSize:'10px', borderCollapse:'collapse'}}>
                    <thead>
                      <tr style={{background:'#f0f0f0'}}>
                        <th style={{padding:'5px', border:'1px solid #ddd'}}>Fecha/Usuario</th>
                        <th style={{padding:'5px', border:'1px solid #ddd'}}>Sede</th>
                        <th style={{padding:'5px', border:'1px solid #ddd'}}>Peso</th>
                        <th style={{padding:'5px', border:'1px solid #ddd'}}>F</th>
                      </tr>
                    </thead>
                    <tbody>
                        {reportesFiltrados.map(r => (
                            <tr key={r.id}>
                                <td style={{padding:'5px', border:'1px solid #ddd'}}>{new Date(r.created_at).toLocaleDateString()}<br/>{r.nombre_usuario}</td>
                                <td style={{padding:'5px', border:'1px solid #ddd'}}>{r.nombre_sitio}</td>
                                <td style={{padding:'5px', border:'1px solid #ddd'}}><strong>{r.peso_manual}</strong></td>
                                <td style={{padding:'5px', border:'1px solid #ddd'}}>
                                  <button onClick={()=>window.open(r.foto_url, '_blank')} style={{border:'none', background:'none', color:'#ffc107'}}><ImageIcon size={14}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr style={{background:'#eee', fontWeight:'bold'}}>
                        <td colSpan="2" style={{padding:'5px', textAlign:'right', border:'1px solid #ddd'}}>TOTAL:</td>
                        <td style={{padding:'5px', border:'1px solid #ddd'}}>{totalPesos.toFixed(2)}kg</td>
                        <td style={{border:'1px solid #ddd'}}></td>
                      </tr>
                    </tfoot>
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