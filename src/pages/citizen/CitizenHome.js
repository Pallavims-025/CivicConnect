import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  MapPin,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { StatusBadge } from '../../components/common/StatusBadge';

export function CitizenHome() {
  const navigate = useNavigate();
  const { complaints, citizenProfile } = useCivic();

  // Filter complaints for this citizen
  const myComplaints = complaints.filter(
    (c) => c.citizenId === citizenProfile.id || c.citizenName === citizenProfile.name
  );

  const totalCount = myComplaints.length;
  const pendingCount = myComplaints.filter(
    (c) => c.status === 'PENDING' || c.status === 'UNDER_REVIEW'
  ).length;
  const inProgressCount = myComplaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = myComplaints.filter((c) => c.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#163A63] to-civic-blue text-white rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">
            Citizen Dashboard
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-1">
            Welcome back, {citizenProfile.name}!
          </h2>
          <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-xl">
            Empowering citizens to report public issues and build cleaner, safer urban neighborhoods.
            Track your reports or lodge a new issue below.
          </p>
        </div>

        <button
          onClick={() => navigate('/citizen/report')}
          className="self-start md:self-center inline-flex items-center space-x-2 bg-white text-civic-navy hover:bg-blue-50 font-bold px-5 py-3 rounded-xl shadow-md transition-transform hover:scale-105 active:scale-95 text-xs md:text-sm"
        >
          <PlusCircle className="w-4 h-4 text-civic-blue" />
          <span>Report New Issue</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-civic-muted">Total Complaints</p>
            <p className="text-2xl md:text-3xl font-extrabold text-civic-text mt-1">
              {totalCount}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-civic-blue flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-civic-muted">Pending Review</p>
            <p className="text-2xl md:text-3xl font-extrabold text-amber-600 mt-1">
              {pendingCount}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-civic-muted">In Progress</p>
            <p className="text-2xl md:text-3xl font-extrabold text-civic-blue mt-1">
              {inProgressCount}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-civic-blue flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-civic-muted">Resolved</p>
            <p className="text-2xl md:text-3xl font-extrabold text-emerald-600 mt-1">
              {resolvedCount}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recent Complaints Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 md:px-6 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-civic-text">Recent Complaints</h3>
            <p className="text-xs text-civic-muted">Your latest civic issue submissions and current municipal status</p>
          </div>
          <button
            onClick={() => navigate('/citizen/complaints')}
            className="text-xs text-civic-blue font-semibold hover:underline flex items-center space-x-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {myComplaints.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-civic-blue flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-800">No complaints reported yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Have you noticed potholes, broken lights, or uncleared garbage in your neighborhood? Submit your first report now.
            </p>
            <button
              onClick={() => navigate('/citizen/report')}
              className="px-4 py-2 bg-civic-blue text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
            >
              Report an Issue
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 md:px-6">Complaint ID</th>
                  <th className="py-3 px-4">Issue Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Reported Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myComplaints.slice(0, 5).map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 md:px-6 font-mono font-bold text-civic-blue">
                      {complaint.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 max-w-xs truncate">
                      {complaint.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {complaint.category}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {complaint.reportedDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={complaint.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {complaint.lastUpdated}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/citizen/complaints/${complaint.id}`)}
                        className="px-3 py-1 bg-slate-100 hover:bg-civic-blue hover:text-white rounded-lg font-semibold text-slate-700 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Reporting Guidelines */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 text-xs text-blue-900">
        <h4 className="font-bold text-sm text-blue-950 mb-1 flex items-center space-x-1.5">
          <span>💡 Tips for Swift Resolution</span>
        </h4>
        <ul className="grid sm:grid-cols-3 gap-3 mt-3 text-slate-700">
          <li className="bg-white p-3 rounded-xl border border-blue-100">
            <span className="font-bold text-slate-900 block mb-0.5">1. Clear Photo Evidence</span>
            Capture a wide-angle shot showing surrounding landmarks alongside close-ups of the hazard.
          </li>
          <li className="bg-white p-3 rounded-xl border border-blue-100">
            <span className="font-bold text-slate-900 block mb-0.5">2. Accurate Location</span>
            Provide landmark references (e.g. Metro Pillar, Cross Road) to help inspection teams pinpoint the spot.
          </li>
          <li className="bg-white p-3 rounded-xl border border-blue-100">
            <span className="font-bold text-slate-900 block mb-0.5">3. Rate Once Resolved</span>
            Your ratings directly inform municipal contractor performance reviews and quality assurance.
          </li>
        </ul>
      </div>
    </div>
  );
}
