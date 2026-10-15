import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  User,
  Shield,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Sparkles,
  ClipboardList,
  Wrench,
  BarChart2,
  Layers,
} from 'lucide-react';
import { useCivic } from '../context/CivicContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { setCurrentRole, complaints, workOrders } = useCivic();

  const handleSelectRole = (role) => {
    setCurrentRole(role);
    if (role === 'citizen') {
      navigate('/citizen');
    } else {
      navigate('/officer');
    }
  };

  const pendingCount = complaints.filter((c) => c.status === 'PENDING').length;
  const inProgressCount = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F2742] via-[#163A63] to-slate-900 text-white flex flex-col justify-between">
      {/* Top Bar */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-civic-blue flex items-center justify-center shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center">
              Civic<span className="text-blue-400">Connect</span>
            </span>
            <p className="text-xs text-blue-200">Urban Issue Resolution Portal</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Municipal Operations & Citizen Service</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto w-full px-6 py-10 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4">
            Transforming Municipal Governance & Citizen Engagement
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            A synchronized two-tier platform bridging civic issue reporting and municipal operations.
            Citizens report public issues with live geolocation and evidence photos; municipal officers
            orchestrate duplicate detection, work orders, inventory, and repair verifications in real-time.
          </p>
        </div>

        {/* Live System Counter */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto w-full">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-2xl md:text-3xl font-extrabold text-white">{complaints.length}</p>
            <p className="text-xs text-blue-200 font-medium">Total Complaints</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-2xl md:text-3xl font-extrabold text-amber-400">{pendingCount}</p>
            <p className="text-xs text-amber-200 font-medium">Pending Review</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-2xl md:text-3xl font-extrabold text-blue-400">{inProgressCount}</p>
            <p className="text-xs text-blue-200 font-medium">Active Work Orders</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-2xl md:text-3xl font-extrabold text-emerald-400">{resolvedCount}</p>
            <p className="text-xs text-emerald-200 font-medium">Verified Resolved</p>
          </div>
        </div>

        {/* Dual Dashboard Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
          {/* Citizen Card */}
          <div
            onClick={() => handleSelectRole('citizen')}
            className="group relative bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 hover:border-blue-400/60 rounded-3xl p-8 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl flex flex-col justify-between hover:-translate-y-1"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <User className="w-8 h-8" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-2">
                Citizen Interface
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Customer Dashboard
              </h2>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Report local issues (potholes, streetlights, garbage, water leaks) with photos & location, track live progress, and provide feedback upon resolution.
              </p>

              <ul className="space-y-2 text-xs text-slate-300 mb-6">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Report civic issues with photo upload & GPS</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Track complaint status timeline & updates</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Submit 1–5 star feedback with remarks</span>
                </li>
              </ul>
            </div>

            <button className="w-full py-3 px-4 rounded-xl bg-civic-blue hover:bg-blue-600 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-lg">
              <span>Launch Citizen Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Officer Card */}
          <div
            onClick={() => handleSelectRole('officer')}
            className="group relative bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 hover:border-amber-400/60 rounded-3xl p-8 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl flex flex-col justify-between hover:-translate-y-1"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 mb-2">
                Municipal Staff & Engineering
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Municipal Officer Dashboard
              </h2>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Review complaints, detect duplicates, dispatch work orders, manage spare parts inventory, verify field repairs, and inspect ward analytics.
              </p>

              <ul className="space-y-2 text-xs text-slate-300 mb-6">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Complaint triage & AI duplicate matching</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Work orders, material dispatch & inventory</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Photo repair verification & audit history</span>
                </li>
              </ul>
            </div>

            <button className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-lg">
              <span>Launch Officer Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
        <p>© 2026 CivicConnect Platform. Citizen and Municipal Grievance Redressal.</p>
        <p className="mt-2 sm:mt-0">Built with React, Vite, and Tailwind CSS</p>
      </footer>
    </div>
  );
}
