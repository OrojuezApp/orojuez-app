import React, { useState } from 'react';
import { Download, FileText, Camera, MapPin, Search, User, Lock, LogOut, Plus, Users, LayoutDashboard, Map as MapIcon, X, Eye, Database, Settings } from 'lucide-react';

const OroJuezApp = () => {
  // --- ESTADOS GLOBALES ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('reportes'); 
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState('');

  // --- ESTADOS DE MODALES ---
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSitioModal, setShowSitioModal] = useState(false);

  // --- DATOS SIMULADOS (Para que veas la app con vida) ---
  const [sitios, setSitios] = useState([
    { id: 1, nombre: 'Planta Machala', ubicacion: 'El Oro' },
    { id: 2, nombre: 'Mina El Oro', ubicacion: 'Zaruma' }
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

  // --- LÓGICA DE LOGIN ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (userEmail === 'industria.orojuez@gmail.com') {
      setRole('SUPER_ADMIN');
    } else if (userEmail.includes('auditor')) {
      setRole('AUDITOR');
    } else {
      setRole('OPERATIVO');
    }
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border-t-[12px] border-blue-900">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-900 text-white w-20 h-20 flex items-center justify-center rounded-2xl font-black text-3xl mb-4 shadow-xl">OJ</div>
            <h1 className="text-3xl font-black text-blue-900 tracking-tighter">ORO JUEZ S.A.</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Sistema de Auditoría</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <User className="absolute left-4 top-4 text-slate-300" size={20} />
              <input type="email" placeholder="Usuario / Email" className="w-full border-2 border-slate-100 p-4 pl-12 rounded-2xl outline-none focus:border-blue-900 transition-all" onChange={(e) => setUserEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-300" size={20} />
              <input type="password" placeholder="Contraseña" className="w-full border-2 border-slate-100 p-4 pl-12 rounded-2xl outline-none focus:border-blue-900 transition-all" required />
            </div>
            <button className="w-full bg-blue-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-800 transition-all active:scale-95 uppercase tracking-widest text-sm">Entrar al Sistema</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-700">
      {/* SIDEBAR NAVEGACIÓN */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col p-8 sticky top-0 h-screen shadow-2xl">
        <div className="mb-12 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg font-black text-xl">OJ</div>
          <span className="font-black tracking-tighter text-xl uppercase italic">Oro Juez S.A.</span>
        </div>
        <nav className="space-y-3 flex-1">
          <button onClick={() => setActiveTab('reportes')} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${activeTab === 'reportes' ? 'bg-blue-600 shadow-lg font-bold' : 'hover:bg-slate-800 text-slate-400'}`}>
            <LayoutDashboard size={22}/> Reportes
          </button>
          {role === 'SUPER_ADMIN' && (
            <>
              <button onClick={() => setActiveTab('usuarios')} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${activeTab === 'usuarios' ? 'bg-blue-600 shadow-lg font-bold' : 'hover:bg-slate-800 text-slate-400'}`}>
                <Users size={22}/> Usuarios
              </button>
              <button onClick={() => setActiveTab('sitios')} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${activeTab === 'sitios' ? 'bg-blue-600 shadow-lg font-bold' : 'hover:bg-slate-800 text-slate-400'}`}>
                <MapIcon size={22}/> Sitios
              </button>
            </>
          )}
        </nav>
        <div className="pt-8 border-t border-slate-800">
          <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-4 text-red-400 p-4 hover:bg-red-900/20 rounded-2xl w-full transition-all font-bold">
            <LogOut size={22}/> Salir
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
              {activeTab === 'reportes' ? 'Auditoría Global de Pesajes' : activeTab === 'usuarios' ? 'Gestión de Personal' : 'Configuración de Sitios'}
            </h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{role} — {userEmail}</p>
          </div>
          {activeTab === 'usuarios' && (
            <button onClick={() => setShowUserModal(true)} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl hover:bg-blue-800 transition-all">
              <Plus size={20}/> NUEVO USUARIO
            </button>
          )}
          {activeTab === 'sitios' && (
            <button onClick={() => setShowSitioModal(true)} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl hover:bg-blue-800 transition-all">
              <Plus size={20}/> NUEVO SITIO
            </button>
          )}
        </header>

        {/* CONTENIDO DE REPORTES */}
        {activeTab === 'reportes' && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Rango de Fecha</label>
                <input type="date" className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Sitio / Planta</label>
                <select className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-600">
                  <option>Todos los Sitios</option>
                  {sitios.map(s => <option key={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-black transition-all shadow-lg">FILTRAR DATOS</button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                    <th className="p-6">Información del Registro</th>
                    <th className="p-6">Evidencia Visual</th>
                    <th className="p-6 text-center">Peso Manual / OCR</th>
                    <th className="p-6 text-center">Diferencia</th>
                    <th className="p-6 text-center">GPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {records.map(r => (
                    <tr key={r.id} className="hover:bg-blue-50/30 transition-all">
                      <td className="p-6">
                        <div className="text-lg font-black text-slate-800 leading-tight">{r.fecha}</div>
                        <div className="text-xs font-bold text-blue-600 uppercase mt-1">{r.sitio} — {r.usuario}</div>
                      </td>
                      <td className="p-6">
                        <a href={r.fotoUrl} target="_blank" rel="noreferrer" className="block w-40 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg relative group">
                          <img src={r.fotoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-blue-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="text-white" size={24} />
                          </div>
                        </a>
                      </td>
                      <td className="p-6 text-center">
                        <div className="text-xl font-black text-slate-700">{r.pesoManual} kg</div>
                        <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">OCR: {r.pesoOCR} kg</div>
                      </td>
                      <td className="p-6 text-center">
                        <span className="bg-red-100 text-red-600 px-4 py-2 rounded-full font-black text-xs italic shadow-sm">+{r.diferencia} kg</span>
                      </td>
                      <td className="p-6 text-center">
                        <button className="p-4 bg-slate-100 rounded-2xl text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                          <MapPin size={22} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VISTA DE USUARIOS */}
        {activeTab === 'usuarios' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden max-w-5xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                <tr>
                  <th className="p-6">Email de Acceso</th>
                  <th className="p-6">Rol de Sistema</th>
                  <th className="p-6">Sitio / Planta Vinculada</th>
                  <th className="p-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-all">
                    <td className="p-6 font-bold text-slate-700">{u.email}</td>
                    <td className="p-6"><span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-[10px] font-black">{u.rol}</span></td>
                    <td className="p-6 font-black text-slate-400 text-xs italic">{u.sitio}</td>
                    <td className="p-6"><button className="text-slate-300 hover:text-red-500 font-bold text-xs uppercase">Eliminar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL NUEVO USUARIO */}
        {showUserModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl relative border-b-[12px] border-blue-600">
              <button onClick={() => setShowUserModal(false)} className="absolute right-8 top-8 text-slate-300 hover:text-red-500 transition-colors"><X size={30}/></button>
              <h3 className="text-3xl font-black text-blue-900 mb-8 uppercase tracking-tighter leading-none">Registrar Nuevo<br/>Operario</h3>
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setShowUserModal(false); alert("Usuario Creado Exitosamente"); }}>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email del Usuario</label>
                  <input type="email" className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold" placeholder="nombre@orojuez.com" required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Vincular a Planta/Sitio</label>
                  <select className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold appearance-none">
                    {sitios.map(s => <option key={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest">Guardar Registro</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OroJuezApp;
