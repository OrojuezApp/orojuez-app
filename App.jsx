import React, { useState } from 'react';
import { 
  Download, FileText, Camera, MapPin, Search, User, Lock, 
  LogOut, Plus, Users, LayoutDashboard, Map as MapIcon, 
  X, Eye, Database, Settings, Trash2, Edit3, Save 
} from 'lucide-react';

const OroJuezApp = () => {
  // --- ESTADOS DE SISTEMA ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('reportes'); 
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState('');

  // --- ESTADOS DE MODALES ---
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSitioModal, setShowSitioModal] = useState(false);
  const [editingSitio, setEditingSitio] = useState(null);

  // --- DATOS DINÁMICOS ---
  const [sitios, setSitios] = useState([
    { id: 1, nombre: 'Planta Machala', ubicacion: 'El Oro', basculas: 2 },
    { id: 2, nombre: 'Mina El Oro', ubicacion: 'Zaruma', basculas: 1 }
  ]);
  
  const [usuarios, setUsuarios] = useState([
    { id: 1, email: 'operario1@orojuez.com', rol: 'OPERATIVO', sitio: 'Planta Machala' },
    { id: 2, email: 'auditor@orojuez.com', rol: 'AUDITOR', sitio: 'GLOBAL' }
  ]);

  const [records] = useState([
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

  // --- FORMULARIOS ---
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', sitio: 'Planta Machala' });
  const [formSitio, setFormSitio] = useState({ nombre: '', ubicacion: '' });

  // --- LÓGICA DE SITIOS (BORRAR Y EDITAR) ---
  const handleSaveSitio = (e) => {
    e.preventDefault();
    if (editingSitio) {
      // Editar existente
      setSitios(sitios.map(s => s.id === editingSitio.id ? { ...s, ...formSitio } : s));
      setEditingSitio(null);
    } else {
      // Crear nuevo
      const site = { id: Date.now(), ...formSitio, basculas: 0 };
      setSitios([...sitios, site]);
    }
    setShowSitioModal(false);
    setFormSitio({ nombre: '', ubicacion: '' });
  };

  const eliminarSitio = (id) => {
    if(window.confirm("¿Está seguro de eliminar este sitio? Se perderá el vínculo con los operarios.")) {
      setSitios(sitios.filter(s => s.id !== id));
    }
  };

  const iniciarEdicionSitio = (sitio) => {
    setEditingSitio(sitio);
    setFormSitio({ nombre: sitio.nombre, ubicacion: sitio.ubicacion });
    setShowSitioModal(true);
  };

  // --- LÓGICA DE USUARIOS ---
  const agregarUsuario = (e) => {
    e.preventDefault();
    const user = { id: Date.now(), email: nuevoUsuario.email, rol: 'OPERATIVO', sitio: nuevoUsuario.sitio };
    setUsuarios([...usuarios, user]);
    setShowUserModal(false);
    setNuevoUsuario({ email: '', sitio: 'Planta Machala' });
  };

  const eliminarUsuario = (id) => {
    setUsuarios(usuarios.filter(u => u.id !== id));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (userEmail === 'industria.orojuez@gmail.com') {
      setRole('SUPER_ADMIN');
      setIsAuthenticated(true);
    } else {
      alert("Para administración use industria.orojuez@gmail.com");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md border-t-[15px] border-blue-900">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-900 text-white w-20 h-20 flex items-center justify-center rounded-3xl font-black text-3xl mb-4 shadow-xl">OJ</div>
            <h1 className="text-3xl font-black text-blue-900 tracking-tighter">ORO JUEZ S.A.</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Panel Administrativo</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <input type="email" placeholder="Usuario / Email" className="w-full border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-900" onChange={(e) => setUserEmail(e.target.value)} required />
            <input type="password" placeholder="Contraseña" className="w-full border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-900" required />
            <button className="w-full bg-blue-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-800 transition-all uppercase tracking-widest text-sm">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-700">
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col p-8 sticky top-0 h-screen shadow-2xl z-50">
        <div className="mb-12 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg font-black text-xl">OJ</div>
          <span className="font-black tracking-tighter text-xl uppercase italic">Oro Juez S.A.</span>
        </div>
        <nav className="space-y-3 flex-1">
          <button onClick={() => setActiveTab('reportes')} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${activeTab === 'reportes' ? 'bg-blue-600 font-bold' : 'hover:bg-slate-800 text-slate-400'}`}>
            <LayoutDashboard size={22}/> Reportes
          </button>
          <button onClick={() => setActiveTab('usuarios')} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${activeTab === 'usuarios' ? 'bg-blue-600 font-bold' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Users size={22}/> Usuarios
          </button>
          <button onClick={() => setActiveTab('sitios')} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${activeTab === 'sitios' ? 'bg-blue-600 font-bold' : 'hover:bg-slate-800 text-slate-400'}`}>
            <MapIcon size={22}/> Sitios
          </button>
        </nav>
        <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-4 text-red-400 p-4 hover:bg-red-900/20 rounded-2xl font-bold">
          <LogOut size={22}/> Salir
        </button>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
            {activeTab === 'reportes' ? 'Reportes Globales' : activeTab === 'usuarios' ? 'Gestión de Usuarios' : 'Gestión de Sitios'}
          </h2>
          {activeTab === 'sitios' && (
            <button onClick={() => { setEditingSitio(null); setFormSitio({nombre:'', ubicacion:''}); setShowSitioModal(true); }} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl hover:bg-blue-800">
              <Plus size={18}/> NUEVO SITIO
            </button>
          )}
          {activeTab === 'usuarios' && (
            <button onClick={() => setShowUserModal(true)} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl hover:bg-blue-800">
              <Plus size={18}/> NUEVO USUARIO
            </button>
          )}
        </header>

        {/* VISTA REPORTES (Tabla ya conocida) */}
        {activeTab === 'reportes' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                  <tr>
                    <th className="p-6">Registro</th>
                    <th className="p-6">Foto</th>
                    <th className="p-6 text-center">Manual / OCR</th>
                    <th className="p-6 text-center">Dif.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {records.map(r => (
                    <tr key={r.id}>
                      <td className="p-6"><div className="font-black">{r.fecha}</div><div className="text-xs text-blue-600 font-bold uppercase">{r.sitio}</div></td>
                      <td className="p-6"><img src={r.fotoUrl} className="w-24 h-14 object-cover rounded-lg border shadow-sm" alt="Visor" /></td>
                      <td className="p-6 text-center font-black">{r.pesoManual} / <span className="text-blue-600">{r.pesoOCR}</span></td>
                      <td className="p-6 text-center"><span className="bg-red-100 text-red-600 px-3 py-1 rounded-full font-black text-xs">{r.diferencia} kg</span></td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}

        {/* VISTA SITIOS (Con Editar y Borrar) */}
        {activeTab === 'sitios' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sitios.map(s => (
              <div key={s.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl"><MapIcon size={24}/></div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => iniciarEdicionSitio(s)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit3 size={18}/></button>
                    <button onClick={() => eliminarSitio(s.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                  </div>
                </div>
                <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-tight mb-1">{s.nombre}</h4>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{s.ubicacion}</p>
                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Básculas: {s.basculas}</span>
                  <span className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded font-bold uppercase tracking-tighter tracking-widest">Activo</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VISTA USUARIOS */}
        {activeTab === 'usuarios' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr><th className="p-6">Usuario</th><th className="p-6">Rol</th><th className="p-6">Sitio Asignado</th><th className="p-6"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuarios.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-all">
                      <td className="p-6 font-bold text-slate-700">{u.email}</td>
                      <td className="p-6"><span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black">{u.rol}</span></td>
                      <td className="p-6 font-black text-slate-400 text-xs italic">{u.sitio}</td>
                      <td className="p-6 text-right"><button onClick={() => eliminarUsuario(u.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={18}/></button></td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}

        {/* MODAL SITIO (CREAR Y EDITAR) */}
        {showSitioModal && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl relative border-b-[12px] border-blue-600">
              <button onClick={() => setShowSitioModal(false)} className="absolute right-8 top-8 text-slate-300 hover:text-red-500"><X size={30}/></button>
              <h3 className="text-3xl font-black text-blue-900 mb-8 uppercase tracking-tighter leading-none">
                {editingSitio ? 'Editar Sitio' : 'Nuevo Sitio'}
              </h3>
              <form className="space-y-6" onSubmit={handleSaveSitio}>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nombre de la Planta</label>
                  <input type="text" className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold" value={formSitio.nombre} onChange={(e) => setFormSitio({...formSitio, nombre: e.target.value})} placeholder="Ej. Planta Central" required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Ubicación / Ciudad</label>
                  <input type="text" className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold" value={formSitio.ubicacion} onChange={(e) => setFormSitio({...formSitio, ubicacion: e.target.value})} placeholder="Ej. Machala" required />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest">
                  {editingSitio ? 'Guardar Cambios' : 'Registrar Sitio'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL USUARIO */}
        {showUserModal && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl relative border-b-[12px] border-blue-600">
              <button onClick={() => setShowUserModal(false)} className="absolute right-8 top-8 text-slate-300 hover:text-red-500"><X size={30}/></button>
              <h3 className="text-3xl font-black text-blue-900 mb-8 uppercase tracking-tighter">Nuevo Operario</h3>
              <form className="space-y-6" onSubmit={agregarUsuario}>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email del Usuario</label>
                  <input type="email" className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold" onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} placeholder="ejemplo@orojuez.com" required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Vincular a Sitio</label>
                  <select className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold appearance-none" onChange={(e) => setNuevoUsuario({...nuevoUsuario, sitio: e.target.value})}>
                    {sitios.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest">Crear Acceso</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OroJuezApp;
