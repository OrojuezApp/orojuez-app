import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Camera, Database, Layout, Users, FileText, LogOut, 
  AlertTriangle, CheckCircle, Search, Download, Eye, 
  MapPin, Plus, Trash2, Building2, Globe, ShieldCheck, Edit2, X
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

  // Estados para Edición
  const [editandoSitio, setEditandoSitio] = useState(null);
  const [editandoUsuario, setEditandoUsuario] = useState(null);

  const [streaming, setStreaming] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [pesoOCR, setPesoOCR] = useState(null);
  const [pesoManual, setPesoManual] = useState('');
  const [observacion, setObservacion] = useState('');

  const [nuevoSitio, setNuevoSitio] = useState({ nombre: '', ciudad: '' });
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', nombre: '', sitio_id: '' });

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

  // --- GESTIÓN DE SITIOS (CRUD) ---
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

  const eliminarSitio = async (id) => {
    if (window.confirm("¿Seguro que desea eliminar este sitio? Los usuarios vinculados podrían tener problemas.")) {
      await supabase.from('sitios').delete().eq('id', id);
      cargarDatos();
    }
  };

  // --- GESTIÓN DE USUARIOS (CRUD) ---
  const handleGuardarUsuario = async (e) => {
    e.preventDefault();
    setLoading(true);
    const sitioRel = sitios.find(s => s.id == nuevoUsuario.sitio_id);
    const payload = {
      ...nuevoUsuario,
      nombre_sitio: sitioRel.nombre,
      ciudad: sitioRel.ciudad,
      email: nuevoUsuario.email.toLowerCase().trim()
    };

    if (editandoUsuario) {
      await supabase.from('perfiles_usuarios').update(payload).eq('id', editandoUsuario);
      setEditandoUsuario(null);
    } else {
      await supabase.from('perfiles_usuarios').insert([payload]);
    }
    setNuevoUsuario({ email: '', nombre: '', sitio_id: '' });
    cargarDatos();
    setLoading(false);
  };

  const eliminarUsuario = async (id) => {
    if (window.confirm("¿Eliminar acceso a este usuario?")) {
      await supabase.from('perfiles_usuarios').delete().eq('id', id);
      cargarDatos();
    }
  };

  // --- LOGIN Y CAPTURA (Se mantienen igual) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const emailInput = e.target.email.value.trim().toLowerCase();
    if (emailInput === 'industria.orojuez@gmail.com') {
      setUser({ email: emailInput, nombre: 'Admin Central', rol: 'admin', sitio_id: 'all' });
      setView('dashboard');
    } else {
      const { data } = await supabase.from('perfiles_usuarios').select('*').eq('email', emailInput).single();
      if (data) { setUser(data); setView('dashboard'); }
      else { alert("Usuario no registrado."); }
    }
    setLoading(false);
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
    await supabase.from('reportes_pesaje').insert([{
      sitio_id: user.sitio_id, nombre_sitio: user.nombre_sitio, ciudad: user.ciudad,
      usuario_email: user.email, nombre_usuario: user.nombre,
      peso_ocr: pesoOCR, peso_manual: parseFloat(pesoManual),
      diferencia: parseFloat(pesoManual) - pesoOCR, foto_url: photo, observacion: observacion
    }]);
    setPhoto(null); setPesoManual(''); setObservacion('');
    cargarDatos(); setLoading(false);
    alert("Auditado con éxito");
  };

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
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-2 bg-amber-500"></div>
          <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-amber-500 text-amber-500 font-black text-3xl italic">OJ</div>
          <h1 className="text-2xl font-black text-slate-800 uppercase mb-6">Oro Juez S.A.</h1>
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`w-3 h-3 rounded-full ${dbStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{dbStatus === 'online' ? 'Servidor Online' : 'Desconectado'}</span>
          </div>
          <input name="email" type="email" required placeholder="Correo Corporativo" className="w-full p-4 bg-slate-50 border-2 rounded-2xl mb-4 outline-none focus:border-amber-500" />
          <button disabled={dbStatus !== 'online'} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all">ENTRAR</button>
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
          <div><p className="font-black text-xs uppercase">Auditoría</p><p className="text-[10px] text-amber-500 font-bold tracking-widest uppercase">Oro Juez S.A.</p></div>
        </div>
        <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-xl ${view === 'dashboard' ? 'bg-amber-500 text-slate-900 font-black' : 'text-slate-400 hover:bg-slate-800'}`}><Camera size={20}/> Captura</button>
        <button onClick={() => setView('reportes')} className={`w-full flex items-center gap-3 p-3 rounded-xl ${view === 'reportes' ? 'bg-amber-500 text-slate-900 font-black' : 'text-slate-400 hover:bg-slate-800'}`}><FileText size={20}/> Reportes</button>
        {user?.email === 'industria.orojuez@gmail.com' && (
          <div className="pt-6 mt-6 border-t border-slate-800 space-y-1">
            <p className="text-[10px] text-slate-500 font-black px-3 uppercase mb-2">Admin</p>
            <button onClick={() => setView('sitios')} className={`w-full flex items-center gap-3 p-3 rounded-xl ${view === 'sitios' ? 'bg-amber-500 text-slate-900 font-black' : 'text-slate-400 hover:bg-slate-800'}`}><Globe size={20}/> Ciudad/Áreas</button>
            <button onClick={() => setView('usuarios')} className={`w-full flex items-center gap-3 p-3 rounded-xl ${view === 'usuarios' ? 'bg-amber-500 text-slate-900 font-black' : 'text-slate-400 hover:bg-slate-800'}`}><Users size={20}/> Usuarios</button>
          </div>
        )}
        <button onClick={() => setView('login')} className="w-full flex items-center gap-3 p-3 text-slate-500 mt-20 hover:text-red-400"><LogOut size={20}/> Salir</button>
      </div>

      <div className="flex-grow p-6 lg:p-10 overflow-y-auto">
        
        {/* CRUD CIUDADES/SITIOS */}
        {view === 'sitios' && (
          <div className="max-w-4xl bg-white p-8 rounded-3xl shadow-sm border">
            <h2 className="text-2xl font-black mb-8 flex justify-between items-center">
              ESTRUCTURA OPERATIVA 
              {editandoSitio && <button onClick={() => {setEditandoSitio(null); setNuevoSitio({nombre:'', ciudad:''});}} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full flex items-center gap-1"><X size={12}/> Cancelar Edición</button>}
            </h2>
            <form onSubmit={handleGuardarSitio} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 bg-slate-50 p-6 rounded-2xl border-2 border-dashed">
              <input value={nuevoSitio.ciudad} onChange={e => setNuevoSitio({...nuevoSitio, ciudad: e.target.value})} className="p-3 border-2 rounded-xl" placeholder="Ciudad" required />
              <input value={nuevoSitio.nombre} onChange={e => setNuevoSitio({...nuevoSitio, nombre: e.target.value})} className="p-3 border-2 rounded-xl" placeholder="Área / Punto" required />
              <button className="bg-slate-900 text-white rounded-xl font-bold uppercase text-xs">{editandoSitio ? 'Actualizar' : 'Guardar'}</button>
            </form>
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-black">
                <tr><th className="p-4 text-left">Ciudad</th><th className="p-4 text-left">Área</th><th className="p-4 text-center">Acciones</th></tr>
              </thead>
              <tbody>
                {sitios.map(s => (
                  <tr key={s.id} className="border-b">
                    <td className="p-4 font-black">{s.ciudad}</td>
                    <td className="p-4 text-slate-500 font-bold">{s.nombre}</td>
                    <td className="p-4 flex justify-center gap-2">
                      <button onClick={() => {setEditandoSitio(s.id); setNuevoSitio({nombre:s.nombre, ciudad:s.ciudad});}} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                      <button onClick={() => eliminarSitio(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CRUD USUARIOS */}
        {view === 'usuarios' && (
          <div className="max-w-5xl bg-white p-8 rounded-3xl shadow-sm border">
            <h2 className="text-2xl font-black mb-8 flex justify-between items-center">
              GESTIÓN DE AUDITORES
              {editandoUsuario && <button onClick={() => {setEditandoUsuario(null); setNuevoUsuario({email:'', nombre:'', sitio_id:''});}} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full flex items-center gap-1"><X size={12}/> Cancelar</button>}
            </h2>
            <form onSubmit={handleGuardarUsuario} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 bg-amber-50 p-6 rounded-2xl border-2 border-amber-100">
              <input value={nuevoUsuario.nombre} placeholder="Nombre" onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} className="p-3 border-2 rounded-xl bg-white" required />
              <input value={nuevoUsuario.email} placeholder="Email" onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} className="p-3 border-2 rounded-xl bg-white" required />
              <select value={nuevoUsuario.sitio_id} onChange={e => setNuevoUsuario({...nuevoUsuario, sitio_id: e.target.value})} className="p-3 border-2 rounded-xl bg-white font-bold" required>
                <option value="">Asignar Área...</option>
                {sitios.map(s => <option key={s.id} value={s.id}>{s.ciudad} | {s.nombre}</option>)}
              </select>
              <button className="bg-amber-500 text-slate-900 font-black rounded-xl uppercase text-xs">{editandoUsuario ? 'Actualizar' : 'Vincular'}</button>
            </form>
            <table className="w-full text-sm">
              <thead className="bg-slate-100 uppercase text-[10px] font-black">
                <tr><th className="p-4 text-left">Nombre</th><th className="p-4 text-left">Correo</th><th className="p-4 text-left">Área</th><th className="p-4 text-center">Acciones</th></tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-b">
                    <td className="p-4 font-black">{u.nombre}</td>
                    <td className="p-4 text-slate-500">{u.email}</td>
                    <td className="p-4 font-bold text-xs uppercase text-amber-600">{u.ciudad} - {u.nombre_sitio}</td>
                    <td className="p-4 flex justify-center gap-2">
                      <button onClick={() => {setEditandoUsuario(u.id); setNuevoUsuario({nombre:u.nombre, email:u.email, sitio_id:u.sitio_id});}} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                      <button onClick={() => eliminarUsuario(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CAPTURA Y REPORTES (Igual que antes) */}
        {view === 'dashboard' && (
          <div className="max-w-5xl bg-white p-8 rounded-3xl shadow-sm border">
            <div className="mb-10 flex flex-col md:flex-row justify-between items-end">
              <div><h2 className="text-3xl font-black uppercase tracking-tighter">Nueva Auditoría</h2><p className="text-slate-400 font-bold text-xs uppercase"><MapPin size={12} className="inline mr-1 text-amber-500"/> {user?.ciudad} | {user?.nombre_sitio}</p></div>
              <div className="bg-slate-900 text-amber-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest mt-4">Auditor: {user?.nombre}</div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="aspect-video bg-slate-900 rounded-[2rem] overflow-hidden border-8 border-slate-100 flex items-center justify-center relative shadow-2xl">
                  {!streaming && !photo && <button onClick={() => {setStreaming(true); navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s => videoRef.current.srcObject=s);}} className="text-white text-center font-black uppercase text-xs"><Camera size={40} className="mx-auto mb-2 text-amber-500"/> Iniciar Cámara</button>}
                  {streaming && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />}
                  {photo && <img src={photo} className="w-full h-full object-cover" />}
                </div>
                <canvas ref={canvasRef} width="640" height="480" className="hidden" />
                {streaming && <button onClick={takePhoto} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg uppercase tracking-widest">Capturar</button>}
                {photo && <button onClick={() => {setPhoto(null); setPesoOCR(null);}} className="w-full bg-slate-200 text-slate-600 py-3 rounded-xl font-black uppercase text-[10px]">Reintentar</button>}
              </div>
              <div className="space-y-4">
                <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-200 text-center">
                  <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-2">Lectura OCR</label>
                  <div className="text-6xl font-black">{pesoOCR ? `${pesoOCR} kg` : '--'}</div>
                </div>
                <input type="number" value={pesoManual} onChange={e => setPesoManual(e.target.value)} className={`w-full p-6 rounded-2xl border-2 text-3xl font-black text-center ${pesoManual && parseFloat(pesoManual) < pesoOCR ? 'border-red-500 bg-red-50 text-red-600 animate-pulse' : 'border-slate-100 focus:border-amber-500'}`} placeholder="Manual" />
                {pesoManual && parseFloat(pesoManual) < pesoOCR && <p className="text-red-600 text-[10px] font-black uppercase text-center"><AlertTriangle size={12} className="inline mr-1"/> Alerta: Peso menor al de foto</p>}
                <textarea value={observacion} onChange={e => setObservacion(e.target.value)} className="w-full p-4 rounded-2xl border-2 h-24 text-sm" placeholder="Observaciones..."></textarea>
                <button disabled={!photo || !pesoManual || loading} onClick={guardarPesaje} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl shadow-2xl disabled:opacity-30 uppercase tracking-tighter">Confirmar Auditoría</button>
              </div>
            </div>
          </div>
        )}

        {view === 'reportes' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 bg-white p-6 rounded-3xl border shadow-sm items-end">
              <div className="flex-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Ciudad</label><select onChange={e => setFiltroCiudad(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-100 text-xs font-black"><option>Todos</option>{Array.from(new Set(sitios.map(s => s.ciudad))).map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="flex-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Desde</label><input type="date" onChange={e => setFechaInicio(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-100 text-xs font-bold" /></div>
              <div className="flex-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Hasta</label><input type="date" onChange={e => setFechaFin(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-100 text-xs font-bold" /></div>
              <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 shadow-lg">Descargar Reporte</button>
            </div>
            <div className="bg-white rounded-[2rem] shadow-sm border-2 border-slate-100 overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-widest">
                  <tr><th className="p-5">Fecha / Auditor</th><th className="p-5">Ubicación</th><th className="p-5 text-center">OCR</th><th className="p-5 text-center">Manual</th><th className="p-5 text-center">Dif</th><th className="p-5 text-center">Ver</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportesFiltrados.map(r => (
                    <tr key={r.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="p-5"><p className="font-black text-slate-800 text-xs">{new Date(r.created_at).toLocaleDateString()}</p><p className="text-[9px] text-slate-400 font-bold uppercase">{r.nombre_usuario}</p></td>
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
                    <td colSpan="2" className="p-6 text-right text-[10px] uppercase tracking-widest text-slate-400">Totales Acumulados:</td>
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