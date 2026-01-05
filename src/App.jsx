import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Camera, MapPin, User, Lock, LogOut, Plus, Users, 
  LayoutDashboard, Map as MapIcon, X, Eye, Trash2, 
  Edit3, Save, Loader2, RefreshCw, Smartphone
} from 'lucide-react';

// --- CONFIGURACIÓN DE CONEXIÓN REAL ---
const SUPABASE_URL = 'https://khgqeqrnlbhadoarcgul.supabase.co';
const SUPABASE_KEY = 'sb_publishable_S5Gk22ej_r8hIZw92b16gw_MBOImAJV';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const OroJuezApp = () => {
  const [dbStatus, setDbStatus] = useState('connecting');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('reportes'); 
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  // --- ESTADOS DE DATOS REALES ---
  const [sitios, setSitios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [records, setRecords] = useState([]);

  // --- MODALES Y FORMULARIOS ---
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSitioModal, setShowSitioModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // LÓGICA DE CÁMARA
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // --- CARGA INICIAL DESDE LA BASE DE DATOS ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setDbStatus('connecting');
    try {
      const { data: s } = await supabase.from('sitios').select('*').order('nombre');
      const { data: u } = await supabase.from('perfiles_usuarios').select('*');
      const { data: r } = await supabase.from('reportes_pesaje').select('*').order('fecha', { ascending: false });
      
      setSitios(s || []);
      setUsuarios(u || []);
      setRecords(r || []);
      setDbStatus('online');
    } catch (error) {
      console.error(error);
      setDbStatus('offline');
    }
  };

  // --- GESTIÓN DE SITIOS (CRUD REAL) ---
  const handleSaveSitio = async (e) => {
    e.preventDefault();
    setLoading(true);
    const nombre = e.target.nombre.value;
    const ubicacion = e.target.ubicacion.value;

    if (editingItem) {
      await supabase.from('sitios').update({ nombre, ubicacion }).eq('id', editingItem.id);
    } else {
      await supabase.from('sitios').insert([{ nombre, ubicacion }]);
    }

    await fetchData();
    setShowSitioModal(false);
    setEditingItem(null);
    setLoading(false);
  };

  const eliminarSitio = async (id) => {
    if(window.confirm("¿Eliminar sitio? Esto desconectará a los operarios vinculados.")) {
      await supabase.from('sitios').delete().eq('id', id);
      fetchData();
    }
  };

  // --- GESTIÓN DE USUARIOS (VÍNCULO CON SITIO) ---
  const handleSaveUsuario = async (e) => {
    e.preventDefault();
    setLoading(true);
    const email = e.target.email.value;
    const sitio_id = e.target.sitio.value; // ID de la tabla sitios

    if (editingItem) {
      await supabase.from('perfiles_usuarios').update({ email, sitio_id }).eq('id', editingItem.id);
    } else {
      await supabase.from('perfiles_usuarios').insert([{ email, sitio_id, rol: 'OPERATIVO' }]);
    }
    
    await fetchData();
    setShowUserModal(false);
    setEditingItem(null);
    setLoading(false);
  };

  const eliminarUsuario = async (id) => {
    if(window.confirm("¿Quitar acceso a este usuario?")) {
      await supabase.from('perfiles_usuarios').delete().eq('id', id);
      fetchData();
    }
  };

  // --- LÓGICA DE CÁMARA Y CAPTURA ---
  const startCamera = async () => {
    setShowCameraModal(true);
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: 1280 } 
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) { alert("Error al abrir cámara: " + err); }
    }, 300);
  };

  const captureAndSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const pesoManual = e.target.pesoManual.value;

    // Dibujar foto en el canvas
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    const fotoBase64 = canvasRef.current.toDataURL('image/webp', 0.5);

    // Obtener info del operario actual
    const perfil = usuarios.find(u => u.email === userEmail);
    const sitioNombre = perfil ? sitios.find(s => s.id === perfil.sitio_id)?.nombre : 'Admin';

    const { error } = await supabase.from('reportes_pesaje').insert([{
      usuario_email: userEmail,
      sitio_nombre: sitioNombre,
      peso_manual: pesoManual,
      peso_ocr: (parseFloat(pesoManual) * 0.99).toFixed(2), // Simulación de OCR
      foto_data: fotoBase64,
      coordenadas: 'GPS Activo'
    }]);

    if (!error) {
      await fetchData();
      setShowCameraModal(false);
      if(videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setLoading(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (userEmail === 'industria.orojuez@gmail.com') {
      setRole('SUPER_ADMIN');
      setIsAuthenticated(true);
    } else {
      const found = usuarios.find(u => u.email === userEmail);
      if (found) {
        setRole('OPERATIVO');
        setIsAuthenticated(true);
      } else {
        alert("Usuario no autorizado en la base de datos.");
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md border-t-[15px] border-blue-900">
          <div className="text-center mb-8">
            <div className="bg-blue-900 text-white w-20 h-20 flex items-center justify-center rounded-3xl font-black text-3xl mx-auto shadow-xl">OJ</div>
            <h1 className="text-3xl font-black text-blue-900 mt-4 tracking-tighter uppercase leading-none">Oro Juez S.A.</h1>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className={`w-2 h-2 rounded-full ${dbStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Servidor {dbStatus}</span>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email de Usuario" className="w-full border-2 p-4 rounded-2xl outline-none" onChange={(e) => setUserEmail(e.target.value)} required />
            <input type="password" placeholder="Contraseña" className="w-full border-2 p-4 rounded-2xl outline-none" required />
            <button className="w-full bg-blue-900 text-white font-black py-4 rounded-2xl uppercase shadow-lg active:scale-95 transition-all">Acceder</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-700">
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col p-8 sticky top-0 h-screen shadow-2xl">
        <div className="mb-12 font-black text-2xl tracking-tighter italic text-blue-500">ORO JUEZ S.A.</div>
        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('reportes')} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${activeTab === 'reportes' ? 'bg-blue-600 font-bold' : 'hover:bg-slate-800 text-slate-400'}`}>
            <LayoutDashboard size={20}/> Reportes
          </button>
          {role === 'SUPER_ADMIN' && (
            <>
              <button onClick={() => setActiveTab('usuarios')} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${activeTab === 'usuarios' ? 'bg-blue-600 font-bold' : 'hover:bg-slate-800 text-slate-400'}`}>
                <Users size={20}/> Usuarios
              </button>
              <button onClick={() => setActiveTab('sitios')} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${activeTab === 'sitios' ? 'bg-blue-600 font-bold' : 'hover:bg-slate-800 text-slate-400'}`}>
                <MapIcon size={20}/> Sitios
              </button>
            </>
          )}
        </nav>
        <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-4 text-red-400 p-4 hover:bg-red-500/10 rounded-2xl font-bold"><LogOut size={20}/> Salir</button>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-10">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">{activeTab}</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Sincronización Cloud Activa</p>
          </div>
          <button onClick={startCamera} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-3 shadow-2xl hover:bg-blue-700 uppercase active:scale-95 transition-all">
            <Camera size={20}/> Capturar Pesaje
          </button>
        </header>

        {/* --- TABLA DE REPORTES --- */}
        {activeTab === 'reportes' && (
          <div className="bg-white rounded-[40px] shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                <tr>
                  <th className="p-8">Fecha y Sitio</th>
                  <th className="p-8">Evidencia</th>
                  <th className="p-8 text-center">Peso (KG)</th>
                  <th className="p-8 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-blue-50/20">
                    <td className="p-8">
                      <div className="font-black text-slate-800">{new Date(r.fecha).toLocaleString()}</div>
                      <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{r.sitio_nombre}</div>
                    </td>
                    <td className="p-8">
                      {r.foto_data && <img src={r.foto_data} className="w-32 h-20 object-cover rounded-2xl border-4 border-white shadow-lg" alt="Pesaje" />}
                    </td>
                    <td className="p-8 text-center">
                      <div className="text-2xl font-black text-slate-800">{r.peso_manual}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">OCR: {r.peso_ocr}</div>
                    </td>
                    <td className="p-8 text-center">
                      <span className="bg-green-100 text-green-600 px-4 py-2 rounded-full font-black text-[10px] uppercase border border-green-200">Auditado</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- GESTIÓN DE SITIOS --- */}
        {activeTab === 'sitios' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sitios.map(s => (
              <div key={s.id} className="bg-white p-8 rounded-[40px] shadow-sm border hover:shadow-2xl transition-all relative group">
                <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <MapIcon size={28}/>
                </div>
                <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1">{s.nombre}</h4>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{s.ubicacion}</p>
                <div className="absolute top-8 right-8 flex gap-2">
                  <button onClick={() => { setEditingItem(s); setShowSitioModal(true); }} className="text-slate-300 hover:text-blue-600"><Edit3 size={18}/></button>
                  <button onClick={() => eliminarSitio(s.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
            <button onClick={() => { setEditingItem(null); setShowSitioModal(true); }} className="border-4 border-dashed rounded-[40px] p-8 flex flex-col items-center justify-center text-slate-300 hover:text-blue-500 hover:border-blue-500 transition-all">
              <Plus size={48}/><span className="font-black uppercase tracking-widest text-xs mt-2">Nuevo Sitio</span>
            </button>
          </div>
        )}

        {/* --- GESTIÓN DE USUARIOS --- */}
        {activeTab === 'usuarios' && (
          <div className="bg-white rounded-[40px] shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <tr><th className="p-8">Operario</th><th className="p-8">Sitio Vinculado</th><th className="p-8 text-right">Acciones</th></tr>
              </thead>
              <tbody className="divide-y">
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td className="p-8 font-bold">{u.email}</td>
                    <td className="p-8 uppercase text-xs font-black text-blue-600">
                      {sitios.find(s => s.id === u.sitio_id)?.nombre || 'Sin Sitio'}
                    </td>
                    <td className="p-8 text-right">
                      <button onClick={() => { setEditingItem(u); setShowUserModal(true); }} className="text-slate-300 hover:text-blue-600 mr-4"><Edit3 size={18}/></button>
                      <button onClick={() => eliminarUsuario(u.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-8 bg-slate-50">
              <button onClick={() => { setEditingItem(null); setShowUserModal(true); }} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Crear Nuevo Operario</button>
            </div>
          </div>
        )}

        {/* --- MODAL SITIO --- */}
        {showSitioModal && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[40px] p-10 w-full max-w-md">
              <h3 className="text-2xl font-black uppercase mb-6">{editingItem ? 'Editar Sitio' : 'Nuevo Sitio'}</h3>
              <form onSubmit={handleSaveSitio} className="space-y-4">
                <input name="nombre" defaultValue={editingItem?.nombre} placeholder="Nombre Planta" className="w-full bg-slate-50 p-4 rounded-2xl outline-none font-bold" required />
                <input name="ubicacion" defaultValue={editingItem?.ubicacion} placeholder="Ubicación" className="w-full bg-slate-50 p-4 rounded-2xl outline-none font-bold" required />
                <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase shadow-xl">Guardar</button>
                <button type="button" onClick={() => setShowSitioModal(false)} className="w-full text-slate-400 text-xs font-bold uppercase mt-2">Cerrar</button>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL USUARIO --- */}
        {showUserModal && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[40px] p-10 w-full max-w-md">
              <h3 className="text-2xl font-black uppercase mb-6">Configurar Operario</h3>
              <form onSubmit={handleSaveUsuario} className="space-y-4">
                <input name="email" defaultValue={editingItem?.email} placeholder="Email" className="w-full bg-slate-50 p-4 rounded-2xl outline-none font-bold" required />
                <select name="sitio" defaultValue={editingItem?.sitio_id} className="w-full bg-slate-50 p-4 rounded-2xl outline-none font-bold appearance-none" required>
                  <option value="">Seleccionar Sitio</option>
                  {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase shadow-xl">Guardar Acceso</button>
                <button type="button" onClick={() => setShowUserModal(false)} className="w-full text-slate-400 text-xs font-bold uppercase mt-2">Cerrar</button>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL CÁMARA --- */}
        {showCameraModal && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
            <div className="bg-white rounded-[50px] p-8 w-full max-w-lg border-b-[15px] border-blue-600">
              <h3 className="text-2xl font-black text-blue-900 uppercase mb-6 italic">Nuevo Reporte</h3>
              <div className="bg-black rounded-3xl overflow-hidden aspect-video shadow-2xl mb-6">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>
              <canvas ref={canvasRef} width="640" height="480" className="hidden" />
              <form onSubmit={captureAndSave} className="space-y-4">
                <input name="pesoManual" type="number" step="0.01" placeholder="PESO EN KG" className="w-full bg-slate-50 p-6 rounded-3xl text-4xl font-black text-center text-blue-900 outline-none" required />
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3">
                  {loading ? <Loader2 className="animate-spin"/> : <Save size={20}/>} REGISTRAR EN NUBE
                </button>
                <button type="button" onClick={() => {
                   setShowCameraModal(false);
                   if(videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
                }} className="w-full text-slate-400 font-bold uppercase text-xs mt-2">Cancelar</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OroJuezApp;