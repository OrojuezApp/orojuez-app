import React, { useState } from 'react';
import { 
  Download, FileText, Camera, MapPin, Search, User, Lock, 
  LogOut, Plus, Users, LayoutDashboard, Map as MapIcon, 
  X, Eye, Database, Settings, Trash2, CheckCircle 
} from 'lucide-react';

const OroJuezApp = () => {
  // --- ESTADOS DE AUTENTICACIÓN Y NAVEGACIÓN ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('reportes'); 
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState('');

  // --- ESTADOS DE CONTROL DE MODALES ---
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSitioModal, setShowSitioModal] = useState(false);

  // --- ESTADOS DE DATOS (ESTO ES LO QUE PERMITE CREAR NUEVOS) ---
  const [sitios, setSitios] = useState([
    { id: 1, nombre: 'Planta Machala', ubicacion: 'El Oro', basculas: 2 },
    { id: 2, nombre: 'Mina El Oro', ubicacion: 'Zaruma', basculas: 1 }
  ]);
  
  const [usuarios, setUsuarios] = useState([
    { id: 1, email: 'operario1@orojuez.com', rol: 'OPERATIVO', sitio: 'Planta Machala' },
    { id: 2, email: 'auditor@orojuez.com', rol: 'AUDITOR', sitio: 'GLOBAL' }
  ]);

  const [records, setRecords] = useState([
    {
      id: 1,
      fecha: '05/01/2026, 2:10 PM',
      usuario: 'Operario 01',
      sitio: 'Planta Machala',
      bascula: 'CARDINAL B1',
      pesoManual: 12500,
      pesoOCR: 12495,
      diferencia: 5,
      fotoUrl: 'https://images.unsplash.com/photo-1590243677224-746765278783?w=800',
      coords: '-1.234, -78.567'
    }
  ]);

  // --- FUNCIONES PARA CREAR NUEVOS REGISTROS (LÓGICA ACTIVA) ---
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', sitio: 'Planta Machala' });
  const [nuevoSitio, setNuevoSitio] = useState({ nombre: '', ubicacion: '' });

  const agregarUsuario = (e) => {
    e.preventDefault();
    const user = {
      id: usuarios.length + 1,
      email: nuevoUsuario.email,
      rol: 'OPERATIVO',
      sitio: nuevoUsuario.sitio
    };
    setUsuarios([...usuarios, user]);
    setShowUserModal(false);
    setNuevoUsuario({ email: '', sitio: 'Planta Machala' });
  };

  const agregarSitio = (e) => {
    e.preventDefault();
    const site = {
      id: sitios.length + 1,
      nombre: nuevoSitio.nombre,
      ubicacion: nuevoSitio.ubicacion,
      basculas: 0
    };
    setSitios([...sitios, site]);
    setShowSitioModal(false);
    setNuevoSitio({ nombre: '', ubicacion: '' });
  };

  const eliminarUsuario = (id) => {
    setUsuarios(usuarios.filter(u => u.id !== id));
  };

  // --- LÓGICA DE LOGIN ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (userEmail === 'industria.orojuez@gmail.com') {
      setRole('SUPER_ADMIN');
    } else {
      setRole('OPERATIVO');
    }
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md border-t-[15px] border-blue-900">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-900 text-white w-20 h-20 flex items-center justify-center rounded-3xl font-black text-3xl mb-4 shadow-2xl animate-bounce">OJ</div>
            <h1 className="text-3xl font-black text-blue-900 tracking-tighter">ORO JUEZ S.A.</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Seguridad y Pesaje Digital</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <User className="absolute left-4 top-4 text-slate-300" size={20} />
              <input type="email" placeholder="industria.orojuez@gmail.com" className="w-full border-2 border-slate-50 p-4 pl-12 rounded-2xl outline-none focus:border-blue-900 focus:bg-white bg-slate-50 transition-all font-medium" onChange={(e) => setUserEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-300" size={20} />
              <input type="password" placeholder="••••••••" className="w-full border-2 border-slate-50 p-4 pl-12 rounded-2xl outline-none focus:border-blue-900 focus:bg-white bg-slate-50 transition-all" required />
            </div>
            <button className="w-full bg-blue-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-800 hover:shadow-blue-900/20 transition-all active:scale-95 uppercase tracking-widest text-sm">Ingresar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-700">
      {/* SIDEBAR NAVEGACIÓN - 72 Unidades de ancho */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col p-8 sticky top-0 h-screen shadow-[10px_0_30px_rgba(0,0,0,0.1)]">
        <div className="mb-12 flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl font-black text-2xl shadow-lg shadow-blue-600/30">OJ</div>
          <div className="flex flex-col leading-none">
            <span className="font-black tracking-tighter text-xl uppercase italic">Oro Juez</span>
            <span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">Corporativo</span>
          </div>
        </div>
        
        <nav className="space-y-4 flex-1">
          <button onClick={() => setActiveTab('reportes')} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${activeTab === 'reportes' ? 'bg-blue-600 shadow-xl shadow-blue-600/20 font-bold scale-105' : 'hover:bg-slate-800 text-slate-400'}`}>
            <LayoutDashboard size={22}/> <span className="text-sm uppercase tracking-wide">Reportes</span>
          </button>
          
          {role === 'SUPER_ADMIN' && (
            <>
              <button onClick={() => setActiveTab('usuarios')} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${activeTab === 'usuarios' ? 'bg-blue-600 shadow-xl shadow-blue-600/20 font-bold scale-105' : 'hover:bg-slate-800 text-slate-400'}`}>
                <Users size={22}/> <span className="text-sm uppercase tracking-wide">Usuarios</span>
              </button>
              <button onClick={() => setActiveTab('sitios')} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${activeTab === 'sitios' ? 'bg-blue-600 shadow-xl shadow-blue-600/20 font-bold scale-105' : 'hover:bg-slate-800 text-slate-400'}`}>
                <MapIcon size={22}/> <span className="text-sm uppercase tracking-wide">Sitios</span>
              </button>
            </>
          )}
        </nav>

        <div className="pt-8 border-t border-slate-800">
          <div className="mb-6 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
             <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Sesión activa</p>
             <p className="text-xs font-bold text-blue-400 truncate">{userEmail}</p>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-4 text-red-400 p-4 hover:bg-red-500/10 rounded-2xl w-full transition-all font-black text-sm uppercase tracking-widest">
            <LogOut size={20}/> Salir
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-start mb-12">
          <div>
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
              {activeTab === 'reportes' ? 'Auditoría de Pesajes' : activeTab === 'usuarios' ? 'Gestión de Operarios' : 'Configuración de Plantas'}
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">{role} — Conectado al Servidor</p>
            </div>
          </div>

          <div className="flex gap-3">
             {activeTab === 'usuarios' && (
              <button onClick={() => setShowUserModal(true)} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-3 shadow-2xl hover:bg-blue-800 hover:-translate-y-1 transition-all uppercase tracking-widest">
                <Plus size={18}/> Nuevo Usuario
              </button>
            )}
            {activeTab === 'sitios' && (
              <button onClick={() => setShowSitioModal(true)} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-3 shadow-2xl hover:bg-blue-800 hover:-translate-y-1 transition-all uppercase tracking-widest">
                <Plus size={18}/> Nuevo Sitio
              </button>
            )}
          </div>
        </header>

        {/* --- VISTA: REPORTES --- */}
        {activeTab === 'reportes' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* BARRA DE FILTROS REFORZADA */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-wrap gap-6 items-end">
              <div className="flex-1 min-w-[240px]">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest ml-1">Rango Cronológico</label>
                <input type="date" className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold border-2 border-transparent focus:border-blue-600 focus:bg-white outline-none transition-all" />
              </div>
              <div className="flex-1 min-w-[240px]">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest ml-1">Filtrar por Sitio</label>
                <select className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold border-2 border-transparent focus:border-blue-600 focus:bg-white outline-none transition-all appearance-none">
                  <option>Visualización Global</option>
                  {sitios.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                </select>
              </div>
              <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs hover:bg-black transition-all shadow-xl uppercase tracking-widest">Consultar</button>
            </div>

            {/* TABLA DE AUDITORÍA PREMIUM */}
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-[0.2em]">
                    <th className="p-8">Detalles del Pesaje</th>
                    <th className="p-8">Evidencia Visual</th>
                    <th className="p-8 text-center">Pesaje (Kg)</th>
                    <th className="p-8 text-center">Margen Error</th>
                    <th className="p-8 text-center">Localización</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {records.map(r => (
                    <tr key={r.id} className="hover:bg-blue-50/20 transition-all group">
                      <td className="p-8">
                        <div className="text-xl font-black text-slate-800 leading-tight mb-1">{r.fecha}</div>
                        <div className="flex items-center gap-2">
                           <span className="bg-blue-100 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded uppercase">{r.sitio}</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {r.usuario}</span>
                        </div>
                      </td>
                      <td className="p-8">
                        <a href={r.fotoUrl} target="_blank" rel="noreferrer" className="block w-44 h-28 rounded-3xl overflow-hidden border-4 border-white shadow-xl relative group-hover:scale-105 transition-transform duration-500">
                          <img src={r.fotoUrl} className="w-full h-full object-cover" alt="Visor Cardinal" />
                          <div className="absolute inset-0 bg-blue-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="text-white" size={28} />
                          </div>
                        </a>
                      </td>
                      <td className="p-8 text-center">
                        <div className="text-2xl font-black text-slate-700 leading-none mb-1">{r.pesoManual}</div>
                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">OCR: {r.pesoOCR}</div>
                      </td>
                      <td className="p-8 text-center">
                        <div className="bg-red-50 text-red-600 inline-flex items-center gap-2 px-5 py-2 rounded-full font-black text-xs italic border border-red-100 shadow-sm">
                           +{r.diferencia} KG
                        </div>
                      </td>
                      <td className="p-8 text-center">
                        <button className="p-5 bg-slate-50 rounded-2xl text-slate-300 hover:bg-blue-600 hover:text-white hover:rotate-12 transition-all shadow-sm">
                          <MapPin size={24} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VISTA: USUARIOS --- */}
        {activeTab === 'usuarios' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden max-w-6xl animate-in slide-in-from-bottom-4 duration-500">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                <tr>
                  <th className="p-8">Identificador / Email</th>
                  <th className="p-8">Permisos de Acceso</th>
                  <th className="p-8">Sitio de Operación</th>
                  <th className="p-8 text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="p-8">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><User size={20}/></div>
                          <span className="font-bold text-slate-700">{u.email}</span>
                       </div>
                    </td>
                    <td className="p-8">
                       <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${u.rol === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {u.rol}
                       </span>
                    </td>
                    <td className="p-8 font-black text-slate-400 text-xs italic tracking-tight">{u.sitio}</td>
                    <td className="p-8 text-right">
                       <button onClick={() => eliminarUsuario(u.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 size={20}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usuarios.length === 0 && (
              <div className="p-20 text-center text-slate-300 font-bold italic uppercase tracking-widest">No hay usuarios registrados</div>
            )}
          </div>
        )}

        {/* --- VISTA: SITIOS --- */}
        {activeTab === 'sitios' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in zoom-in-95 duration-500">
            {sitios.map(s => (
              <div key={s.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-blue-900/5 transition-all group border-b-8 border-b-blue-900/10 hover:border-b-blue-600">
                <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  <MapIcon size={32}/>
                </div>
                <h4 className="text-2xl font-black text-slate-800 mb-1 uppercase tracking-tighter">{s.nombre}</h4>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">{s.ubicacion}</p>
                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-300 uppercase leading-none">Básculas</span>
                      <span className="text-xl font-black text-blue-600">{s.basculas}</span>
                   </div>
                   <button className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest">Configurar</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- MODAL: NUEVO USUARIO (CON LÓGICA DE GUARDADO) --- */}
        {showUserModal && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[50px] p-12 w-full max-w-lg shadow-2xl relative border-b-[15px] border-blue-600">
              <button onClick={() => setShowUserModal(false)} className="absolute right-10 top-10 text-slate-300 hover:text-red-500 transition-colors"><X size={32}/></button>
              <div className="mb-10 text-center md:text-left">
                <h3 className="text-4xl font-black text-blue-900 uppercase tracking-tighter leading-[0.9]">Registrar<br/>Operario</h3>
                <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest ml-1">Vincular usuario a sitio</p>
              </div>
              <form className="space-y-6" onSubmit={agregarUsuario}>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Email del Operario</label>
                  <input type="email" className="w-full bg-slate-50 p-5 rounded-3xl outline-none focus:ring-4 focus:ring-blue-600/10 font-bold text-slate-700 border-2 border-transparent focus:bg-white focus:border-blue-600 transition-all shadow-inner" placeholder="ejemplo@orojuez.com" value={nuevoUsuario.email} onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Vincular a Sitio</label>
                  <select className="w-full bg-slate-50 p-5 rounded-3xl outline-none focus:ring-4 focus:ring-blue-600/10 font-bold text-slate-700 border-2 border-transparent focus:bg-white focus:border-blue-600 transition-all shadow-inner appearance-none" value={nuevoUsuario.sitio} onChange={(e) => setNuevoUsuario({...nuevoUsuario, sitio: e.target.value})}>
                    {sitios.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-black py-6 rounded-3xl shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest mt-4">Guardar en Base de Datos</button>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL: NUEVO SITIO (CON LÓGICA DE GUARDADO) --- */}
        {showSitioModal && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[50px] p-12 w-full max-w-lg shadow-2xl relative border-b-[15px] border-blue-600">
              <button onClick={() => setShowSitioModal(false)} className="absolute right-10 top-10 text-slate-300 hover:text-red-500 transition-colors"><X size={32}/></button>
              <div className="mb-10">
                <h3 className="text-4xl font-black text-blue-900 uppercase tracking-tighter leading-[0.9]">Crear Nuevo<br/>Sitio / Mina</h3>
              </div>
              <form className="space-y-6" onSubmit={agregarSitio}>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Nombre de la Planta</label>
                  <input type="text" className="w-full bg-slate-50 p-5 rounded-3xl outline-none focus:ring-4 focus:ring-blue-600/10 font-bold text-slate-700 border-2 border-transparent focus:bg-white focus:border-blue-600 transition-all shadow-inner" placeholder="Ej. Mina Zaruma Norte" value={nuevoSitio.nombre} onChange={(e) => setNuevoSitio({...nuevoSitio, nombre: e.target.value})} required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Ubicación Geográfica</label>
                  <input type="text" className="w-full bg-slate-50 p-5 rounded-3xl outline-none focus:ring-4 focus:ring-blue-600/10 font-bold text-slate-700 border-2 border-transparent focus:bg-white focus:border-blue-600 transition-all shadow-inner" placeholder="Provincia / Ciudad" value={nuevoSitio.ubicacion} onChange={(e) => setNuevoSitio({...nuevoSitio, ubicacion: e.target.value})} required />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-black py-6 rounded-3xl shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest mt-4">Registrar Planta</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OroJuezApp;
