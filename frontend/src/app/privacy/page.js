"use client";

import { ShieldCheck, Lock, EyeOff, Scale, Info, CheckCircle2, FileText } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-navy/10 border border-brand-navy/20 rounded-lg text-brand-navy">
          <ShieldCheck className="h-5 w-5 text-brand-saffron" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-brand-navy tracking-tight uppercase">Data Privacy & Security Directive</h2>
          <p className="text-sm text-text-muted">Official policy document outlining citizen PII segregation and security standards under the DPDP Act, 2023.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        
        {/* Core Policy Document (Left Columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
          
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] text-brand-saffron font-extrabold uppercase tracking-wider block">Directive Statement (निर्देश विवरण)</span>
            <h3 className="text-base font-extrabold text-brand-navy mt-1">Compliance with Digital Personal Data Protection (DPDP) Act, 2023</h3>
            <p className="text-slate-550 leading-relaxed text-[11px] font-medium mt-2">
              The People's Priorities Portal is built to empower constituency planning while strictly safeguarding citizen privacy. Under the DPDP framework, citizen representations are segregated to ensure that no Personally Identifiable Information (PII) is exposed on public interfaces.
            </p>
          </div>

          {/* Policy Clauses */}
          <div className="space-y-5">
            
            {/* Clause 1 */}
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-brand-navy">
                <EyeOff className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-brand-navy uppercase text-[10px] tracking-wider">1. Automated PII Redaction & Masking (स्वचालित डेटा मास्किंग)</h4>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  All citizen representations received via Web Portal, Voice recording transcription, or physical scanned PDF letters undergo automated Natural Language Processing (NLP) scanning. Personal identifiers (names, mobile numbers, and Aadhaar patterns) are stripped from the public-facing roster and replaced with randomized tokens (e.g. <code>CITIZEN-REF-***</code>).
                </p>
              </div>
            </div>

            {/* Clause 2 */}
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-brand-navy">
                <Lock className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-brand-navy uppercase text-[10px] tracking-wider">2. Token-Gated Administrative Segregation (प्रशासनिक अलगाव)</h4>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  Unredacted citizen names and contact information are stored in an isolated, secure database table. Access to this raw data is strictly restricted to the Member of Parliament (MP) and authorized Secretariat officers. Requests are validated via secure, token-gated backends using the <code>X-Admin-Token</code> protocol.
                </p>
              </div>
            </div>

            {/* Clause 3 */}
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-brand-navy">
                <Scale className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-brand-navy uppercase text-[10px] tracking-wider">3. Purpose Limitation & Data Minimization (सीमित उपयोग सिद्धांत)</h4>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  Citizen feedback is gathered solely for the purpose of computing local development priorities (CDPI) and validating community infrastructure gaps. Data is not shared with any third-party commercial networks, and is processed only inside secure National Informatics Centre (NIC) data nodes.
                </p>
              </div>
            </div>

            {/* Clause 4 */}
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-brand-navy">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-brand-navy uppercase text-[10px] tracking-wider">4. Citizen Right to Correction (सुधार का अधिकार)</h4>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  Citizens retain the right to request changes, corrections, or deletion of their submitted suggestions. Grievance requests can be moderated or retracted by contacting the MP Secretariat office directly.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Security Standards Summary (Right Sidebar) */}
        <div className="space-y-4">
          
          {/* Security details card */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4 shadow-sm">
            <h4 className="font-extrabold text-brand-navy flex items-center gap-1.5 text-[10px] uppercase tracking-wider border-b border-slate-200 pb-2">
              <ShieldCheck className="h-4.5 w-4.5 text-brand-saffron shrink-0" />
              Portal Security Protocols
            </h4>
            
            <ul className="space-y-3 text-slate-600 text-[10.5px] font-medium leading-relaxed">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Encryption in Transit:</strong> All data transmissions are secured using TLS 1.3 protocol.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Segregated Databases:</strong> Public representations database is decoupled from secure PII archives.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Audit Logged Access:</strong> Every admin PII decryption is logged with strict IP-address tracking.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Consent-Based:</strong> Citizens explicitly approve representation ingestion prior to form submission.</span>
              </li>
            </ul>
          </div>

          {/* Help statement */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl text-[10px] text-slate-500 leading-relaxed space-y-1.5 shadow-sm">
            <div className="font-extrabold text-brand-navy flex items-center gap-1 uppercase tracking-wide">
              <Info className="h-3.5 w-3.5 text-brand-saffron shrink-0" /> Grievance redressal
            </div>
            <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
              If you believe your personal coordinates have been incorrectly parsed or require unmasking/deletion, write directly to <strong>privacy-officer@meity.gov.in</strong>.
            </p>
          </div>

        </div>

      </div>

      {/* 2. GIGW Directory & Disclaimers Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-xs text-brand-navy flex items-center gap-1.5 uppercase tracking-wide">
            <FileText className="h-4.5 w-4.5 text-brand-saffron shrink-0" />
            Nodal Officers Directory & Website Policies (नोडल अधिकारी और नीतियां)
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Contact coordinates of regional administrative heads and database moderation officers.</p>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left border-collapse font-medium text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-3">Officer Name</th>
                <th className="py-2.5 px-3">Designation</th>
                <th className="py-2.5 px-3">Jurisdiction LGD Node</th>
                <th className="py-2.5 px-3">Office Email</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/40">
                <td className="py-3 px-3 font-extrabold text-brand-navy">Dr. Devendra Pratap Singh</td>
                <td className="py-3 px-3">Hon'ble Member of Parliament</td>
                <td className="py-3 px-3 font-bold">Indore/Bhopal Seat</td>
                <td className="py-3 px-3 font-mono text-[10px]">mp-indore@sansad.nic.in</td>
                <td className="py-3 px-3"><span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">Active</span></td>
              </tr>
              <tr className="hover:bg-slate-50/40">
                <td className="py-3 px-3 font-extrabold text-brand-navy">Shri. Rajesh Sharma, IAS</td>
                <td className="py-3 px-3">District Collector & COO</td>
                <td className="py-3 px-3 font-bold">Bhopal (LGD: 23.25)</td>
                <td className="py-3 px-3 font-mono text-[10px]">collector-bpl@mp.gov.in</td>
                <td className="py-3 px-3"><span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">Active</span></td>
              </tr>
              <tr className="hover:bg-slate-50/40">
                <td className="py-3 px-3 font-extrabold text-brand-navy">Shri. Amit Kumar</td>
                <td className="py-3 px-3">NIC Director (IT Support)</td>
                <td className="py-3 px-3 font-bold">MeitY System Hub</td>
                <td className="py-3 px-3 font-mono text-[10px]">amit.kumar@nic.in</td>
                <td className="py-3 px-3"><span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">Active</span></td>
              </tr>
              <tr className="hover:bg-slate-50/40">
                <td className="py-3 px-3 font-extrabold text-brand-navy">Smt. Priya Patel</td>
                <td className="py-3 px-3">Data Privacy Officer</td>
                <td className="py-3 px-3 font-bold">Constituency Secretariat</td>
                <td className="py-3 px-3 font-mono text-[10px]">privacy-officer@meity.gov.in</td>
                <td className="py-3 px-3"><span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">Active</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* GIGW Disclaimer Statement */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[10px] leading-relaxed text-slate-500">
          <p className="font-semibold">
            🚫 <strong className="text-slate-700">Disclaimer Notice under GIGW:</strong> The content on this planning portal constitutes simulated representations and is solely meant for evaluating budget requirements and validating development priority rankings. Standard copyright policy dictates that reproduction of aggregate datasets requires official approval from the Member of Parliament (MP) Secretariat.
          </p>
        </div>
      </div>

    </div>
  );
}
