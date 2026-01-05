import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Camera, 
  Database, 
  Layout, 
  Users, 
  FileText, 
  LogOut, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Download,
  Eye,
  Calendar,
  MapPin
} from 'lucide-react';

// CONFIGURACIÓN SUPABASE
const SUPABASE_URL = 'https://khgqeqrnlbhadoarcgul.supabase.co';
const SUPABASE_KEY = 'sb_publishable_S5Gk22ej_r8hIZw92b16gw_MBOImAJV';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const OroJuezApp = () => {
  // ESTADOS GENERALES
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [dbStatus, setDbStatus] = useState('connecting');
  
  // ESTADOS PARA CAPTURA
  const [streaming, setStreaming] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [pesoOCR, setPesoOCR] = useState(null);
  const [pesoManual, setPesoManual] = useState('');
  const [observacion, setObservacion] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ESTADOS PARA REPORTES Y FILTROS
  const [reportes, setReportes] = useState([]);
  const [sitios, setSitios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filtroSitio, setFiltroSitio] = useState('Todos');
  const [filtroUsuario, setFiltroUsuario] = useState('Todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    checkConnection();
    cargarDatosIniciales();
  }, []);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase.from('sitios').select('count', { count: 'exact', head: true });
      if (error) throw error;
      setDbStatus('online');
    } catch (err) {
      setDbStatus('offline');
    }
  };

  const cargarDatosIniciales = async () => {
    const { data: s } = await supabase.from('sitios').select('*');
    const { data: u } = await supabase.from('perfiles_usuarios').select('*');
    if (s) setSitios(s);
    if (u) setUsuarios(u);
    cargarReportes();
  };

  const cargarReportes = async () => {
    const { data, error } = await supabase
      .from('reportes_pesaje')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setReportes(data);
  };

  // LÓGICA DE CAPTURA
  const startCamera = async () => {
    setStreaming(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    videoRef.current.srcObject = stream;
  };

  const takePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    const data = canvasRef.current.toDataURL('image/jpeg');
    setPhoto(data);
    setStreaming(false);
    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    
    // Simulación de OCR
    const pesoDetectado = Math.floor(Math.random() * (1200 - 800) + 800);
    setPesoOCR(pesoDetectado);
  };

  const guardarPesaje = async () => {
    if (!pesoManual) return alert("Ingrese el peso manual");
    setIsSaving(true);
    
    const nuevoReporte = {
      sitio_id: user.sitio_id,
      nombre_sitio: user.nombre_sitio,
      usuario_email: user.email,
      nombre_usuario: user.nombre || user.email,
      peso_ocr: pesoOCR,
      peso_manual: parseFloat(pesoManual),
      diferencia: parseFloat(pesoManual) - pesoOCR,
      foto_url: photo,
      observacion: observacion,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('reportes_pesaje').insert([nuevoReporte]);
    
    if (!error) {
      alert("Registro guardado con éxito");
      setPhoto(null);
      setPesoManual('');
      setObservacion('');
      cargarReportes();
    } else {
      alert("Error al guardar: " + error.message);
    }
    setIsSaving(false);
  };

  // EXPORTACIÓN (Implementación básica con Window Print para PDF y CSV para Excel)
  const exportarCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Fecha,Sitio,Usuario,Peso OCR,Peso Manual,Diferencia,Observacion\n";
    reportesFiltrados.forEach(r => {
      csvContent += `${new Date(r.created_at).toLocaleString()},${r.nombre_sitio},${r.nombre_usuario},${r.peso_ocr},${r.peso_manual},${r.diferencia},${r.observacion}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Reporte_OroJuez.csv");
    document.body.appendChild(link);
    link.click();
  };

  // FILTROS
  const reportesFiltrados = reportes.filter(r => {
    const cumpleSitio = filtroSitio === 'Todos' || r.nombre_sitio === filtroSitio;
    const cumpleUsuario = filtroUsuario === 'Todos' || r.nombre_usuario === filtroUsuario;
    const fechaReporte = new Date(r.created_at);
    const cumpleFechaInicio = !fechaInicio || fechaReporte >= new Date(fechaInicio);
    const cumpleFechaFin = !fechaFin || fechaReporte <= new Date(fechaFin + 'T23:59:59');
    return cumpleSitio && cumpleUsuario && cumpleFechaInicio && cumpleFechaFin;
  });

  const totalOCR = reportesFiltrados.reduce((acc, r) => acc + (r.peso_ocr || 0), 0);
  const totalManual = reportesFiltrados.reduce((acc, r) => acc + (r.peso_manual || 0), 0);

  // LOGIN
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <span className="text-white text-3xl font-black">OJ</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">ORO JUEZ S.A.</h1>
            <p className="text-slate-500">Auditoría de Pesaje</p>
          </div>
          <button 
            onClick={() => {
              setUser({ email: 'industria.orojuez@gmail.com', nombre: 'Admin Central', sitio_id: 1, nombre_sitio: 'Matriz' });
              setView('dashboard');
            }}
            className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            Ingresar al Sistema
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <div className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col shadow-xl">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold">OJ</div>
          <div>
            <h2 className="font-bold text-sm leading-tight">ORO JUEZ S.A.</h2>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${dbStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                {dbStatus === 'online' ? 'Servidor online' : 'Error DB'}
              </span>
            </div>
          </div>
        </div>

        <nav className="space-y-2 flex-grow">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${view === 'dashboard' ? 'bg-amber-500 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Camera size={20} /> <span className="font-medium">Capturar Peso</span>
          </button>
          <button onClick={() => setView('reportes')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${view === 'reportes' ? 'bg-amber-500 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}>
            <FileText size={20} /> <span className="font-medium">Reportes</span>
          </button>
        </nav>

        <div className="pt-6 mt-6 border-t border-slate-800">
          <button onClick={() => setView('login')} className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-red-400 transition-colors">
            <LogOut size={20} /> <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-grow p-4 md:p-8 overflow-y-auto">
        
        {/* VISTA CAPTURA */}
        {view === 'dashboard' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Camera className="text-amber-500" /> Nueva Captura de Pesaje
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cámara */}
                <div className="space-y-4">
                  <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center relative">
                    {!streaming && !photo && (
                      <button onClick={startCamera} className="flex flex-col items-center text-slate-400 hover:text-amber-500 transition-colors">
                        <Camera size={48} strokeWidth={1} />
                        <span className="font-medium mt-2">Activar Cámara</span>
                      </button>
                    )}
                    {streaming && (
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    )}
                    {photo && (
                      <img src={photo} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <canvas ref={canvasRef} width="640" height="480" className="hidden" />
                  
                  {streaming && (
                    <button onClick={takePhoto} className="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 shadow-lg transition-all">
                      CAPTURAR FOTO DE BÁSCULA
                    </button>
                  )}
                  {photo && (
                    <button onClick={() => {setPhoto(null); setPesoOCR(null);}} className="w-full bg-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300 transition-all">
                      TOMAR OTRA FOTO
                    </button>
                  )}
                </div>

                {/* Formulario */}
                <div className="space-y-5">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peso Detectado (OCR)</label>
                    <div className="text-4xl font-black text-slate-800 leading-none mt-1">
                      {pesoOCR ? `${pesoOCR} kg` : '--'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Ingreso Manual de Peso</label>
                    <input 
                      type="number" 
                      value={pesoManual}
                      onChange={(e) => setPesoManual(e.target.value)}
                      placeholder="Ingrese peso de báscula..."
                      className={`w-full p-4 rounded-xl border-2 text-xl font-bold transition-all outline-none 
                        ${pesoManual && parseFloat(pesoManual) < pesoOCR ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-200 focus:border-amber-500'}`}
                    />
                    {pesoManual && parseFloat(pesoManual) < pesoOCR && (
                      <p className="text-red-500 text-xs mt-2 font-bold flex items-center gap-1">
                        <AlertTriangle size={14} /> El peso manual es menor al de la foto
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Observaciones / Novedades</label>
                    <textarea 
                      value={observacion}
                      onChange={(e) => setObservacion(e.target.value)}
                      className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-amber-500 outline-none h-24"
                      placeholder="Describa cualquier irregularidad..."
                    ></textarea>
                  </div>

                  <button 
                    disabled={!photo || !pesoManual || isSaving}
                    onClick={guardarPesaje}
                    className="w-full bg-amber-500 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-tight"
                  >
                    {isSaving ? 'Guardando...' : 'Registrar en Nube'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VISTA REPORTES */}
        {view === 'reportes' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-amber-500" /> Historial de Auditoría
              </h2>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-slate-700">
                  <Download size={16} /> PDF
                </button>
                <button onClick={exportarCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-green-700">
                  <Download size={16} /> EXCEL (CSV)
                </button>
              </div>
            </div>

            {/* FILTROS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Sitio</label>
                <select value={filtroSitio} onChange={(e) => setFiltroSitio(e.target.value)} className="w-full p-2 bg-slate-50 rounded border text-sm">
                  <option>Todos</option>
                  {sitios.map(s => <option key={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Usuario</label>
                <select value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)} className="w-full p-2 bg-slate-50 rounded border text-sm">
                  <option>Todos</option>
                  {usuarios.map(u => <option key={u.id}>{u.nombre || u.email}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Desde</label>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full p-2 bg-slate-50 rounded border text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Hasta</label>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full p-2 bg-slate-50 rounded border text-sm" />
              </div>
            </div>

            {/* TABLA */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase">Fecha/Hora</th>
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase">Sitio</th>
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase">Auditor</th>
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">OCR (kg)</th>
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">Manual (kg)</th>
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">Diferencia</th>
                      <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-center">Foto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportesFiltrados.map((rep) => (
                      <tr key={rep.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-sm text-slate-600">
                          {new Date(rep.created_at).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-bold text-slate-800">{rep.nombre_sitio}</span>
                        </td>
                        <td className="p-4 text-sm text-slate-600 italic">
                          {rep.nombre_usuario}
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-slate-400">{rep.peso_ocr}</td>
                        <td className="p-4 text-center">
                          <span className={`font-mono font-bold ${rep.peso_manual < rep.peso_ocr ? 'text-red-600' : 'text-slate-800'}`}>
                            {rep.peso_manual}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${rep.diferencia < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {rep.diferencia > 0 ? `+${rep.diferencia}` : rep.diferencia}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => {
                              const win = window.open();
                              win.document.write(`<img src="${rep.foto_url}" style="width:100%">`);
                            }}
                            className="text-amber-500 hover:text-amber-600 transition-colors"
                          >
                            <Eye size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* FILA DE TOTALES */}
                  <tfoot className="bg-slate-900 text-white">
                    <tr>
                      <td colSpan="3" className="p-4 font-bold text-right uppercase text-[10px] tracking-widest">Totales en Filtro:</td>
                      <td className="p-4 text-center font-mono font-bold text-amber-400">{totalOCR} kg</td>
                      <td className="p-4 text-center font-mono font-bold text-amber-400">{totalManual} kg</td>
                      <td className="p-4 text-center font-mono font-bold">
                        <span className={totalManual - totalOCR < 0 ? 'text-red-400' : 'text-green-400'}>
                          {totalManual - totalOCR} kg
                        </span>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OroJuezApp;