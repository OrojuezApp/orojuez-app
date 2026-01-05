import React, { useState } from 'react';
import { Download, FileText, Camera, MapPin, Search, User, Lock, LogOut, Plus } from 'lucide-react';

const OroJuezApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');

  // Simulación de Login con la lógica de roles solicitada
  const handleLogin = (e) => {
    e.preventDefault();
    if (userEmail === 'industria.orojuez@gmail.com' && password === 'admin123') {
      setRole('SUPER_ADMIN'); // Visión Global
      setIsAuthenticated(true);
    } else if (password === 'auditor') {
      setRole('AUDITOR'); // Visión Global Solo Lectura
      setIsAuthenticated(true);
    } else if (password === 'operario') {
      setRole('OPERATIVO'); // Visión Restringida a su sitio
      setIsAuthenticated(true);
    } else {
      alert("Credenciales incorrectas. Prueba con industria.orojuez@gmail.com / admin123");
    }
  };

  // --- PANTALLA DE LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-blue-900">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-900 text-white p-4 rounded-xl font-black text-2xl mb-2 shadow-lg">OJ</div>
            <h1 className="text-2xl font-black text-blue-900 tracking-tighter">ORO JUEZ S.A.</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest text-center">Gestión y Auditoría de Pesaje</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Correo Electrónico</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-300" size={18} />
                <input 
                  type="email" 
                  className="w-full border-2 border-gray-50 rounded-xl p-3 pl-10 focus:border-blue-900 outline-none transition-all text-sm" 
                  placeholder="usuario@orojuez.com"
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-300" size={18} />
                <input 
                  type="password" 
                  className="w-full border-2 border-gray-50 rounded-xl p-3 pl-10 focus:border-blue-900 outline-none transition-all text-sm" 
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition-all shadow-xl active:scale-95">
              INICIAR SESIÓN
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- PANTALLA PRINCIPAL ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* HEADER */}
      <header className="bg-white border-b-4 border-blue-900 px-6 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-900 text-white px-3 py-2 rounded-lg font-black text-xl">OJ</div>
          <div>
            <h2 className="text-xl font-black text-blue-900 leading-none">ORO JUEZ S.A.</h2>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Auditoría Digital</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          {role === 'OPERATIVO' && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 hover:bg-blue-700 animate-pulse">
              <Plus size={16}/> NUEVO PESAJE
            </button>
          )}
          <div className="text-right border-l pl-4 border-gray-100">
            <p className="text-xs font-black text-gray-800 leading-tight">{userEmail}</p>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{role}</p>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* PANEL DE FILTROS (Solo Admin/Auditor Global) */}
        {(role === 'SUPER_ADMIN' || role === 'AUDITOR') && (
          <section className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 mb-4 flex items-center gap-2 tracking-widest uppercase">
              <Search size={14}/> Filtros de Auditoría Global
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input type="date" className="bg-gray-50 border-none p-3 rounded-xl text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-blue-900" />
              <select className="bg-gray-50 border-none p-3 rounded-xl text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-blue-900">
                <option>Todos los Sitios</option>
                <option>Planta Machala</option>
              </select>
              <select className="bg-gray-50 border-none p-3 rounded-xl text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-blue-900">
                <option>Todos los Usuarios</option>
              </select>
              <button className="bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all">APLICAR FILTRO</button>
            </div>
          </section>
        )}

        {/* TABLA DE REGISTROS (Lo que ya tenías) */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-6 border-b flex justify-between items-center">
             <h4 className="font-black text-gray-800">Registros Recientes</h4>
             <div className="flex gap-2">
                <button className="bg-green-50 text-green-700 p-2 rounded-lg hover:bg-green-100"><Download size={18}/></button>
                <button className="bg-red-50 text-red-700 p-2 rounded-lg hover:bg-red-100"><FileText size={18}/></button>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                <tr>
                  <th className="p-4">Fecha/Usuario</th>
                  <th className="p-4">Sitio</th>
                  <th className="p-4">Foto Visor</th>
                  <th className="p-4 text-center">Manual</th>
                  <th className="p-4 text-center">OCR</th>
                  <th className="p-4 text-center">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr className="text-sm hover:bg-blue-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-gray-700">01/05/2026, 1:01 PM</p>
                    <p className="text-[10px] text-blue-500 font-bold uppercase">Operario 01</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-700">Planta Machala</p>
                    <p className="text-[10px] text-gray-400 font-bold">CARDINAL B1</p>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="w-20 h-12 bg-gray-200 rounded-md border-2 border-white shadow-sm flex items-center justify-center text-[8px] text-gray-400">FOTO</div>
                      <button className="text-[10px] text-blue-600 font-bold underline text-left">VER ORIGINAL</button>
                    </div>
                  </td>
                  <td className="p-4 text-center font-black">12500 kg</td>
                  <td className="p-4 text-center font-black text-blue-600">12495 kg</td>
                  <td className="p-4 text-center">
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-[10px] font-black">5 kg</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OroJuezApp;
