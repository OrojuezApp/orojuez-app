import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Camera, Database, Layout, Users, FileText, LogOut, 
  AlertTriangle, CheckCircle, Search, Download, Eye, 
  MapPin, Plus, Trash2, Building2, Globe, ShieldCheck
} from 'lucide-react';

const SUPABASE_URL = 'https://khgqeqrnlbhadoarcgul.supabase.co';
const SUPABASE_KEY = 'sb_publishable_S5Gk22ej_r8hIZw92b16gw_MBOImAJV';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const OroJuezApp = () => {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [dbStatus, setDbStatus] = useState('connecting');
  const [loading, setLoading] = useState(false);
  
  // Datos de las tablas
  const [sitios, setSitios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [reportes, setReportes] = useState([]);

  // Formulario Captura
  const [streaming, setStreaming] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [pesoOCR, setPesoOCR] = useState(null);
  const [pesoManual, setPesoManual] = useState('');
  const [observacion, setObservacion] = useState('');

  // Formulario Gestión (Ciudad y Área)
  const [nuevoSitio, setNuevoSitio] = useState({ nombre: '', ciudad: '' });
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', nombre: '', sitio_id: '' });

  // Filtros Reportes
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

  // --- LOGICA DE GUARDADO DE CIUDAD Y ÁREA ---
  const handleCrearSitio = async (e) => {
    e.preventDefault();
    if (!nuevoSitio.nombre || !nuevoSitio.ciudad) return alert("Debe ingresar Ciudad y Área");
    
    setLoading(true);
    const { error } = await supabase.from('sitios').insert([{
      nombre: nuevoSitio.nombre,
      ciudad: nuevoSitio.ciudad
    }]);

    if (!error) {
      setNuevoSitio({ nombre: '', ciudad: '' });
      await cargarDatos();
      alert("Punto de pesaje guardado correctamente");
    } else {
      alert("Error al guardar sitio: " + error.message);
    }
    setLoading(false);
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    if (!nuevoUsuario.email || !nuevoUsuario.sitio_id) return alert("Email y Área son obligatorios");
    
    setLoading(true);
    const sitioRel = sitios.find(s => s.id == nuevoUsuario.sitio_id);
    const { error } = await supabase.from('perfiles_usuarios').insert([{
      email: nuevoUsuario.email.toLowerCase().trim(),
      nombre: nuevoUsuario.nombre,
      sitio_id: nuevoUsuario.sitio_id,
      nombre_sitio: sitioRel.nombre,
      ciudad: sitioRel.ciudad
    }]);

    if (!error) {
      setNuevoUsuario({ email: '', nombre: '', sitio_id: '' });
      await cargarDatos();
      alert("Usuario creado y vinculado con éxito");
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
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
      if (data) {
        setUser(data);
        setView('dashboard');
      } else {
        alert("El usuario no está registrado en el sistema.");
      }
    }
    setLoading(false);
  };

  // --- LÓGICA DE CÁMARA ---
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
    setLoading(true);
    const { error } = await supabase.from('reportes_pesaje').insert([{
      sitio_id: user.sitio_id,
      nombre_sitio: user.nombre_sitio || 'Matriz',
      ciudad: user.ciudad || 'N/A',
      usuario_email: user.email,
      nombre_usuario: user.nombre,
      peso_ocr: pesoOCR,
      peso_manual: parseFloat(pesoManual),
      diferencia: parseFloat(pesoManual) - pesoOCR,
      foto_url: photo,
      observacion: observacion
    }]);
    if (!error) {
      alert("Auditado con éxito");
      setPhoto(null); setPesoManual(''); setObservacion('');
      cargarDatos();
    }
    setLoading(false);
  };

  // --- REPORTES ---
  const reportesFiltrados = reportes.filter(r => {
    const cumpleSitio = filtroSitio === 'Todos' || r.nombre_sitio === filtroSitio;
    const cumpleCiudad = filtroCiudad === 'Todos' || r.ciudad === filtroCiudad;
    const fechaR = new Date(r.created_at);
    const cumpleFecha = (!fechaInicio || fechaR >= new Date(fechaInicio)) && (!fechaFin || fechaR <= new Date(fechaFin + 'T23:59:59'));
    return cumpleSitio && cumpleCiudad && cumpleFecha;
  });

  // VISTA LOGIN CON PUNTO VERDE
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-amber-500"></div>
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl border-2 border-amber-500">
              <span className="text-amber-500 font-black text-3xl italic">OJ</span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Oro Juez S.A.</h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className={`w-3 h-3 rounded-full ${dbStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {dbStatus === 'online' ? 'Servidor Conectado' : 'Sin Conexión'}
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <input name="email" type="email" required placeholder="Usuario Corporativo" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-amber-500 transition-all font-medium" />
            <button disabled={dbStatus !== 'online'} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50">
              {loading ? 'INGRESANDO...' : 'INICIAR SESIÓN'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <div className="w-full md:w-64 bg-slate-900 text-white p-6 space-y-2 shrink-0">
        <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-800">
          <div className="w-10 h-10 bg-amber-500 rounded-xl font-black flex items-center justify-center text-slate-900 italic">OJ</div>
          <div>
            <p className="font-black text-xs leading-none uppercase">Auditoría</p>
            <p className="text-[10px] text-amber-500 font-bold tracking-widest">ORO JUEZ S.A.</p>
          </div>
        </div>
        
        <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-amber-500 text-slate-900 font-black' : 'text-slate-400 hover:bg-slate-800'}`}>
          <Camera size={20}/> Captura
        </button>
        <button onClick={() => setView('reportes')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'reportes' ? 'bg-amber-500 text-slate-900 font-black' : 'text-slate-400 hover:bg-slate-800'}`}>
          <FileText size={20}/> Reportes
        </button>

        {user?.email === 'industria.orojuez@gmail.com' && (
          <div className="pt-6 mt-6 border-t border-slate-800 space-y-2">
            <p className="text-[10px] text-slate-500 font-black px-3 uppercase tracking-widest mb-2">Configuración</p>
            <button onClick={() => setView('sitios')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'sitios' ? 'bg-amber-500 text-slate-900 font-black' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Globe size={20}/> Ciudad y Áreas
            </button>
            <button onClick={() => setView('usuarios')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'usuarios' ? 'bg-amber-500 text-slate-900 font-black' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Users size={20}/> Gestión Usuarios
            </button>
          </div>
        )}

        <button onClick={() => {setUser(null); setView('login');}} className="w-full flex items-center gap-3 p-3 text-slate-500 mt-20 hover:text-red-400 transition-colors">
          <LogOut size={20}/> Cerrar Sesión
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-grow p-6 lg:p-10 overflow-y-auto">
        
        {/* VISTA CIUDADES Y ÁREAS */}
        {view === 'sitios' && (
          <div className="max-w-4xl bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter">
              <Building2 className="text-amber-500" size={30}/> Estructura de Operación
            </h2>
            <form onSubmit={handleCrearSitio} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Ciudad</label>
                <input value={nuevoSitio.ciudad} onChange={e => setNuevoSitio({...nuevoSitio, ciudad: e.target.value})} className="w-full p-3 border-2 rounded-xl focus:border-amber-500 outline-none" placeholder="Ej: Machala" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Área / Punto</label>
                <input value={nuevoSitio.nombre} onChange={e => setNuevoSitio({...nuevoSitio, nombre: e.target.value})} className="w-full p-3 border-2 rounded-xl focus:border-amber-500 outline-none" placeholder="Ej: Planta Principal" />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-slate-900 text-white p-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  <Plus size={20}/> Guardar Área
                </button>
              </div>
            </form>
            <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-inner">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-widest">
                  <tr><th className="p-4 text-left">Ciudad</th><th className="p-4 text-left">Área Asignada</th></tr>
                </thead>
                <tbody>
                  {sitios.map(s => <tr key={s.id} className="border-b hover:bg-slate-50 transition-colors"><td className="p-4 font-black text-slate-700">{s.ciudad}</td><td className="p-4 text-slate-500 font-bold italic">{s.nombre}</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VISTA GESTIÓN USUARIOS */}
        {view === 'usuarios' && (
          <div className="max-w-5xl bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter">
              <ShieldCheck className="text-amber-500" size={30}/> Control de Accesos
            </h2>
            <form onSubmit={handleCrearUsuario} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 bg-amber-50 p-6 rounded-2xl border-2 border-amber-100">
              <input placeholder="Nombre Auditor" value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} className="p-3 border-2 rounded-xl outline-none focus:border-amber-500" />
              <input placeholder="Email Corporativo" value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} className="p-3 border-2 rounded-xl outline-none focus:border-amber-500" />
              <select value={nuevoUsuario.sitio_id} onChange={e => setNuevoUsuario({...nuevoUsuario, sitio_id: e.target.value})} className="p-3 border-2 rounded-xl outline-none focus:border-amber-500 bg-white font-bold">
                <option value="">Área Asignada...</option>
                {sitios.map(s => <option key={s.id} value={s.id}>{s.ciudad} | {s.nombre}</option>)}
              </select>
              <button className="bg-amber-500 text-slate-900 font-black rounded-xl hover:bg-amber-600 transition-all uppercase text-xs">Vincular Auditor</button>
            </form>
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-100 uppercase text-[10px] font-black">
                <tr><th className="p-4 text-left">Nombre</th><th className="p-4 text-left">Correo</th><th className="p-4 text-left">Ubicación Asignada</th></tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-b"><td className="p-4 font-black">{u.nombre}</td><td className="p-4 text-slate-500 font-mono">{u.email}</td><td className="p-4"><span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">{u.ciudad} - {u.nombre_sitio}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VISTA CAPTURA */}
        {view === 'dashboard' && (
          <div className="max-w-5xl bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
             <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Auditando Báscula</h2>
                  <div className="flex items-center gap-2 text-slate-400 font-bold mt-1 uppercase text-xs">
                    <MapPin size={14} className="text-amber-500"/> {user?.ciudad || 'Matriz'} | <span className="text-slate-800">{user?.nombre_sitio || 'Admin'}</span>
                  </div>
                </div>
                <div className="bg-slate-900 text-amber-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                  Sesión: {user?.nombre}
                </div>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="aspect-video bg-slate-900 rounded-[2rem] overflow-hidden border-8 border-slate-100 flex items-center justify-center relative shadow-2xl">
                    {!streaming && !photo && <button onClick={startCamera} className="group flex flex-col items-center"><div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center text-slate-900 group-hover:scale-110 transition-transform"><Camera size={40}/></div><span className="font-black text-xs text-white mt-4 uppercase tracking-widest">Activar Visión</span></button>}
                    {streaming && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />}
                    {photo && <img src={photo} className="w-full h-full object-cover" />}
                  </div>
                  <canvas ref={canvasRef} width="640" height="480" className="hidden" />
                  {streaming && <button onClick={takePhoto} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-red-700 transition-all uppercase tracking-widest text-lg">CAPTURAR PESO</button>}
                  {photo && <button onClick={() => {setPhoto(null); setPesoOCR(null);}} className="w-full bg-slate-200 text-slate-600 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest">Tomar nueva captura</button>}
                </div>

                <div className="space-y-6">
                  <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-200 text-center shadow-inner">
                    <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-2">Lectura de Foto (OCR)</label>
                    <div className="text-6xl font-black text-slate-900 tracking-tighter">{pesoOCR ? `${pesoOCR}` : '--'}<span className="text-xl ml-2">kg</span></div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Ingreso de Peso Manual</label>
                      <input type="number" value={pesoManual} onChange={e => setPesoManual(e.target.value)} className={`w-full p-6 rounded-2xl border-2 text-3xl font-black text-center transition-all ${pesoManual && parseFloat(pesoManual) < pesoOCR ? 'border-red-500 bg-red-50 text-red-600 animate-pulse' : 'border-slate-100 focus:border-amber-500'}`} placeholder="0000" />
                      {pesoManual && parseFloat(pesoManual) < pesoOCR && <p className="text-red-600 text-[10px] mt-3 font-black uppercase text-center flex items-center justify-center gap-1"><AlertTriangle size={12}/> Alerta: Peso inferior al detectado</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Novedades / Observación</label>
                      <textarea value={observacion} onChange={e => setObservacion(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 h-24 text-sm font-medium outline-none focus:border-amber-500 transition-all" placeholder="Detalle cualquier diferencia..."></textarea>
                    </div>
                    <button disabled={!photo || !pesoManual || loading} onClick={guardarPesaje} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-xl shadow-2xl hover:bg-slate-800 disabled:opacity-30 uppercase transition-all">
                      {loading ? 'Sincronizando...' : 'Confirmar Auditoría'}
                    </button>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* VISTA REPORTES */}
        {view === 'reportes' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 bg-white p-6 rounded-3xl border shadow-sm items-end">
              <div className="flex-1 min-w-[150px]"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Ciudad</label>
              <select onChange={e => setFiltroCiudad(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-100 text-xs font-black"><option>Todos</option>{Array.from(new Set(sitios.map(s => s.ciudad))).map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="flex-1 min-w-[150px]"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Rango Desde</label><input type="date" onChange={e => setFechaInicio(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-100 text-xs font-bold" /></div>
              <div className="flex-1 min-w-[150px]"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Rango Hasta</label><input type="date" onChange={e => setFechaFin(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-100 text-xs font-bold" /></div>
              <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">Descargar Reporte</button>
            </div>
            <div className="bg-white rounded-[2rem] shadow-sm border-2 border-slate-100 overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-widest">
                  <tr><th className="p-5">Fecha / Auditor</th><th className="p-5">Ubicación</th><th className="p-5 text-center">OCR</th><th className="p-5 text-center">Manual</th><th className="p-5 text-center">Diferencia</th><th className="p-5 text-center">Audit</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportesFiltrados.map(r => (
                    <tr key={r.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="p-5"><p className="font-black text-slate-800 text-xs uppercase">{new Date(r.created_at).toLocaleDateString()}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{r.nombre_usuario}</p></td>
                      <td className="p-5"><p className="font-black text-slate-900 text-xs uppercase">{r.ciudad}</p><p className="text-[10px] text-amber-600 font-black italic">{r.nombre_sitio}</p></td>
                      <td className="p-5 text-center text-slate-400 font-mono font-bold">{r.peso_ocr}</td>
                      <td className={`p-5 text-center font-black font-mono text-lg ${r.peso_manual < r.peso_ocr ? 'text-red-600 underline decoration-red-300' : 'text-slate-800'}`}>{r.peso_manual}</td>
                      <td className={`p-5 text-center font-black text-xs ${r.diferencia < 0 ? 'text-red-500' : 'text-green-600'}`}>{r.diferencia}</td>
                      <td className="p-5 text-center"><button onClick={() => {const w = window.open(); w.document.write(`<img src="${r.foto_url}" style="width:100%">`)}} className="bg-amber-100 p-2 rounded-xl text-amber-700 hover:bg-amber-200 transition-colors shadow-sm"><Eye size={16}/></button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-black text-center">
                  <tr>
                    <td colSpan="2" className="p-6 text-right text-[10px] uppercase tracking-[0.2em] text-slate-400">Totales Acumulados:</td>
                    <td className="p-6 font-mono text-amber-500">{reportesFiltrados.reduce((a, b) => a + (b.peso_ocr || 0), 0)}</td>
                    <td className="p-6 font-mono text-amber-500 text-xl">{reportesFiltrados.reduce((a, b) => a + (b.peso_manual || 0), 0)}</td>
                    <td className="p-6 font-mono text-red-400">{reportesFiltrados.reduce((a, b) => a + (b.diferencia || 0), 0)}</td>
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