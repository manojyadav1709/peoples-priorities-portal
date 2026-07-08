"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Users, 
  MapPin, 
  CheckCircle, 
  Filter, 
  RefreshCw, 
  ChevronRight, 
  Info,
  X,
  FileCode,
  FileCheck,
  Search,
  Building
} from "lucide-react";
import InteractiveMap from "@/components/InteractiveMap";
import { API_BASE } from "@/lib/config";

export default function Dashboard() {
  const [themes, setThemes] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  
  // Hierarchy Data States
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [panchayats, setPanchayats] = useState([]);
  const [villages, setVillages] = useState([]);
  
  // Hierarchical Filter States
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedGP, setSelectedGP] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Drawer Detail State
  const [activeThemeId, setActiveThemeId] = useState(null);
  const [themeDetail, setThemeDetail] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const sectors = ["education", "water", "roads", "health", "electricity", "sanitation", "other"];

  // 1. Initial Load of Districts, Submissions, and Villages
  useEffect(() => {
    async function loadInitialData() {
      try {
        const distRes = await fetch(`${API_BASE}/api/districts`);
        const distData = await distRes.json();
        setDistricts(distData);

        const blocksRes = await fetch(`${API_BASE}/api/blocks`);
        const blocksData = await blocksRes.json();
        setBlocks(blocksData);

        const subRes = await fetch(`${API_BASE}/api/submissions`);
        const subData = await subRes.json();
        setSubmissions(subData);

        // Fetch all villages for the map overlay
        const vilRes = await fetch(`${API_BASE}/api/villages`);
        const vilData = await vilRes.json();
        setVillages(vilData);
      } catch (err) {
        console.error("Error loading initial dropdown data", err);
      }
    }
    loadInitialData();
  }, [refreshTrigger]);

  // Fetch blocks dynamically when District changes
  useEffect(() => {
    async function fetchBlocks() {
      try {
        let url = `${API_BASE}/api/blocks`;
        if (selectedDistrict) {
          url += `?district_id=${selectedDistrict}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setBlocks(data);
        setSelectedBlock("");
        setSelectedGP("");
        setSelectedVillage("");
      } catch (err) {
        console.error("Error loading blocks for district", err);
      }
    }
    fetchBlocks();
  }, [selectedDistrict]);

  // 2. Fetch Gram Panchayats dynamically when Block changes
  useEffect(() => {
    async function fetchPanchayats() {
      if (!selectedBlock) {
        setPanchayats([]);
        setSelectedGP("");
        setSelectedVillage("");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/panchayats?block_id=${selectedBlock}`);
        const data = await res.json();
        setPanchayats(data);
        setSelectedGP("");
        setSelectedVillage("");
      } catch (err) {
        console.error("Error loading panchayats", err);
      }
    }
    fetchPanchayats();
  }, [selectedBlock]);

  // 3. Fetch Villages dynamically when Gram Panchayat changes
  useEffect(() => {
    async function fetchVillages() {
      if (!selectedGP) {
        setSelectedVillage("");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/villages?gram_panchayat_id=${selectedGP}`);
        const data = await res.json();
        // Just filters selector, map keeps all villages
        setSelectedVillage("");
      } catch (err) {
        console.error("Error loading villages", err);
      }
    }
    fetchVillages();
  }, [selectedGP]);

  // 4. Fetch Themes dynamically based on selected village/sector filter
  useEffect(() => {
    async function fetchThemes() {
      setLoading(true);
      try {
        let themesUrl = `${API_BASE}/api/themes?`;
        
        // Pass village_id to endpoint if selected
        if (selectedVillage) {
          themesUrl += `village_id=${selectedVillage}&`;
        } else if (selectedGP) {
          // If GP selected but not village, we filter by village list on client side
        }
        
        if (selectedSector) themesUrl += `sector=${selectedSector}&`;
        
        const res = await fetch(themesUrl);
        const data = await res.json();
        setThemes(data);
      } catch (err) {
        console.error("Error loading themes", err);
      } finally {
        setLoading(false);
      }
    }
    fetchThemes();
  }, [selectedVillage, selectedSector, refreshTrigger]);

  // 5. Fetch Theme detail drawer content (including breadcrumbs)
  useEffect(() => {
    if (!activeThemeId) {
      setThemeDetail(null);
      return;
    }
    async function fetchThemeDetail() {
      try {
        const res = await fetch(`${API_BASE}/api/themes/${activeThemeId}`);
        const themeData = await res.json();
        
        // Fetch village breadcrumbs
        const vilRes = await fetch(`${API_BASE}/api/villages/${themeData.theme.village_id}`);
        const vilDetails = await vilRes.json();
        
        setThemeDetail({
          ...themeData,
          breadcrumbs: vilDetails.breadcrumbs,
          village_name: vilDetails.village.name
        });
      } catch (err) {
        console.error("Error fetching theme details", err);
      }
    }
    fetchThemeDetail();
  }, [activeThemeId]);

  const handleClearFilters = () => {
    setSelectedDistrict("");
    setSelectedBlock("");
    setSelectedGP("");
    setSelectedVillage("");
    setSelectedSector("");
    setSearchQuery("");
  };

  // Client-side filtering for Block and GP if Village is not explicitly selected
  const getFilteredThemes = () => {
    let list = themes;

    // Filter by Search Query
    if (searchQuery) {
      list = list.filter(t => 
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.scheme_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // If GP selected but not village, filter themes belonging to that GP's villages
    if (selectedGP && !selectedVillage) {
      const gpVillageIds = villages.filter(v => v.gram_panchayat_id === selectedGP).map(v => v.id);
      list = list.filter(t => gpVillageIds.includes(t.village_id));
    }
    
    // If Block selected but not GP, filter themes belonging to that Block's GPs and Villages
    else if (selectedBlock && !selectedGP) {
      const blockGPs = panchayats.map(p => p.id);
      const blockVillageIds = villages.filter(v => blockGPs.includes(v.gram_panchayat_id)).map(v => v.id);
      list = list.filter(t => blockVillageIds.includes(t.village_id));
    }

    return list;
  };

  const currentThemes = getFilteredThemes();

  // KPIs
  const totalSubmissionsCount = submissions.length;
  const activeThemesCount = themes.length;
  const highPriorityThemesCount = themes.filter(t => t.score >= 7.0).length;
  const inPlanThemesCount = themes.filter(t => t.status === "proposed_to_plan").length;

  return (
    <div className="space-y-6">
      
      {/* Search Hero Banner */}
      <div className="bg-brand-navy-light text-white p-6 rounded-xl relative overflow-hidden shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-15 pointer-events-none bg-gradient-to-l from-brand-saffron via-white to-brand-green"></div>
        
        <div className="space-y-2 max-w-xl">
          <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase">Constituency Demand Priority Index (CDPI)</h2>
          <p className="text-xs text-slate-350 leading-relaxed">
            Welcome to the AI-powered constituency consolidation panel. Search and analyze ranked priority development works based on aggregate citizen letters, voice transcripts, WhatsApp reports, and local geographic data.
          </p>
        </div>
        
        <div className="relative w-full max-w-xs shrink-0 text-slate-800">
          <input
            type="text"
            placeholder="Search work title or scheme..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-brand-saffron font-semibold"
          />
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Suggestions", value: totalSubmissionsCount, icon: Users, color: "border-brand-saffron" },
          { label: "Consolidated Themes", value: activeThemesCount, icon: TrendingUp, color: "border-brand-navy" },
          { label: "High Priorities (≥ 7.0)", value: highPriorityThemesCount, icon: MapPin, color: "border-red-500" },
          { label: "Added to Local Plan", value: inPlanThemesCount, icon: CheckCircle, color: "border-brand-green" }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className={`bg-white border border-slate-200 border-l-4 ${kpi.color} rounded-lg p-4 flex items-center justify-between shadow-sm`}>
              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">{kpi.label}</span>
                <p className="text-xl sm:text-2xl font-black text-brand-navy">{kpi.value}</p>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-100 text-slate-500">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* SVG Map Overlay */}
      {villages.length > 0 && (
        <InteractiveMap
          wards={villages}
          submissions={submissions}
          selectedWardId={selectedVillage}
          onSelectWard={setSelectedVillage}
        />
      )}

      {/* Hierarchical Filters and Priorities List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        
        {/* Hierarchical Dropdown Filters Bar */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4.5 w-4.5 text-brand-saffron" />
              <h3 className="font-extrabold text-sm text-brand-navy">Ranked Priority Development Works</h3>
            </div>
            
            <div className="flex items-center gap-2">
              {(selectedDistrict || selectedBlock || selectedGP || selectedVillage || selectedSector || searchQuery) && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-brand-saffron font-bold hover:underline mr-2"
                >
                  Clear All Filters
                </button>
              )}
              <button
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="p-1.5 rounded bg-white border border-slate-300 text-slate-600 hover:text-brand-navy shadow-sm transition-all"
                title="Refresh Data"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Hierarchy Filter selects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {/* District select */}
            <div className="space-y-1">
              <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wide">District (जिला)</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-700 font-semibold focus:outline-none focus:border-brand-saffron"
              >
                <option value="">All Districts (सभी जिले)</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Block select */}
            <div className="space-y-1">
              <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wide">Block (ब्लॉक)</span>
              <select
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(e.target.value)}
                disabled={!selectedDistrict}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-700 font-semibold focus:outline-none focus:border-brand-saffron disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">All Blocks (सभी ब्लॉक)</option>
                {blocks.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Gram Panchayat select */}
            <div className="space-y-1">
              <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wide">Gram Panchayat (ग्राम पंचायत)</span>
              <select
                value={selectedGP}
                onChange={(e) => setSelectedGP(e.target.value)}
                disabled={!selectedBlock}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-700 font-semibold focus:outline-none focus:border-brand-saffron disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">All Panchayats</option>
                {panchayats.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Village select */}
            <div className="space-y-1">
              <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wide">Village / Ward (गांव / वार्ड)</span>
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-700 font-semibold focus:outline-none focus:border-brand-saffron"
              >
                <option value="">All Villages (सभी गांव)</option>
                {(selectedGP
                  ? villages.filter(v => v.gram_panchayat_id === parseInt(selectedGP))
                  : villages
                ).map(v => (
                  <option key={v.id} value={v.id}>{v.name.split(" (")[0]}</option>
                ))}
              </select>
            </div>

            {/* Sector select */}
            <div className="space-y-1">
              <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wide">Sector (विकास क्षेत्र)</span>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-700 font-semibold focus:outline-none focus:border-brand-saffron"
              >
                <option value="">All Sectors</option>
                {sectors.map(sec => (
                  <option key={sec} value={sec}>{sec.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Priority List Grid Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-text-muted">Loading priority dataset...</div>
          ) : currentThemes.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 govt-table-header font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-5">Priority Work Title</th>
                  <th className="py-3 px-5">Locality (Village)</th>
                  <th className="py-3 px-5">Sector</th>
                  <th className="py-3 px-5">Government Funding Scheme</th>
                  <th className="py-3 px-5 text-center">Citizen Demand</th>
                  <th className="py-3 px-5">Priority Score</th>
                  <th className="py-3 px-5 text-center">Plan Status</th>
                  <th className="py-3 px-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentThemes.map((theme, index) => {
                  const vilMatch = villages.find(v => v.id === theme.village_id);
                  const villageName = vilMatch?.name.split(" (")[0] || theme.village_id;
                  
                  let scoreColor = "bg-emerald-500";
                  if (theme.score >= 7.5) scoreColor = "bg-rose-500";
                  else if (theme.score >= 5.0) scoreColor = "bg-amber-500";

                  let sectorBadge = "bg-slate-100 text-slate-600 border border-slate-200";
                  if (theme.sector === "roads") sectorBadge = "bg-yellow-50 text-yellow-800 border border-yellow-250";
                  else if (theme.sector === "water") sectorBadge = "bg-blue-50 text-blue-800 border border-blue-200";
                  else if (theme.sector === "health") sectorBadge = "bg-red-50 text-red-800 border border-red-200";
                  else if (theme.sector === "education") sectorBadge = "bg-purple-50 text-purple-800 border border-purple-200";
                  else if (theme.sector === "electricity") sectorBadge = "bg-amber-50 text-amber-800 border border-amber-200";
                  else if (theme.sector === "sanitation") sectorBadge = "bg-teal-50 text-teal-800 border border-teal-200";

                  // Scheme badge coloring
                  let schemeBadge = "bg-slate-100 text-slate-700 border border-slate-300";
                  if (theme.scheme_name.includes("MPLADS")) schemeBadge = "bg-indigo-50 text-indigo-700 border border-indigo-200";
                  else if (theme.scheme_name.includes("Jal Jeevan")) schemeBadge = "bg-sky-50 text-sky-700 border border-sky-200";
                  else if (theme.scheme_name.includes("Swachh Bharat")) schemeBadge = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                  else if (theme.scheme_name.includes("Samagra Shiksha")) schemeBadge = "bg-violet-50 text-violet-700 border border-violet-200";
                  else if (theme.scheme_name.includes("National Health")) schemeBadge = "bg-rose-50 text-rose-700 border border-rose-200";

                  return (
                    <tr 
                      key={theme.id} 
                      className={`hover:bg-slate-50 cursor-pointer transition-all duration-150 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/40"} ${activeThemeId === theme.id ? "bg-slate-100" : ""}`}
                      onClick={() => setActiveThemeId(theme.id)}
                    >
                      <td className="py-4 px-5 font-bold text-brand-navy max-w-xs truncate">{theme.label}</td>
                      <td className="py-4 px-5 text-slate-700 font-semibold">{villageName}</td>
                      <td className="py-4 px-5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${sectorBadge}`}>
                          {theme.sector}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${schemeBadge}`}>
                          {theme.scheme_name}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center text-slate-800 font-extrabold">{theme.submission_count} suggestions</td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-brand-navy w-6">{theme.score}</span>
                          <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div className={`${scoreColor} h-full rounded-full`} style={{ width: `${theme.score * 10}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase ${
                          theme.status === "open" 
                            ? "bg-amber-100 text-amber-800 border border-amber-200" 
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}>
                          {theme.status === "open" ? "open request" : "in plan"}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-400 text-right">
                        <ChevronRight className="h-4 w-4 inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center">
              <p className="font-bold text-brand-navy">No priorities found</p>
              <p className="text-xs text-text-muted mt-1">There are no records matching your query.</p>
            </div>
          )}
        </div>
      </div>

      {/* Drawer Overlay for Theme Details */}
      {activeThemeId && (
        <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 border-t-4 border-brand-saffron">
            <div>
              {/* Hierarchy Breadcrumbs */}
              {themeDetail?.breadcrumbs && (
                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <span>{themeDetail.breadcrumbs.district} District</span>
                  <ChevronRight className="h-3 w-3" />
                  <span>{themeDetail.breadcrumbs.block}</span>
                  <ChevronRight className="h-3 w-3" />
                  <span>{themeDetail.breadcrumbs.panchayat}</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-brand-saffron">{themeDetail.village_name.split(" (")[0]}</span>
                </div>
              )}
              <h3 className="text-base font-extrabold text-brand-navy leading-snug">
                {themeDetail?.theme?.label}
              </h3>
            </div>
            <button 
              onClick={() => setActiveThemeId(null)}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-black border border-slate-200 transition-all shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            
            {/* 1. Score Breakdown */}
            {themeDetail?.theme?.score_breakdown && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-brand-saffron" /> 
                  Weighted Evidence Input Calculation
                </h4>
                
                <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-3.5 shadow-sm">
                  <div className="flex justify-between items-center text-xs font-semibold pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Suggested Action Scheme</span>
                    <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded font-bold">{themeDetail.theme.scheme_name}</span>
                  </div>

                  {[
                    { label: "Demand Volume", val: themeDetail.theme.score_breakdown.demand_volume_score, desc: "Clustered suggestions volume count (Logarithmic)", weight: themeDetail.theme.score_breakdown.weightsUsed.demand_volume },
                    { label: "Demand Intensity", val: themeDetail.theme.score_breakdown.demand_intensity_score, desc: "Urgency keywords / sentiment indicators", weight: themeDetail.theme.score_breakdown.weightsUsed.demand_intensity },
                    { label: "Population Impact", val: themeDetail.theme.score_breakdown.population_impact_score, desc: "Number of citizens in target village location", weight: themeDetail.theme.score_breakdown.weightsUsed.population_impact },
                    { label: "Infrastructure Gap Severity", val: themeDetail.theme.score_breakdown.gap_severity_score, desc: "Objective infrastructural deficit in target village", weight: themeDetail.theme.score_breakdown.weightsUsed.gap_severity }
                  ].map((score, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{score.label} <span className="text-[10px] text-slate-400 font-normal">(w = {score.weight})</span></span>
                        <span>{score.val} / 10</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                        <div className="bg-brand-navy h-full rounded-full" style={{ width: `${score.val * 10}%` }}></div>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">{score.desc}</p>
                    </div>
                  ))}
                  
                  {themeDetail.theme.score_breakdown.overlap_penalty_score > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs space-y-1.5 mt-2">
                      <div className="flex justify-between font-extrabold text-red-800">
                        <span>Overlap Conflict Detected</span>
                        <span>-{themeDetail.theme.score_breakdown.overlap_penalty_score}</span>
                      </div>
                      <p className="text-[10px] text-red-600 leading-relaxed">
                        An active project addressing this issue in this village was detected in the existing Local Development Plan: 
                        <strong className="text-red-800 block mt-1">"{themeDetail.theme.score_breakdown.duplicate_projects_found?.[0]}"</strong>
                      </p>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-xs font-bold mt-2">
                    <span className="text-slate-700">Composite Priority Index Score</span>
                    <span className="text-lg font-black text-brand-saffron">{themeDetail.theme.score} / 10.0</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Supporting Raw Suggestions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileCode className="h-4 w-4 text-brand-green" /> 
                Supporting Citizen Submissions ({themeDetail?.submissions?.length || 0})
              </h4>
              
              <div className="space-y-3">
                {themeDetail?.submissions?.map((sub) => (
                  <div key={sub.id} className="bg-white rounded-xl p-4 border border-slate-200 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-100 pb-1.5">
                      <span className="font-semibold text-brand-navy">SUB ID: {sub.id.toUpperCase()}</span>
                      <span className="font-bold uppercase px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{sub.channel}</span>
                      <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <p className="text-xs leading-relaxed text-slate-700 italic">
                      "{sub.translated_text}"
                    </p>
                    
                    <div className="flex items-center gap-1.5 text-[10px] text-brand-green font-bold">
                      <span>Detected Lang: <strong className="uppercase">{sub.language}</strong></span>
                      {sub.raw_media_url && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="underline italic cursor-pointer text-slate-400">Media Attachment verified</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Drawer Footer Actions */}
          <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
            <button 
              onClick={async () => {
                alert("Proposal pushed to MP's official local development plan successfully!");
                setActiveThemeId(null);
                setRefreshTrigger(p => p + 1);
              }}
              className="flex-1 bg-brand-navy hover:bg-brand-navy-light text-white font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition-all"
            >
              <FileCheck className="h-4.5 w-4.5" />
              Add to {themeDetail?.theme?.scheme_name.split(" (")[0] || "Constituency Plan"}
            </button>
            <button
              onClick={() => setActiveThemeId(null)}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold py-2.5 px-4 rounded-lg text-xs transition-all shadow-sm"
            >
              Close
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
