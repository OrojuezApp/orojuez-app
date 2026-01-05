import React, { useState } from 'react';
import { Download, FileText, Camera, MapPin, Search, User, Lock, LogOut, Plus, Users, LayoutDashboard, Map as MapIcon, Database, X } from 'lucide-react';

const OroJuezApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('reportes'); 
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState('');
  
  // ESTADOS PARA DATOS
  const [sitios, setSitios] = useState([
    { id: 1, nombre: 'Planta Machala' }, 
    { id: 2, nombre: 'Mina El Oro' }
  ]);
  const [usuarios, setUsuarios] = useState([
    { id: 1, email: 'operario1@orojuez.com', rol: 'OPERATIVO', sitio: 'Planta Machala' },
    { id: 2, email: 'auditor@orojuez.com', rol: 'AUDITOR', sitio: 'GLOBAL' }
  ]);
  const [records] = useState([
    {
      id: 1,
      fecha: '1/5/2026, 1:01 PM',
      usuario: 'Operario 01',
      sitio: 'Planta Machala',
      bascula: 'CARDINAL B1',
      pesoManual: 12500,
      pesoOCR: 12495,
      diferencia: 5,
      fotoUrl: 'https://images.unsplash.com/photo-1590243677224-746765278783?w=300', 
      coords: '-1.234, -78.567'
    }
  ]);

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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-blue-900">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-900 text-white p-4 rounded-xl font-black text-2xl mb-2">OJ</div>
            <h1 className="text-2xl font-black text-blue-900 tracking-tighter text-center">ORO JUEZ S.A.</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Sistema de Auditoría de Pesaje</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-300" size={18} />
              <input type="email" placeholder="Correo Electrónico" className="w-full border-2 border-gray-50 rounded-xl p-3 pl-10 focus:border-blue-900 outline-none transition-all text-sm" onChange={(e) => setUserEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-300" size={18} />
              <input type="password" placeholder="Contraseña" className="w-full border-2 border-gray-50 rounded-xl p-3 pl-10 focus:border-blue-900 outline-none transition-all text-sm" required />
            </div>
            <button className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition-all shadow-xl active:scale-95">INICIAR SESIÓN</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* SIDEBAR (Visible para Admin y Auditor) */}
      {(role === 'SUPER_ADMIN' || role === 'AUDITOR') && (
        <aside className="w-64 bg-slate-900 text-white flex flex-col p-6 hidden lg:flex sticky top-0 h-screen">
          <div className="mb-10 flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded font-black">OJ</div>
            <span className="font-black tracking-tighter text-lg uppercase">Oro Juez S.A.</span>
          </div>
          <nav className="space-y-2 flex-1">
            <button onClick={() => setActiveTab('reportes')} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${activeTab === 'reportes' ? 'bg-blue-600 font-bold' : 'hover:bg-slate-800 text-slate-400'}`}>
              <LayoutDashboard size={20}/> Reportes Globales
            </button>
            {role === 'SUPER_ADMIN' && (
              <>
                <button onClick={() => setActiveTab('usuarios')} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${activeTab === 'usuarios' ? 'bg-blue-600 font-bold' : 'hover:bg-slate-800 text-slate-400'}`}>
                  <Users size={20}/> Gestión Usuarios
                </button>
                <button onClick={() => setActiveTab('sitios')} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${activeTab === 'sitios' ? 'bg-blue-600 font-bold' : 'hover:bg-slate-800 text-slate-400'}`}>
                  <MapIcon size={20}/> Configurar Sitios
                </button>
              </>
            )}
          </nav>
          <div className="pt-6 border-t border-slate-800">
            <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-3 text-red-400 p-3 hover:bg-red-900/20 rounded-xl w-full transition-all text-sm font-bold">
              <LogOut size={18}/> Cerrar Sesión
            </button>
          </div>
        </aside>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto">
        {/* TOP BAR PARA MÓVILES Y OPERARIOS */}
        <header className="bg-white border-b border-gray-100 p-4 flex justify-between items-center sticky top-0 z-40 lg:bg-transparent lg:border-none">
          <div className="lg:hidden font-black text-blue-900">ORO JUEZ S.A.</div>
          <div className="ml-auto flex items-center gap-4">
            {role === 'OPERATIVO' && (
               <button className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg animate-pulse">
                <Plus size={16}/> NUEVO PESAJE
               </button>
            )}
            <div className="bg-white p-2 px-4 rounded-xl shadow-sm border border-gray-100 text-right">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{role}</p>
              <p className="text-xs font-bold text-gray-500">{userEmail}</p>
            </div>
            {role === 'OPERATIVO' && (
              <button onClick={() => setIsAuthenticated(false)} className="p-2 text-red-500"><LogOut size={20}/></button>
            )}
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* VISTA DE REPORTES */}
          {activeTab === 'reportes' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Auditoría de Pesajes</h2>
                <div className="flex gap-2">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Download size={14}/> EXCEL</button>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><FileText size={14}/> PDF</button>
                </div>
              </div>

              {/* FILTROS */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                <input type="date" className="bg-gray-50 p-3 rounded-xl text-xs font-bold outline-none border-none focus:ring-2 focus:ring-blue-600" />
                <select className="bg-gray-50 p-3 rounded-xl text-xs font-bold outline-none border-none focus:ring-2 focus:ring-blue-600">
                  <option>Todos los Sitios</option>
                  {sitios.map(s => <option key={s.id}>{s.nombre}</option>)}
                </select>
                <select className="bg-gray-50 p-3 rounded-xl text-xs font-bold outline-none border-none focus:ring-2 focus:ring-blue-600">
                  <option>Todos los Usuarios</option>
                  {usuarios.map(u => <option key={u.id}>{u.email}</option>)}
                </select>
                <button className="bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all">FILTRAR DATOS</button>
              </div>

              {/* TABLA REFORZADA */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-[10px] text-white font-black uppercase tracking-widest">
                    <tr>
                      <th className="p-4">Fecha / Usuario</th>
                      <th className="p-4">Sitio / Equipo</th>
                      <th className="p-4">Evidencia Foto</th>
                      <th className="p-4 text-center">Peso Manual</th>
                      <th className="p-4 text-center">Peso OCR</th>
                      <th className="p-4 text-center">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map(record => (
                      <tr key={record.id} className="text-sm hover:bg-blue-50/50 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-gray-800">{record.fecha}</p>
                          <p className="text-[10px] text-blue-600 font-bold uppercase">{record.usuario}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-gray-700">{record.sitio}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{record.bascula}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <img src={record.fotoUrl} alt="Visor" className="w-24 h-14 object-cover rounded-lg border-2 border-white shadow-md" />
                            <button className="text-[10px] text-blue-600 font-black underline text-left">ABRIR ORIGINAL</button>
                          </div>
                        </td>
                        <td className="p-4 text-center font-black text-gray-700">{record.pesoManual} kg</td>
                        <td className="p-4 text-center font-black text-blue-700">{record.pesoOCR} kg</td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black ${record.diferencia > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {record.diferencia} kg
                          </span>
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
            <div className="max-w-4xl space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter text-blue-900">Control de Personal</h2>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg"><Plus size={18}/> REGISTRAR OPERARIO</button>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                    <tr>
                      <th className="p-4">Email de Acceso</th>
                      <th className="p-4">Rol Asignado</th>
                      <th className="p-4">Sitio Vinculado (Scale Filter)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {usuarios.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-gray-700">{u.email}</td>
                        <td className="p-4"><span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">{u.rol}</span></td>
                        <td className="p-4 font-bold text-gray-500 italic">{u.sitio}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-xs">
                <strong>Nota de seguridad:</strong> Cada operario solo podrá registrar pesajes en el sitio asignado. El Auditor podrá ver todos los sitios pero no podrá crear nuevos registros.
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OroJuezApp;
