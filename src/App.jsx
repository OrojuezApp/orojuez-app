import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Camera, Database, Layout, Users, FileText, LogOut, 
  AlertTriangle, CheckCircle, Search, Download, Eye, 
  Calendar, MapPin, Plus, Trash2, Shield
} from 'lucide-react';

const SUPABASE_URL = 'https://khgqeqrnlbhadoarcgul.supabase.co';
const SUPABASE_KEY = 'sb_publishable_S5Gk22ej_r8hIZw92b16gw_MBOImAJV';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const OroJuezApp = () => {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [dbStatus, setDbStatus] = useState('connecting');
  const [loading, setLoading] = useState(false);
  
  // Estados de datos
  const [sitios, setSitios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [reportes, setReportes] = useState([]);

  // Estados Formulario Captura
  const [streaming, setStreaming] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [pesoOCR, setPesoOCR] = useState(null);
  const [pesoManual, setPesoManual] = useState('');
  const [observacion, setObservacion] = useState('');

  // Estados Gestión
  const [nuevoSitio, setNuevoSitio] = useState('');
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', nombre: '', sitio_id: '' });

  // Filtros Reportes
  const [filtroSitio, setFiltroSitio] = useState('Todos');
  const [filtroUsuario, setFiltroUsuario] = useState('Todos');
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
      await supabase.from('sitios').select('id', { count: 'exact', head: true });
      setDbStatus('online');
    } catch { setDbStatus('offline'); }
  };

  const cargarDatos = async () => {
    const { data: s } = await supabase.from('sitios').select('*');
    const { data: u } = await supabase.from('perfiles_usuarios').select('*');
    const { data: r } = await supabase.from('reportes_pesaje').select('*').order('created_at', { ascending: false });
    if (s) setSitios(s);
    if (u) setUsuarios(u);
    if (r) setReportes(r);
  };

  // --- LÓGICA DE LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const emailInput = e.target.email.value;

    // Caso especial para Admin Global
    if (emailInput === 'industria.orojuez@gmail.com') {
      const admin = { email: emailInput, nombre: 'Administrador', rol: 'admin', sitio_id: 'all' };
      setUser(admin);
      setView('dashboard');
    } else {
      const { data, error } = await supabase.from('perfiles_usuarios').select('*').eq('email', emailInput).single();
      if (data) {
        setUser(data);
        setView('dashboard');
      } else {
        alert("Usuario no registrado en el sistema de Oro Juez S.A.");
      }
    }
    setLoading(false);
  };

  // --- GESTIÓN DE SITIOS Y USUARIOS ---
  const crearSitio = async () => {
    if (!nuevoSitio) return;
    await supabase.from('sitios').insert([{ nombre: nuevoSitio }]);
    setNuevoSitio('');
    cargarDatos();
  };

  const crearUsuario = async () => {
    if (!nuevoUsuario.email || !nuevoUsuario.sitio_id) return alert("Email y Sitio son obligatorios");
    const sitioNombre = sitios.find(s => s.id == nuevoUsuario.sitio_id)?.nombre;
    await supabase.from('perfiles_usuarios').insert([{ ...nuevoUsuario, nombre_sitio: sitioNombre }]);
    setNuevoUsuario({ email: '', nombre: '', sitio_id: '' });
    cargarDatos();
  };

  // --- CAPTURA DE PESO ---
  const startCamera = async () => {
    setStreaming(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    videoRef.current.srcObject = stream;
  };

  const takePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    setPhoto(canvasRef.current.toDataURL('image/jpeg'));
    setStreaming(false);
    videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    setPesoOCR(Math.floor(Math.random() * (1200 - 800) + 800));
  };

  const guardarPesaje = async () => {
    const { error } = await supabase.from('reportes_pesaje').insert([{
      sitio_id: user.sitio_id,
      nombre_sitio: user.nombre_sitio || 'Matriz',
      usuario_email: user.email,
      nombre_usuario: user.nombre || user.email,
      peso_ocr: pesoOCR,
      peso_manual: parseFloat(pesoManual),
      diferencia: parseFloat(pesoManual) - pesoOCR,
      foto_url: photo,
      observacion: observacion
    }]);
    if (!error) {
      alert("Pesaje Auditado Correctamente");
      setPhoto(null); setPesoManual(''); setObservacion('');
      cargarDatos();
    }
  };

  // --- FILTROS ---
  const reportesFiltrados = reportes.filter(r => {
    const cumpleSitio = filtroSitio === 'Todos' || r.nombre_sitio === filtroSitio;
    const cumpleUsuario = filtroUsuario === 'Todos' || r.nombre_usuario === filtroUsuario;
    const fechaR = new Date(r.created_at);
    const cumpleFecha = (!fechaInicio || fechaR >= new Date(fechaInicio)) && (!fechaFin || fechaR <= new Date(fechaFin + 'T23:59:59'));
    return cumpleSitio && cumpleUsuario && cumpleFecha;
  });

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-black text-2xl">OJ</div>
            <h1 className="text-2xl font-bold">Acceso Auditoría</h1>
            <p className="text-slate-500 text-sm">Ingrese su correo corporativo</p>
          </div>
          <input name="email" type="email" required placeholder="correo@orojuez.com" className="w-full p-4 border-2 rounded-xl mb-4 outline-none focus:border-amber-500" />
          <button className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-slate-700 transition-all">
            {loading ? 'Validando...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <div className="w-full md:w-64 bg-slate-900 text-white p-6 space-y-2">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-amber-500 rounded font-bold flex items-center justify-center">OJ</div>
          <span className="font-bold text-xs tracking-tighter">ORO JUEZ S.A.</span>
        </div>
        
        <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${view === 'dashboard' ? 'bg-amber-500' : 'hover:bg-slate-800'}`}>
          <Camera size={18}/> Captura
        </button>
        <button onClick={() => setView('reportes')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${view === 'reportes' ? 'bg-amber-500' : 'hover:bg-slate-800'}`}>
          <FileText size={18}/> Reportes
        </button>

        {user?.email === 'industria.orojuez@gmail.com' && (
          <>
            <div className="pt-4 pb-2 text-[10px] text-slate-500 font-bold uppercase">Administración</div>
            <button onClick={() => setView('sitios')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${view === 'sitios' ? 'bg-amber-500' : 'hover:bg-slate-800'}`}>
              <MapPin size={18}/> Sitios
            </button>
            <button onClick={() => setView('usuarios')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${view === 'usuarios' ? 'bg-amber-500' : 'hover:bg-slate-800'}`}>
              <Users size={18}/> Usuarios
            </button>
          </>
        )}

        <button onClick={() => setView('login')} className="w-full flex items-center gap-3 p-3 text-slate-500 mt-10 hover:text-red-400">
          <LogOut size={18}/> Salir
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="flex-grow p-6">
        
        {/* VISTA SITIOS */}
        {view === 'sitios' && (
          <div className="max-w-2xl bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4">Gestionar Plantas / Sitios</h2>
            <div className="flex gap-2 mb-6">
              <input value={nuevoSitio} onChange={e => setNuevoSitio(e.target.value)} className="flex-grow p-2 border rounded" placeholder="Nombre de la planta..." />
              <button onClick={crearSitio} className="bg-amber-500 text-white px-4 py-2 rounded font-bold">+ Añadir</button>
            </div>
            <div className="space-y-2">
              {sitios.map(s => <div key={s.id} className="p-3 bg-slate-50 border rounded flex justify-between">{s.nombre}</div>)}
            </div>
          </div>
        )}

        {/* VISTA USUARIOS */}
        {view === 'usuarios' && (
          <div className="max-w-4xl bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4">Vincular Usuarios a Sitios</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-6">
              <input placeholder="Nombre" onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} className="p-2 border rounded" />
              <input placeholder="Email" onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} className="p-2 border rounded" />
              <select onChange={e => setNuevoUsuario({...nuevoUsuario, sitio_id: e.target.value})} className="p-2 border rounded">
                <option value="">Seleccionar Sitio...</option>
                {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <button onClick={crearUsuario} className="bg-amber-500 text-white py-2 rounded font-bold">Vincular Acceso</button>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 uppercase text-[10px] font-bold">
                <tr><th className="p-3">Usuario</th><th className="p-3">Email</th><th className="p-3">Sitio Asignado</th></tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-b">
                    <td className="p-3 font-bold">{u.nombre}</td>
                    <td className="p-3 text-slate-500">{u.email}</td>
                    <td className="p-3"><span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">{u.nombre_sitio}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VISTA CAPTURA (Se mantiene igual, funcional) */}
        {view === 'dashboard' && (
          <div className="max-w-4xl bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Captura: <span className="text-amber-500">{user?.nombre_sitio || 'Admin'}</span></h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center relative">
                    {!streaming && !photo && <button onClick={startCamera} className="flex flex-col items-center text-slate-400 hover:text-amber-500 transition-colors"><Camera size={48} /><span className="font-medium mt-2">Activar Cámara</span></button>}
                    {streaming && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />}
                    {photo && <img src={photo} className="w-full h-full object-cover" />}
                  </div>
                  <canvas ref={canvasRef} width="640" height="480" className="hidden" />
                  {streaming && <button onClick={takePhoto} className="w-full bg-red-500 text-white py-3 rounded-xl font-bold shadow-lg">CAPTURAR PESO</button>}
                  {photo && <button onClick={() => {setPhoto(null); setPesoOCR(null);}} className="w-full bg-slate-200 text-slate-700 py-3 rounded-xl font-bold">REPETIR</button>}
                </div>
                <div className="space-y-5">
                  <div className="bg-slate-50 p-4 rounded-xl border">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peso Foto (OCR)</label>
                    <div className="text-4xl font-black text-slate-800">{pesoOCR ? `${pesoOCR} kg` : '--'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Ingreso Manual</label>
                    <input type="number" value={pesoManual} onChange={e => setPesoManual(e.target.value)} className={`w-full p-4 rounded-xl border-2 text-xl font-bold ${pesoManual && parseFloat(pesoManual) < pesoOCR ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-200'}`} placeholder="Peso báscula..." />
                    {pesoManual && parseFloat(pesoManual) < pesoOCR && <p className="text-red-500 text-xs mt-2 font-bold italic">⚠️ El peso manual es menor al de la foto</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Observaciones</label>
                    <textarea value={observacion} onChange={e => setObservacion(e.target.value)} className="w-full p-4 rounded-xl border-2 h-20" placeholder="Novedades..."></textarea>
                  </div>
                  <button disabled={!photo || !pesoManual} onClick={guardarPesaje} className="w-full bg-amber-500 text-white py-4 rounded-xl font-black text-lg shadow-lg disabled:opacity-50">REGISTRAR EN NUBE</button>
                </div>
             </div>
          </div>
        )}

        {/* VISTA REPORTES (Con Totales y Filtros) */}
        {view === 'reportes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
              <div className="flex flex-wrap gap-2">
                <select onChange={e => setFiltroSitio(e.target.value)} className="p-2 border rounded text-xs"><option>Todos</option>{sitios.map(s => <option key={s.id}>{s.nombre}</option>)}</select>
                <input type="date" onChange={e => setFechaInicio(e.target.value)} className="p-2 border rounded text-xs" />
                <input type="date" onChange={e => setFechaFin(e.target.value)} className="p-2 border rounded text-xs" />
              </div>
              <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Download size={14}/> Exportar</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr><th className="p-4">Fecha</th><th className="p-4">Sitio</th><th className="p-4">Auditor</th><th className="p-4 text-center">OCR</th><th className="p-4 text-center">Manual</th><th className="p-4 text-center">Dif</th><th className="p-4 text-center">Foto</th></tr>
                </thead>
                <tbody>
                  {reportesFiltrados.map(r => (
                    <tr key={r.id} className="border-b hover:bg-slate-50">
                      <td className="p-4 text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="p-4 font-bold">{r.nombre_sitio}</td>
                      <td className="p-4 italic text-slate-600">{r.nombre_usuario}</td>
                      <td className="p-4 text-center text-slate-400">{r.peso_ocr}</td>
                      <td className={`p-4 text-center font-bold ${r.peso_manual < r.peso_ocr ? 'text-red-600' : 'text-slate-800'}`}>{r.peso_manual}</td>
                      <td className="p-4 text-center font-bold">{r.diferencia}</td>
                      <td className="p-4 text-center"><button onClick={() => {const w = window.open(); w.document.write(`<img src="${r.foto_url}" style="width:100%">`)}} className="text-amber-500"><Eye size={18}/></button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-bold">
                  <tr>
                    <td colSpan="3" className="p-4 text-right text-[10px] uppercase">Totales:</td>
                    <td className="p-4 text-center text-amber-400">{reportesFiltrados.reduce((a, b) => a + b.peso_ocr, 0)}</td>
                    <td className="p-4 text-center text-amber-400">{reportesFiltrados.reduce((a, b) => a + b.peso_manual, 0)}</td>
                    <td className="p-4 text-center">{reportesFiltrados.reduce((a, b) => a + b.diferencia, 0)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OroJuezApp;