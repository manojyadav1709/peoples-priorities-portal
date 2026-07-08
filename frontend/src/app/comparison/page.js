"use client";

import { useState, useEffect } from "react";
import { 
  GitCompare, 
  HelpCircle, 
  MapPin, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  Info,
  CheckCircle2
} from "lucide-react";
import { API_BASE } from "@/lib/config";

export default function ProposalComparison() {
  const [themes, setThemes] = useState([]);
  const [villages, setVillages] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [proposalAId, setProposalAId] = useState("");
  const [proposalBId, setProposalBId] = useState("");
  
  const [proposalAData, setProposalAData] = useState(null);
  const [proposalBData, setProposalBData] = useState(null);

  // Fetch initial lists
  useEffect(() => {
    async function fetchData() {
      try {
        const themesRes = await fetch(`${API_BASE}/api/themes`);
        const themesData = await themesRes.json();
        setThemes(themesData);

        const vilRes = await fetch(`${API_BASE}/api/villages`);
        const vilData = await vilRes.json();
        setVillages(vilData);

        // Fetch projects from each village details
        const projectsList = [];
        for (const vil of vilData) {
          const res = await fetch(`${API_BASE}/api/villages/${vil.id}`);
          const data = await res.json();
          projectsList.push(...data.existing_projects);
        }
        setProjects(projectsList);

      } catch (err) {
        console.error("Fetch error on comparison page", err);
      }
    }
    fetchData();
  }, []);

  // Sync proposal A details dynamically fetching hierarchy breadcrumbs
  useEffect(() => {
    if (!proposalAId) {
      setProposalAData(null);
      return;
    }
    
    async function syncProposalA() {
      const themeMatch = themes.find(t => t.id === proposalAId);
      if (themeMatch) {
        try {
          const res = await fetch(`${API_BASE}/api/villages/${themeMatch.village_id}`);
          const data = await res.json();
          
          setProposalAData({
            type: "theme",
            id: themeMatch.id,
            label: themeMatch.label,
            sector: themeMatch.sector,
            village_id: themeMatch.village_id,
            village_name: data.village.name.split(" (")[0],
            breadcrumbs: data.breadcrumbs,
            population: data.village.population || 0,
            submission_count: themeMatch.submission_count,
            score: themeMatch.score,
            road_quality: data.village.road_quality_index,
            hospital_dist: data.village.distance_to_nearest_hospital_km,
            school_ratio: data.village.school_enrollment_ratio,
            scheme_name: themeMatch.scheme_name
          });
        } catch (e) {
          console.error(e);
        }
      } else {
        const projMatch = projects.find(p => p.id === proposalAId);
        if (projMatch) {
          try {
            const res = await fetch(`${API_BASE}/api/villages/${projMatch.village_id}`);
            const data = await res.json();
            
            setProposalAData({
              type: "project",
              id: projMatch.id,
              label: projMatch.title,
              sector: projMatch.sector,
              village_id: projMatch.village_id,
              village_name: data.village.name.split(" (")[0],
              breadcrumbs: data.breadcrumbs,
              population: data.village.population || 0,
              submission_count: "N/A (Existing Project)",
              score: 4.5,
              road_quality: data.village.road_quality_index,
              hospital_dist: data.village.distance_to_nearest_hospital_km,
              school_ratio: data.village.school_enrollment_ratio,
              status: projMatch.status,
              budget: projMatch.budget,
              scheme_name: projMatch.scheme_name
            });
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
    syncProposalA();
  }, [proposalAId, themes, projects]);

  // Sync proposal B details dynamically fetching hierarchy breadcrumbs
  useEffect(() => {
    if (!proposalBId) {
      setProposalBData(null);
      return;
    }

    async function syncProposalB() {
      const themeMatch = themes.find(t => t.id === proposalBId);
      if (themeMatch) {
        try {
          const res = await fetch(`${API_BASE}/api/villages/${themeMatch.village_id}`);
          const data = await res.json();
          
          setProposalBData({
            type: "theme",
            id: themeMatch.id,
            label: themeMatch.label,
            sector: themeMatch.sector,
            village_id: themeMatch.village_id,
            village_name: data.village.name.split(" (")[0],
            breadcrumbs: data.breadcrumbs,
            population: data.village.population || 0,
            submission_count: themeMatch.submission_count,
            score: themeMatch.score,
            road_quality: data.village.road_quality_index,
            hospital_dist: data.village.distance_to_nearest_hospital_km,
            school_ratio: data.village.school_enrollment_ratio,
            scheme_name: themeMatch.scheme_name
          });
        } catch (e) {
          console.error(e);
        }
      } else {
        const projMatch = projects.find(p => p.id === proposalBId);
        if (projMatch) {
          try {
            const res = await fetch(`${API_BASE}/api/villages/${projMatch.village_id}`);
            const data = await res.json();
            
            setProposalBData({
              type: "project",
              id: projMatch.id,
              label: projMatch.title,
              sector: projMatch.sector,
              village_id: projMatch.village_id,
              village_name: data.village.name.split(" (")[0],
              breadcrumbs: data.breadcrumbs,
              population: data.village.population || 0,
              submission_count: "N/A (Existing Project)",
              score: 4.5,
              road_quality: data.village.road_quality_index,
              hospital_dist: data.village.distance_to_nearest_hospital_km,
              school_ratio: data.village.school_enrollment_ratio,
              status: projMatch.status,
              budget: projMatch.budget,
              scheme_name: projMatch.scheme_name
            });
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
    syncProposalB();
  }, [proposalBId, themes, projects]);

  const getWinner = () => {
    if (!proposalAData || !proposalBData) return null;
    if (proposalAData.score > proposalBData.score) return "A";
    if (proposalBData.score > proposalAData.score) return "B";
    return "tie";
  };

  const winner = getWinner();

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-navy/10 border border-brand-navy/20 rounded-lg text-brand-navy">
          <GitCompare className="h-5 w-5 text-brand-saffron" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-brand-navy tracking-tight uppercase">Proposal & Project Evidence Comparison</h2>
          <p className="text-sm text-text-muted">Compare two developmental priorities side-by-side using consolidated citizen evidence and ward gap indicators.</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Select Proposal A */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-t-4 border-brand-navy">
          <label className="text-brand-navy font-bold uppercase tracking-wider text-[10px]">Select Proposal / Project A</label>
          <select
            value={proposalAId}
            onChange={(e) => setProposalAId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-850 focus:outline-none focus:border-brand-saffron font-semibold text-xs"
          >
            <option value="">-- Select Priority Item --</option>
            <optgroup label="Citizen Driven Priorities (Themes)">
              {themes.map(t => (
                <option key={t.id} value={t.id}>[Theme] {t.label} (Score: {t.score})</option>
              ))}
            </optgroup>
            <optgroup label="Existing Development Plan Projects">
              {projects.map(p => (
                <option key={p.id} value={p.id}>[Project] {p.title} ({p.status.toUpperCase()})</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Select Proposal B */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-t-4 border-brand-navy">
          <label className="text-brand-navy font-bold uppercase tracking-wider text-[10px]">Select Proposal / Project B</label>
          <select
            value={proposalBId}
            onChange={(e) => setProposalBId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-850 focus:outline-none focus:border-brand-saffron font-semibold text-xs"
          >
            <option value="">-- Select Priority Item --</option>
            <optgroup label="Citizen Driven Priorities (Themes)">
              {themes.map(t => (
                <option key={t.id} value={t.id}>[Theme] {t.label} (Score: {t.score})</option>
              ))}
            </optgroup>
            <optgroup label="Existing Development Plan Projects">
              {projects.map(p => (
                <option key={p.id} value={p.id}>[Project] {p.title} ({p.status.toUpperCase()})</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Comparison Grid */}
      {proposalAData && proposalBData ? (
        <div className="space-y-6">
          
          {/* Winner Recommendation Banner */}
          {winner && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs sm:text-sm shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand-green shrink-0" />
                <p className="text-slate-800">
                  {winner === "tie" ? (
                    <span>Both proposals hold an equal priority index score. Review local constraints.</span>
                  ) : (
                    <span>
                      Evidence recommends prioritizing <strong>Proposal {winner === "A" ? "A" : "B"}</strong>: 
                      <span className="text-brand-green font-bold"> "{winner === "A" ? proposalAData.label : proposalBData.label}"</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Details Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            
            {/* CARD A */}
            <div className={`bg-white border rounded-xl p-5 space-y-4 relative shadow-sm ${winner === "A" ? "border-brand-saffron border-2" : "border-slate-200"}`}>
              {winner === "A" && (
                <span className="absolute top-3 right-3 bg-brand-saffron/15 text-brand-saffron border border-brand-saffron/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                  Recommended Priority
                </span>
              )}
              
              <div>
                {/* Hierarchy Breadcrumbs */}
                {proposalAData.breadcrumbs && (
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {proposalAData.breadcrumbs.district} District ➔ {proposalAData.breadcrumbs.block} ➔ {proposalAData.breadcrumbs.panchayat}
                  </span>
                )}
                <span className="text-[10px] font-bold text-text-muted uppercase">Proposal A ({proposalAData.type.toUpperCase()})</span>
                <h3 className="text-sm font-extrabold text-brand-navy mt-1 leading-snug">{proposalAData.label}</h3>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Sector Category</span>
                  <span className="font-bold text-slate-800 uppercase">{proposalAData.sector}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Government Scheme</span>
                  <span className="font-bold text-brand-navy">{proposalAData.scheme_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Target Village</span>
                  <span className="font-bold text-slate-800">{proposalAData.village_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Citizen Demand Volume</span>
                  <span className="font-bold text-slate-800">{proposalAData.submission_count}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Village Population</span>
                  <span className="font-bold text-slate-800">{proposalAData.population.toLocaleString()} citizens</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Priority Index Score</span>
                  <span className="font-extrabold text-brand-saffron text-sm">{proposalAData.score} / 10.0</span>
                </div>
              </div>

              {/* Village Gaps */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                <span className="font-bold block text-[10px] text-brand-navy uppercase tracking-wide">Village Infrastructure Dataset Gaps</span>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[8px] text-slate-400 block uppercase">Road index</span>
                    <span className="font-extrabold text-brand-navy">{proposalAData.road_quality}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[8px] text-slate-400 block uppercase">Hospital Dist</span>
                    <span className="font-extrabold text-brand-navy">{proposalAData.hospital_dist} km</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[8px] text-slate-400 block uppercase">School Ratio</span>
                    <span className="font-extrabold text-brand-navy">{proposalAData.school_ratio}%</span>
                  </div>
                </div>
              </div>

              {proposalAData.type === "project" && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wide">Project Scope</span>
                  <div className="flex justify-between items-center text-[10px] mt-1">
                    <span className="text-slate-500">Estimated Budget</span>
                    <span className="font-bold text-brand-navy">INR {proposalAData.budget.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* CARD B */}
            <div className={`bg-white border rounded-xl p-5 space-y-4 relative shadow-sm ${winner === "B" ? "border-brand-saffron border-2" : "border-slate-200"}`}>
              {winner === "B" && (
                <span className="absolute top-3 right-3 bg-brand-saffron/15 text-brand-saffron border border-brand-saffron/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                  Recommended Priority
                </span>
              )}
              
              <div>
                {/* Hierarchy Breadcrumbs */}
                {proposalBData.breadcrumbs && (
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {proposalBData.breadcrumbs.district} District ➔ {proposalBData.breadcrumbs.block} ➔ {proposalBData.breadcrumbs.panchayat}
                  </span>
                )}
                <span className="text-[10px] font-bold text-text-muted uppercase">Proposal B ({proposalBData.type.toUpperCase()})</span>
                <h3 className="text-sm font-extrabold text-brand-navy mt-1 leading-snug">{proposalBData.label}</h3>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Sector Category</span>
                  <span className="font-bold text-slate-800 uppercase">{proposalBData.sector}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Government Scheme</span>
                  <span className="font-bold text-brand-navy">{proposalBData.scheme_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Target Village</span>
                  <span className="font-bold text-slate-800">{proposalBData.village_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Citizen Demand Volume</span>
                  <span className="font-bold text-slate-800">{proposalBData.submission_count}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Village Population</span>
                  <span className="font-bold text-slate-800">{proposalBData.population.toLocaleString()} citizens</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Priority Index Score</span>
                  <span className="font-extrabold text-brand-saffron text-sm">{proposalBData.score} / 10.0</span>
                </div>
              </div>

              {/* Village Gaps */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                <span className="font-bold block text-[10px] text-brand-navy uppercase tracking-wide">Village Infrastructure Dataset Gaps</span>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[8px] text-slate-400 block uppercase">Road index</span>
                    <span className="font-extrabold text-brand-navy">{proposalBData.road_quality}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[8px] text-slate-400 block uppercase">Hospital Dist</span>
                    <span className="font-extrabold text-brand-navy">{proposalBData.hospital_dist} km</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[8px] text-slate-400 block uppercase">School Ratio</span>
                    <span className="font-extrabold text-brand-navy">{proposalBData.school_ratio}%</span>
                  </div>
                </div>
              </div>

              {proposalBData.type === "project" && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wide">Project Scope</span>
                  <div className="flex justify-between items-center text-[10px] mt-1">
                    <span className="text-slate-500">Estimated Budget</span>
                    <span className="font-bold text-brand-navy">INR {proposalBData.budget.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center space-y-3 shadow-sm border-t-4 border-brand-navy">
          <GitCompare className="h-12 w-12 text-slate-300 mx-auto" />
          <p className="font-bold text-brand-navy text-sm">Select Proposal A and Proposal B above to compare</p>
          <p className="text-xs text-text-muted max-w-sm mx-auto">Compare citizen feedback themes against other themes, or overlay them with existing budgeted plans to verify priorities.</p>
        </div>
      )}

    </div>
  );
}
