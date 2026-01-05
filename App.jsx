import React, { useState } from 'react';
import { Download, FileText, Camera, MapPin, Search, User, Lock, LogOut, Plus, Users, LayoutDashboard, Map as MapIcon, Database } from 'lucide-react';

const OroJuezApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('reportes'); // reportes, usuarios, sitios
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState('');

  // Simulación de base de datos local
  const [sitios, setSitios] = useState([{ id: 1, nombre: 'Planta Machala' }, { id: 2, nombre: 'Mina El Oro' }]);
  const [usuarios, setUsuarios] = useState([
    { id: 1, email: 'operario1@orojuez.com', rol: 'OPERATIVO', sitio: 'Planta Machala' }
  ]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (userEmail === 'industria.orojuez@gmail.com') {
      setRole('SUPER_ADMIN');
      setIsAuthenticated(true);
    } else {
      setRole('OPERATIVO');
      setIsAuthenticated(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-blue-900">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-900 text-white p-4 rounded-xl font-black text-2xl mb-2 shadow-lg">OJ</div>
            <h1 className="text-2xl font-black text-blue-900">ORO JUEZ S.A.</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Acceso Administrativo</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Correo" className="w-full border p-3 rounded-xl" onChange={(e) => setUserEmail(e.target.value)} required />
            <input type="password" placeholder="Contraseña" className="w-full border p-3 rounded-xl" required />
            <button className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl">INICIAR SESIÓN</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR DE ADMINISTRACIÓN */}
      {role === 'SUPER_ADMIN' && (
        <aside className="w-64 bg-slate-900 text-white flex flex-col p-6 hidden md:flex">
          <div className="mb-10 font-black text-xl">ORO JUEZ S.A.</div>
          <nav className="space-y-4 flex-1">
            <button onClick={() => setActiveTab('reportes')} className={`flex items-center gap-3 w-full p-3 rounded-lg ${activeTab === 'reportes' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
              <LayoutDashboard size={20}/> Reportes
            </button>
            <button onClick={() => setActiveTab('usuarios')} className={`flex items-center gap-3 w-full p-3 rounded-lg ${activeTab === 'usuarios' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
              <Users size={20}/> Usuarios
            </button>
            <button onClick={() => setActiveTab('sitios')} className={`flex items-center gap-3 w-full p-3 rounded-lg ${activeTab === 'sitios' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
              <MapIcon size={20}/> Sitios
            </button>
          </nav>
          <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-3 text-red-400 p-3 hover:bg-red-900/20 rounded-lg">
            <LogOut size={20}/> Salir
          </button>
        </aside>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'reportes' && (
          <div>
            <h2 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-tighter">Panel de Auditoría Global</h2>
            {/* Aquí va la tabla que ya teníamos */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 italic text-gray-400 text-center">
              Seleccione un rango de fecha para visualizar los registros con fotos.
            </div>
          </div>
        )}

        {activeTab === 'usuarios' && (
          <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Gestión de Usuarios</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                <Plus size={18}/> Nuevo Usuario
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="p-4">Email</th>
                    <th className="p-4">Rol</th>
                    <th className="p-4">Sitio Vinculado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usuarios.map(u => (
                    <tr key={u.id}>
                      <td className="p-4 font-bold">{u.email}</td>
                      <td className="p-4"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-black">{u.rol}</span></td>
                      <td className="p-4 font-medium text-gray-600 italic">{u.sitio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 bg-blue-50 text-blue-800 text-xs font-medium">
                * El usuario operativo solo verá las básculas de su sitio asignado durante el registro.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OroJuezApp;
