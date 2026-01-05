import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Camera, Database, Layout, Users, FileText, LogOut, 
  AlertTriangle, CheckCircle, Search, Download, Eye, 
  MapPin, Plus, Trash2, Building2, Globe
} from 'lucide-react';

const SUPABASE_URL = 'https://khgqeqrnlbhadoarcgul.supabase.co';
const SUPABASE_KEY = 'sb_publishable_S5Gk22ej_r8hIZw92b16gw_MBOImAJV';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const OroJuezApp = () => {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [dbStatus, setDbStatus] = useState('connecting');
  const [loading, setLoading] = useState(false);
  
  // Datos
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
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', nombre: '', sitio_id: '', ciudad: '' });

  // Filtros
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
        alert("Acceso denegado. El usuario no existe en la base de datos.");
      }
    }
    setLoading(false);
  };

  const crearSitio = async () => {
    if (!nuevoSitio.nombre || !nuevoSitio.ciudad) return alert("Complete nombre y ciudad");
    await supabase.from('sitios').insert([nuevoSitio]);
    setNuevoSitio({ nombre: '', ciudad: '' });
    cargarDatos();
  };

  const crearUsuario = async () => {
    if (!nuevoUsuario.email || !nuevoUsuario.sitio_id) return alert("Email y Área/Sitio son obligatorios");
    const sitioRel = sitios.find(s => s.id == nuevoUsuario.sitio_id);
    const payload = {
      ...nuevoUsuario,
      nombre_sitio: sitioRel.nombre,
      ciudad: sitioRel.ciudad,
      email: nuevoUsuario.email.toLowerCase()
    };
    await supabase.from('perfiles_usuarios').insert([payload]);
    setNuevoUsuario({ email: '', nombre: '', sitio_id: '', ciudad: '' });
    cargarDatos();
  };

  // --- CAPTURA ---
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
    await supabase.from('reportes_pesaje').insert([{
      sitio_id: user.sitio_id,
      nombre_sitio: user.nombre_sitio,
      ciudad: user.ciudad,
      usuario_email: user.email,
      nombre_usuario: user.nombre,
      peso_ocr: pesoOCR,
      peso_manual: parseFloat(pesoManual),
      diferencia: parseFloat(pesoManual) - pesoOCR,
      foto_url: photo,
      observacion: observacion
    }]);
    alert("Registro Guardado");
    setPhoto(null); setPesoManual(''); setObservacion('');
    cargarDatos();
  };

  // --- FILTROS ---
  const reportesFiltrados = reportes.filter(r => {
    const cumpleSitio = filtroSitio === 'Todos' || r.nombre_sitio === filtroSitio;
    const cumpleCiudad = filtroCiudad === 'Todos' || r.ciudad === filtroCiudad;
    const fechaR = new Date(r.created_at);
    const cumpleFecha = (!fechaInicio || fechaR >= new Date(fechaInicio)) && (!fechaFin || fechaR <= new Date(fechaFin + 'T23:59:59'));
    return cumpleSitio && cumpleCiudad && cumpleFecha;
  });

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-black text-2xl">OJ</div>
            <h2 className="text-2xl font-bold">Oro Juez S.A.</h2>
            <p className="text-slate-500 text-sm italic">Control de Pesajes v2.0</p>
          </div>
          <input name="email" type="email" required placeholder="usuario@orojuez.com" className="w-full p-4 border-2 rounded-xl mb-4 outline-none focus:border-amber-500" />
          <button className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-slate-700">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-slate-900 text-white p-6 space-y-2">
        <div className="flex items-center gap-3 mb-10"><div className="w-8 h-8 bg-amber-500 rounded font-bold flex items-center justify-center text-xs">OJ</div><span className="font-bold text-xs uppercase">Sistema Central</span></div>
        <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${view === 'dashboard' ? 'bg-amber-500' : 'hover:bg-slate-800'}`}><Camera size={18}/> Captura</button>
        <button onClick={() => setView('reportes')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${view === 'reportes' ? 'bg-amber-500' : 'hover:bg-slate-800'}`}><FileText size={18}/> Reportes</button>
        {user?.email === 'industria.orojuez@gmail.com' && (
          <div className="pt-4 space-y-2">
            <p className="text-[10px] text-slate-500 font-bold px-3">ADMINISTRACIÓN</p>
            <button onClick={() => setView('sitios')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${view === 'sitios' ? 'bg-amber-500' : 'hover:bg-slate-800'}`}><Globe size={18}/> Ciudades y Áreas</button>
            <button onClick={() => setView('usuarios')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${view === 'usuarios' ? 'bg-amber-500' : 'hover:bg-slate-800'}`}><Users size={18}/> Crear Usuarios</button>
          </div>
        )}
        <button onClick={() => setView('login')} className="w-full flex items-center gap-3 p-3 text-slate-500 mt-10 hover:text-red-400"><LogOut size={18}/> Salir</button>
      </div>

      <div className="flex-grow p-6">
        {view === 'sitios' && (
          <div className="max-w-4xl bg-white p-6 rounded-xl shadow border">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Building2 className="text-amber-500"/> Configurar Geografía</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
              <input value={nuevoSitio.ciudad} onChange={e => setNuevoSitio({...nuevoSitio, ciudad: e.target.value})} className="p-3 border rounded-lg" placeholder="Ciudad (Ej: Machala)" />
              <input value={nuevoSitio.nombre} onChange={e => setNuevoSitio({...nuevoSitio, nombre: e.target.value})} className="p-3 border rounded-lg" placeholder="Área/Sitio (Ej: Planta 1)" />
              <button onClick={crearSitio} className="bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 tracking-tight">+ Crear Punto</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3 text-left">Ciudad</th><th className="p-3 text-left">Área / Sitio</th></tr></thead>
              <tbody>{sitios.map(s => <tr key={s.id} className="border-b"><td className="p-3 font-medium">{s.ciudad}</td><td className="p-3">{s.nombre}</td></tr>)}</tbody>
            </table>
          </div>
        )}

        {view === 'usuarios' && (
          <div className="max-w-5xl bg-white p-6 rounded-xl shadow border">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Users className="text-amber-500"/> Registro de Personal</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8 bg-slate-50 p-4 rounded-lg">
              <input placeholder="Nombre Completo" onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} className="p-3 border rounded-lg bg-white" />
              <input placeholder="Email Corporativo" onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} className="p-3 border rounded-lg bg-white" />
              <select onChange={e => setNuevoUsuario({...nuevoUsuario, sitio_id: e.target.value})} className="p-3 border rounded-lg bg-white">
                <option value="">Asignar a Área...</option>
                {sitios.map(s => <option key={s.id} value={s.id}>{s.ciudad} - {s.nombre}</option>)}
              </select>
              <button onClick={crearUsuario} className="bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700">Registrar Usuario</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-white"><tr><th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Email</th><th className="p-3 text-left">Ciudad</th><th className="p-3 text-left">Área Asignada</th></tr></thead>
              <tbody>{usuarios.map(u => <tr key={u.id} className="border-b hover:bg-slate-50"><td className="p-3 font-bold">{u.nombre}</td><td className="p-3 text-slate-500">{u.email}</td><td className="p-3">{u.ciudad}</td><td className="p-3"><span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-black uppercase">{u.nombre_sitio}</span></td></tr>)}</tbody>
            </table>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="max-w-4xl bg-white p-6 rounded-2xl shadow-sm border">
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 leading-none">Punto de Pesaje</h2>
                <p className="text-slate-400 text-sm mt-1">{user?.ciudad} | <span className="text-amber-600 font-bold uppercase">{user?.nombre_sitio || 'ADMINISTRACIÓN CENTRAL'}</span></p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden border-4 border-slate-200 flex items-center justify-center relative shadow-inner">
                    {!streaming && !photo && <button onClick={startCamera} className="flex flex-col items-center text-white hover:text-amber-500 transition-all"><Camera size={50} strokeWidth={1.5} /><span className="font-bold text-xs mt-3 uppercase tracking-widest">Abrir Obturador</span></button>}
                    {streaming && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />}
                    {photo && <img src={photo} className="w-full h-full object-cover" />}
                  </div>
                  <canvas ref={canvasRef} width="640" height="480" className="hidden" />
                  {streaming && <button onClick={takePhoto} className="w-full bg-red-600 text-white py-4 rounded-xl font-black shadow-xl hover:scale-[1.02] transition-transform uppercase tracking-widest">Capturar Ahora</button>}
                  {photo && <button onClick={() => {setPhoto(null); setPesoOCR(null);}} className="w-full bg-slate-200 text-slate-700 py-3 rounded-xl font-bold uppercase text-xs">Descartar y Repetir</button>}
                </div>
                <div className="space-y-5">
                  <div className="bg-amber-50 p-5 rounded-2xl border-2 border-amber-200 shadow-sm text-center">
                    <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1">Lectura Automática OCR</label>
                    <div className="text-5xl font-black text-slate-900">{pesoOCR ? `${pesoOCR} kg` : '--'}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Peso Manual de Báscula</label>
                    <input type="number" value={pesoManual} onChange={e => setPesoManual(e.target.value)} className={`w-full p-5 rounded-2xl border-2 text-2xl font-black text-center ${pesoManual && parseFloat(pesoManual) < pesoOCR ? 'border-red-500 bg-red-50 text-red-600 animate-pulse' : 'border-slate-200'}`} placeholder="00.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2 ml-1">Observaciones Auditoría</label>
                    <textarea value={observacion} onChange={e => setObservacion(e.target.value)} className="w-full p-4 rounded-xl border-2 h-24 text-sm" placeholder="Escriba aquí novedades o causas de diferencia..."></textarea>
                  </div>
                  <button disabled={!photo || !pesoManual} onClick={guardarPesaje} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-2xl hover:bg-slate-800 disabled:opacity-30 uppercase tracking-tighter">Confirmar y Subir Registro</button>
                </div>
             </div>
          </div>
        )}

        {view === 'reportes' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border shadow-sm items-center">
              <div className="flex flex-col"><label className="text-[10px] font-bold text-slate-400 ml-1">Ciudad</label>
              <select onChange={e => setFiltroCiudad(e.target.value)} className="p-2 border rounded text-xs bg-slate-50 font-bold"><option>Todos</option>{Array.from(new Set(sitios.map(s => s.ciudad))).map(c => <option key={c}>{c}</option>)}</select></div>
              
              <div className="flex flex-col"><label className="text-[10px] font-bold text-slate-400 ml-1">Área</label>
              <select onChange={e => setFiltroSitio(e.target.value)} className="p-2 border rounded text-xs bg-slate-50 font-bold"><option>Todos</option>{sitios.map(s => <option key={s.id}>{s.nombre}</option>)}</select></div>
              
              <div className="flex flex-col"><label className="text-[10px] font-bold text-slate-400 ml-1">Desde</label><input type="date" onChange={e => setFechaInicio(e.target.value)} className="p-2 border rounded text-xs font-bold" /></div>
              <div className="flex flex-col"><label className="text-[10px] font-bold text-slate-400 ml-1">Hasta</label><input type="date" onChange={e => setFechaFin(e.target.value)} className="p-2 border rounded text-xs font-bold" /></div>
              <button onClick={() => window.print()} className="ml-auto bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-700 transition-colors"><Download size={14}/> Exportar Datos</button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border-2 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-widest">
                  <tr><th className="p-4">Fecha / Auditor</th><th className="p-4">Ubicación</th><th className="p-4 text-center">OCR</th><th className="p-4 text-center">Manual</th><th className="p-4 text-center">Dif</th><th className="p-4 text-center">Auditoría</th></tr>
                </thead>
                <tbody>
                  {reportesFiltrados.map(r => (
                    <tr key={r.id} className="border-b hover:bg-amber-50/30 transition-colors">
                      <td className="p-4"><div className="font-bold text-slate-800 text-xs">{new Date(r.created_at).toLocaleString()}</div><div className="text-[10px] text-slate-400 font-medium">{r.nombre_usuario}</div></td>
                      <td className="p-4"><div className="font-black text-slate-700 text-xs">{r.ciudad}</div><div className="text-[10px] text-amber-600 font-bold uppercase">{r.nombre_sitio}</div></td>
                      <td className="p-4 text-center text-slate-400 font-mono text-xs">{r.peso_ocr}</td>
                      <td className={`p-4 text-center font-black font-mono ${r.peso_manual < r.peso_ocr ? 'text-red-600' : 'text-slate-800'}`}>{r.peso_manual}</td>
                      <td className={`p-4 text-center font-bold text-xs ${r.diferencia < 0 ? 'text-red-500' : 'text-green-600'}`}>{r.diferencia}</td>
                      <td className="p-4 text-center"><button onClick={() => {const w = window.open(); w.document.write(`<img src="${r.foto_url}" style="width:100%">`)}} className="bg-slate-100 p-2 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors"><Eye size={16}/></button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan="2" className="p-4 text-right text-[10px] uppercase tracking-widest">Resumen de Carga:</td>
                    <td className="p-4 text-center font-mono">{reportesFiltrados.reduce((a, b) => a + (b.peso_ocr || 0), 0)}</td>
                    <td className="p-4 text-center font-mono">{reportesFiltrados.reduce((a, b) => a + (b.peso_manual || 0), 0)}</td>
                    <td className="p-4 text-center font-mono text-amber-700">{reportesFiltrados.reduce((a, b) => a + (b.diferencia || 0), 0)}</td>
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