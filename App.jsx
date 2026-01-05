import React, { useState } from 'react';
import { Download, FileText, Camera, MapPin, Search, User, Database } from 'lucide-react';

// ESTRUCTURA DE ROLES DEFINIDA
const ROLES = {
  SUPER_ADMIN: 'industria.orojuez@gmail.com',
  AUDITOR: 'SOLO_LECTURA_GLOBAL',
  OPERATIVO: 'OPERARIO_SITIO'
};

const OroJuezApp = () => {
  // Estado para simular el usuario logueado
  const [currentUser, setCurrentUser] = useState({
    email: 'industria.orojuez@gmail.com',
    rol: 'SUPER_ADMIN',
    sitioAsignado: 'GLOBAL'
  });

  const [records, setRecords] = useState([
    {
      id: 1,
      fecha: new Date().toLocaleString(),
      usuario: 'Operario 01',
      sitio: 'Planta Machala',
      bascula: 'Cardinal B1',
      pesoManual: 12500,
      pesoOCR: 12495,
      diferencia: 5,
      fotoUrl: 'https://images.unsplash.com/photo-1590243677224-746765278783?auto=format&fit=crop&q=80&w=300', 
      coords: '-1.234, -78.567'
    }
  ]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      {/* HEADER CORPORATIVO */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-md border-b-4 border-blue-900 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-blue-900 text-white p-3 rounded-lg font-black text-xl">OJ</div>
          <div>
            <h1 className="text-2xl font-black text-blue-900 tracking-tighter">ORO JUEZ S.A.</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Sistema de Auditoría de Pesaje</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 bg-blue-50 p-3 rounded-lg border border-blue-100">
          <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
            <User size={16}/> {currentUser.email}
          </p>
          <p className="text-[10px] font-bold text-blue-500 uppercase">{currentUser.rol}</p>
        </div>
      </header>

      {/* PANEL DE FILTROS (Visible para Admin y Auditor) */}
      {(currentUser.rol === 'SUPER_ADMIN' || currentUser.rol === 'AUDITOR') && (
        <section className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Search size={16}/> FILTROS DE AUDITORÍA GLOBAL
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400">RANGO DE FECHAS</label>
              <input type="date" className="border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400">SITIO / PLANTA</label>
              <select className="border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option>Todos los Sitios</option>
                <option>Planta Machala</option>
                <option>Mina El Oro</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400">BÁSCULA</label>
              <select className="border rounded p-2 text-sm">
                <option>Todas las Básculas</option>
                <option>Cardinal Principal</option>
              </select>
            </div>
            <button className="bg-blue-900 text-white rounded font-bold text-sm hover:bg-blue-800 transition-colors mt-5">
              APLICAR FILTROS
            </button>
          </div>
        </section>
      )}

      {/* ACCIONES DE EXPORTACIÓN */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-600">Registros Recientes</h3>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700">
            <Download size={14}/> EXCEL
          </button>
          <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700">
            <FileText size={14}/> PDF
          </button>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-widest">
              <th className="p-4">Fecha / Usuario</th>
              <th className="p-4">Sitio / Báscula</th>
              <th className="p-4">Evidencia (Foto)</th>
              <th className="p-4 text-center">Peso Manual</th>
              <th className="p-4 text-center">Peso OCR</th>
              <th className="p-4 text-center">Dif.</th>
              <th className="p-4 text-center">Ubicación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map(record => (
              <tr key={record.id} className="text-sm hover:bg-blue-50 transition-colors">
                <td className="p-4">
                  <p className="font-bold text-gray-800">{record.fecha}</p>
                  <p className="text-xs text-blue-600 font-medium">{record.usuario}</p>
                </td>
                <td className="p-4">
                  <p className="font-bold text-gray-700">{record.sitio}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{record.bascula}</p>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <img src={record.fotoUrl} alt="Evidencia" className="w-24 h-16 object-cover rounded-md border-2 border-white shadow-sm" />
                    <a href={record.fotoUrl} target="_blank" className="text-[10px] text-blue-500 font-bold underline">VER ORIGINAL</a>
                  </div>
                </td>
                <td className="p-4 text-center font-black text-gray-700">{record.pesoManual} kg</td>
                <td className="p-4 text-center font-black text-blue-700">{record.pesoOCR} kg</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-black ${record.diferencia > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {record.diferencia} kg
                  </span>
                </td>
                <td className="p-4 text-center">
                  <a href={`https://maps.google.com/?q=${record.coords}`} target="_blank" className="inline-block p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-blue-900 hover:text-white transition-colors">
                    <MapPin size={18}/>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OroJuezApp;
