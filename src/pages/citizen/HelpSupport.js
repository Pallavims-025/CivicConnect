import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  PhoneCall,
  Mail,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export function HelpSupport() {
  const [openFaq, setOpenFaq] = useState(0);
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  const faqs = [
    {
      q: 'How do I report a new civic issue?',
      a: 'Click "Report an Issue" in the sidebar, fill in a clear title and description, select the appropriate category, verify your GPS location or landmark address, and upload at least one photo showing the hazard.',
    },
    {
      q: 'What do the different complaint statuses mean?',
      a: 'PENDING: Newly filed, awaiting municipal triage. UNDER REVIEW: Assigned to a department engineering wing. IN PROGRESS: Work order issued and field repair crew deployed. RESOLVED: Repair completed and verified by municipal officer. REJECTED: Not within municipal jurisdiction or duplicate with reason provided.',
    },
    {
      q: 'How long does a pothole or streetlight repair typically take?',
      a: 'Target municipal turnaround times: Emergency water pipe bursts (24-48 hours), Potholes on major roads (3-5 days), Streetlights (48 hours), Garbage clearance (24 hours).',
    },
    {
      q: 'How do I rate a completed repair?',
      a: 'Once an issue transitions to "RESOLVED", navigate to "My Feedback" or open the complaint details to submit a 1 to 5 star rating with your comments.',
    },
    {
      q: 'What if another citizen already reported the same pothole?',
      a: 'CivicConnect features an automated geospatial duplicate detection engine. If a duplicate is identified, officers link the reports so you continue receiving status updates without wasting public repair resources.',
    },
  ];

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!supportName || !supportEmail || !supportMsg) {
      alert('Please fill out all contact fields.');
      return;
    }
    setSupportSent(true);
    setSupportName('');
    setSupportEmail('');
    setSupportMsg('');
    setTimeout(() => setSupportSent(false), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-civic-text">
          Help & Support Center
        </h2>
        <p className="text-xs text-civic-muted">
          Guides, workflow explanations, frequently asked questions, and municipal citizen assistance.
        </p>
      </div>

      {/* 3 Step Guide Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-civic-blue flex items-center justify-center font-bold text-xs mb-3">
            01
          </div>
          <h4 className="font-bold text-sm text-slate-800 mb-1">Report with Photo</h4>
          <p className="text-xs text-slate-500">
            Photograph the civic problem clearly. Add landmark references and allow GPS geolocation.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs mb-3">
            02
          </div>
          <h4 className="font-bold text-sm text-slate-800 mb-1">Track Field Work</h4>
          <p className="text-xs text-slate-500">
            Follow the live timeline as municipal officers approve work orders and dispatch field repair teams.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs mb-3">
            03
          </div>
          <h4 className="font-bold text-sm text-slate-800 mb-1">Verify & Rate</h4>
          <p className="text-xs text-slate-500">
            Review the completion evidence photo uploaded by the officer and rate the quality of work.
          </p>
        </div>
      </div>

      {/* Status Definitions Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <h3 className="font-bold text-sm text-slate-800 mb-3">Complaint Status Lifecycle Guide</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Meaning</th>
                <th className="py-2.5 px-3">Next Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-3 font-bold text-amber-600">PENDING</td>
                <td className="py-2.5 px-3 text-slate-600">Citizen submitted; awaiting initial officer triage.</td>
                <td className="py-2.5 px-3 text-slate-500">Officer inspection & prioritization.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-purple-600">UNDER REVIEW</td>
                <td className="py-2.5 px-3 text-slate-600">Department assigned and cost estimate in review.</td>
                <td className="py-2.5 px-3 text-slate-500">Issuing formal Work Order to field unit.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-blue-600">IN PROGRESS</td>
                <td className="py-2.5 px-3 text-slate-600">Field crew on site, materials dispatched from warehouse.</td>
                <td className="py-2.5 px-3 text-slate-500">Physical repair & post-repair photo submission.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-emerald-600">RESOLVED</td>
                <td className="py-2.5 px-3 text-slate-600">Officer verified completion evidence; issue closed.</td>
                <td className="py-2.5 px-3 text-slate-500">Citizen feedback submission.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-rose-600">REJECTED</td>
                <td className="py-2.5 px-3 text-slate-600">Out of municipal jurisdiction or duplicate submission.</td>
                <td className="py-2.5 px-3 text-slate-500">Explanation reason provided in timeline.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-civic-blue" />
          <span>Frequently Asked Questions</span>
        </h3>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-800 flex items-center justify-between hover:bg-slate-50"
              >
                <span>{faq.q}</span>
                {openFaq === i ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-4 py-3 bg-slate-50/60 text-xs text-slate-600 border-t border-slate-100 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Support Contact Form & Placeholders */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <h3 className="font-bold text-sm text-slate-800 mb-2 flex items-center space-x-2">
            <Mail className="w-4 h-4 text-civic-blue" />
            <span>Contact Municipal Helpdesk</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Have an enquiry or need manual escalation? Send a message to the civic grievance cell.
          </p>

          {supportSent && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs mb-4 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Message received! A helpline officer will contact you within 24 hours.</span>
            </div>
          )}

          <form onSubmit={handleSupportSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Name</label>
              <input
                type="text"
                value={supportName}
                onChange={(e) => setSupportName(e.target.value)}
                placeholder="Priya Sharma"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="priya.sharma@civicmail.in"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Message</label>
              <textarea
                rows={3}
                value={supportMsg}
                onChange={(e) => setSupportMsg(e.target.value)}
                placeholder="Describe your issue or grievance..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-civic-blue text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              Send Support Query
            </button>
          </form>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800 mb-2 flex items-center space-x-2">
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <span>Municipal Helpline Numbers</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Demonstration municipal contact directories for municipal emergencies.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="font-bold text-slate-800">BBMP Control Room (24x7 Toll Free)</p>
                <p className="text-civic-blue font-mono font-bold text-sm mt-0.5">1533 / 080-22660000</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="font-bold text-slate-800">Water Supply & Pipeline Burst Emergency</p>
                <p className="text-civic-blue font-mono font-bold text-sm mt-0.5">1916 / 080-22238888</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="font-bold text-slate-800">BESCOM Electricity & Dark Zones Helpline</p>
                <p className="text-civic-blue font-mono font-bold text-sm mt-0.5">1912</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Emergency helplines operate 24 hours daily. For non-urgent issues, reporting via CivicConnect app enables full digital tracking.
          </div>
        </div>
      </div>
    </div>
  );
}
