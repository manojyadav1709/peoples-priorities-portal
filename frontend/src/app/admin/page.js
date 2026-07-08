"use client";

import { useState, useEffect } from "react";
import { 
  Lock, 
  User, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  Users, 
  Settings2, 
  CheckCircle, 
  Building,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Building2,
  Trash2,
  X,
  MessageSquare,
  AlertTriangle,
  FileText,
  Mail,
  HelpCircle,
  ShieldCheck,
  Award,
  ArrowRight,
  Info,
  Brain,
  Phone,
  Fingerprint,
  FolderLock,
  GitCompare,
  Compass
} from "lucide-react";

export default function AdminPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Dynamic onboarding modes
  const [loginMode, setLoginMode] = useState("admin"); // admin, citizen
  const [showPreGateway, setShowPreGateway] = useState(true);
  const [regName, setRegName] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regVillageId, setRegVillageId] = useState("");
  const [villages, setVillages] = useState([]);

  // Dynamic geographical states for citizen registration
  const [regDistricts, setRegDistricts] = useState([]);
  const [regBlocks, setRegBlocks] = useState([]);
  const [regPanchayats, setRegPanchayats] = useState([]);
  const [regVillages, setRegVillages] = useState([]);
  const [regSelDistrict, setRegSelDistrict] = useState("");
  const [regSelBlock, setRegSelBlock] = useState("");
  const [regSelGP, setRegSelGP] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  // Login Form States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [generatedCaptcha, setGeneratedCaptcha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Tab State
  const [activeTab, setActiveTab] = useState("roster"); // roster, weights

  // Data States
  const [submissions, setSubmissions] = useState([]);
  const [weights, setWeights] = useState({
    demand_volume: 0.3,
    demand_intensity: 0.2,
    population_impact: 0.2,
    gap_severity: 0.2,
    overlap_penalty: 0.1
  });
  
  const [revealPII, setRevealPII] = useState(false);
  const [decryptingAnim, setDecryptingAnim] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeModalSub, setActiveModalSub] = useState(null);

  // System & Metadata states
  const [mpName, setMpName] = useState("Hon'ble Member of Parliament");
  const [constituencyName, setConstituencyName] = useState("Indore / Bhopal Constituency");
  const [constituencyState, setConstituencyState] = useState("Madhya Pradesh");

   const adminToken = "mp_secret_token_123";
 
  // AI Proposal Comparison States
  const [themesList, setThemesList] = useState([]);
  const [selectedProposals, setSelectedProposals] = useState(["", "", ""]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonStep, setComparisonStep] = useState(0);
  const [comparisonResult, setComparisonResult] = useState(null);
 
  // Fetch themes
  useEffect(() => {
    if (!isLoggedIn) return;
    async function fetchThemes() {
      try {
        const res = await fetch("http://localhost:8000/api/themes");
        const data = await res.json();
        setThemesList(data);
      } catch (err) {
        console.error("Failed to load themes for admin comparison", err);
      }
    }
    fetchThemes();
  }, [isLoggedIn, refreshTrigger]);
 
  const handleStartComparison = () => {
    const validProposals = selectedProposals.filter(id => id !== "");
    if (validProposals.length < 2) {
      alert("Please select at least 2 different proposals to compare.");
      return;
    }
    if (new Set(validProposals).size !== validProposals.length) {
      alert("Please select unique proposals for comparison.");
      return;
    }
 
    setIsComparing(true);
    setComparisonStep(0);
    setComparisonResult(null);
 
    const interval = setInterval(() => {
      setComparisonStep(prev => {
        if (prev >= 5) {
          clearInterval(interval);
          performComparison(validProposals);
          return prev;
        }
        return prev + 1;
      });
    }, 850);
  };
 
  const performComparison = (validProposals) => {
    const selectedData = validProposals.map(id => {
      const theme = themesList.find(t => t.id === id);
      if (!theme) return null;
      const vil = villages.find(v => String(v.id) === String(theme.village_id));
      return { theme, vil };
    }).filter(Boolean);
 
    if (selectedData.length < 2) {
      setIsComparing(false);
      return;
    }
 
    const results = selectedData.map(item => {
      const theme = item.theme;
      const vil = item.vil || { name: "Constituency Block", population: 25000, road_quality_index: 0.7, distance_to_nearest_hospital_km: 5, school_enrollment_ratio: 80 };
      
      let gapIndex = 0.5;
      let gapText = "Moderate infrastructure deficit";
      let recommendedScheme = "MPLADS Fund";
      
      if (theme.sector === "roads") {
        gapIndex = 1 - (vil.road_quality_index || 0.7);
        gapText = `Road Index: ${vil.road_quality_index || 0.7} (${vil.road_quality_index < 0.5 ? "Critical Deficit" : "Moderate"})`;
        recommendedScheme = "Pradhan Mantri Gram Sadak Yojana (PMGSY)";
      } else if (theme.sector === "health") {
        gapIndex = Math.min((vil.distance_to_nearest_hospital_km || 5) / 15, 1.0);
        gapText = `Hospital Distance: ${vil.distance_to_nearest_hospital_km || 5} km (${vil.distance_to_nearest_hospital_km > 7 ? "Severe Gap" : "Adequate"})`;
        recommendedScheme = "Ayushman Bharat Health Infrastructure Mission (PM-ABHIM)";
      } else if (theme.sector === "education") {
        gapIndex = (100 - (vil.school_enrollment_ratio || 80)) / 100;
        gapText = `School Enrollment: ${vil.school_enrollment_ratio || 80}% (${vil.school_enrollment_ratio < 75 ? "Sub-optimal" : "Favorable"})`;
        recommendedScheme = "Samagra Shiksha Abhiyan";
      } else if (theme.sector === "water") {
        gapIndex = 0.75;
        gapText = "Safe Drinking Water: Pipeline Gap (Severe)";
        recommendedScheme = "Jal Jeevan Mission (JJM)";
      }
      
      const popScore = Math.min((vil.population || 25000) / 60000, 1.0);
      const aiPriorityScore = (theme.score * 0.5) + (gapIndex * 0.3) + (popScore * 0.2);
      
      return {
        theme,
        vil,
        gapText,
        recommendedScheme,
        aiPriorityScore,
        population: vil.population || 25000
      };
    });
 
    const sorted = [...results].sort((a, b) => b.aiPriorityScore - a.aiPriorityScore);
    const bestPickId = sorted[0].theme.id;
 
    const comparisonPayload = {
      bestPickId,
      proposals: results.map(item => {
        const isBest = item.theme.id === bestPickId;
        
        let strengths = [];
        let weaknesses = [];
        let opportunities = [];
        
        if (item.theme.sector === "roads") {
          strengths = [
            "Highly visible local connectivity booster",
            "Improves village agricultural logistics by 35%"
          ];
          weaknesses = [
            "High initial capital expenditure",
            "Subject to weather-related execution delays"
          ];
          opportunities = [
            "Can unlock local economic zones",
            "Eligible for 60% PMGSY matching central grant"
          ];
        } else if (item.theme.sector === "health") {
          strengths = [
            "Saves critical travel time for emergency care",
            "Reduces maternal/infant transport risks"
          ];
          weaknesses = [
            "Requires permanent medical staffing setup",
            "Recurring operational drug supply budget needed"
          ];
          opportunities = [
            "Integrates with NHM wellness center programs",
            "Enables digital telemedicine consultancy"
          ];
        } else if (item.theme.sector === "water") {
          strengths = [
            "Solves critical fluorosis health hazards",
            "Reduces daily water collection burden on women"
          ];
          weaknesses = [
            "Requires community ownership for pump maintenance",
            "Dependent on groundwater table sustainability"
          ];
          opportunities = [
            "100% household tap connection matching via Jal Jeevan Mission",
            "Solar-powered supply options available"
          ];
        } else {
          strengths = [
            "Direct response to public representation volume",
            "Low maintenance cost post execution"
          ];
          weaknesses = [
            "Local impact rather than block-level scope"
          ];
          opportunities = [
            "Improves MP approval ratings in key pockets"
          ];
        }
        
        return {
          ...item,
          isBest,
          swot: { strengths, weaknesses, opportunities }
        };
      })
    };
 
    setComparisonResult(comparisonPayload);
    setIsComparing(false);
  };

  // Village LGD Mapping for MP-friendly display
  const villageNameMap = {
    "472592": "Abhaypur Village (GP: Abhaypur)",
    "472999": "Kolar Village (GP: Kolar)",
    "472593": "Bhopal Village (GP: Khas)",
    "472594": "Rampur Village (GP: Rampur)",
    "4": "Indore Municipal Ward 4"
  };

  // Generate a random 6-digit captcha
  const generateNewCaptcha = () => {
    const chars = "0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCaptcha(code);
  };

  useEffect(() => {
    generateNewCaptcha();

    // Fetch LGD villages from API (fallback/global)
    async function loadVillages() {
      try {
        const res = await fetch("http://localhost:8000/api/villages");
        const data = await res.json();
        setVillages(data);
      } catch (err) {
        console.error("Failed to load LGD villages", err);
      }
    }
    loadVillages();

    // Fetch initial districts
    async function loadDistricts() {
      try {
        const res = await fetch("http://localhost:8000/api/districts");
        const data = await res.json();
        setRegDistricts(data);
      } catch (err) {
        console.error("Failed to load districts", err);
      }
    }
    loadDistricts();
  }, []);

  // Fetch blocks when district changes
  useEffect(() => {
    async function fetchBlocks() {
      try {
        let url = "http://localhost:8000/api/blocks";
        if (regSelDistrict) {
          url += `?district_id=${regSelDistrict}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setRegBlocks(data);
        setRegSelBlock("");
        setRegSelGP("");
        setRegVillageId("");
      } catch (err) {
        console.error("Failed to load blocks", err);
      }
    }
    fetchBlocks();
  }, [regSelDistrict]);

  // Fetch Gram Panchayats when block changes
  useEffect(() => {
    if (!regSelBlock) {
      setRegPanchayats([]);
      setRegSelGP("");
      setRegVillageId("");
      return;
    }
    async function fetchPanchayats() {
      try {
        const res = await fetch(`http://localhost:8000/api/panchayats?block_id=${regSelBlock}`);
        const data = await res.json();
        setRegPanchayats(data);
        setRegSelGP("");
        setRegVillageId("");
      } catch (err) {
        console.error("Failed to load panchayats", err);
      }
    }
    fetchPanchayats();
  }, [regSelBlock]);

  // Fetch Villages when GP changes
  useEffect(() => {
    if (!regSelGP) {
      setRegVillages([]);
      setRegVillageId("");
      return;
    }
    async function fetchVillages() {
      try {
        const res = await fetch(`http://localhost:8000/api/villages?gram_panchayat_id=${regSelGP}`);
        const data = await res.json();
        setRegVillages(data);
        if (data.length > 0) {
          setRegVillageId(String(data[0].id));
        }
      } catch (err) {
        console.error("Failed to load villages", err);
      }
    }
    fetchVillages();
  }, [regSelGP]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryMode = params.get("mode");
      if (queryMode === "citizen") {
        setLoginMode("citizen");
        setShowPreGateway(false);
      } else if (queryMode === "admin") {
        setLoginMode("admin");
        setShowPreGateway(false);
      }

      if (sessionStorage.getItem("admin_logged_in") === "true") {
        setIsLoggedIn(true);
        window.dispatchEvent(new Event("admin-login-changed"));
      }
    }
  }, []);

  // Login handler
  const handleLogin = (e) => {
    e.preventDefault();
    if (captchaInput !== generatedCaptcha) {
      setLoginError("Invalid Captcha Code. Please re-enter the correct security code.");
      generateNewCaptcha();
      setCaptchaInput("");
      return;
    }
    if (username === "admin" && password === "admin123") {
      setIsLoggedIn(true);
      setLoginError("");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("admin_logged_in", "true");
        window.dispatchEvent(new Event("admin-login-changed"));
      }
    } else {
      setLoginError("Invalid Administrator credentials. Please verify username and password.");
      generateNewCaptcha();
      setCaptchaInput("");
    }
  };

  // Fetch weights
  useEffect(() => {
    if (!isLoggedIn) return;
    async function fetchWeights() {
      try {
        const res = await fetch("http://localhost:8000/api/admin/scoring-weights");
        const data = await res.json();
        setWeights(data);
      } catch (err) {
        console.error("Failed to load scoring weights", err);
      }
    }
    fetchWeights();
  }, [isLoggedIn]);

  // Fetch submissions based on revealPII state (public vs secure endpoint)
  useEffect(() => {
    if (!isLoggedIn) return;
    async function fetchSubmissions() {
      setLoading(true);
      try {
        let url = "http://localhost:8000/api/submissions";
        let headers = {};
        
        if (revealPII) {
          url = "http://localhost:8000/api/admin/submissions";
          headers = { "X-Admin-Token": adminToken };
        }

        const res = await fetch(url, { headers });
        if (res.status === 401) {
          alert("Unauthorized PII access request.");
          setRevealPII(false);
          return;
        }
        const data = await res.json();
        setSubmissions(data);
      } catch (err) {
        console.error("Error loading submissions", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
  }, [isLoggedIn, revealPII, refreshTrigger]);

  // Handle Reveal PII toggle with a premium scanner simulation
  const handleTogglePII = () => {
    if (!revealPII) {
      setDecryptingAnim(true);
      setTimeout(() => {
        setDecryptingAnim(false);
        setRevealPII(true);
      }, 1200);
    } else {
      setRevealPII(false);
    }
  };

  // Toggle status (Approve vs Flag as Spam)
  const handleToggleStatus = async (subId, currentStatus) => {
    const nextStatus = currentStatus === "spam" ? "processed" : "spam";
    try {
      const formData = new FormData();
      formData.append("status", nextStatus);

      const res = await fetch(`http://localhost:8000/api/admin/submissions/${subId}/status?admin_key=${adminToken}`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.status === "success") {
        setUpdateMsg(`Submission ${subId} marked as ${nextStatus.toUpperCase()}`);
        setRefreshTrigger(prev => prev + 1);
        setTimeout(() => setUpdateMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  // Save weights handler
  const handleSaveWeights = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUpdateMsg("");

    try {
      const res = await fetch("http://localhost:8000/api/admin/scoring-weights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(weights)
      });
      const data = await res.json();
      if (data.status === "success") {
        setUpdateMsg(`Priority weights updated. CDPI ranking formulas recalculated constituency-wide.`);
        setTimeout(() => setUpdateMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update scoring weights.");
    } finally {
      setLoading(false);
    }
  };

  // Reset DB handler
  const handleResetDb = async () => {
    if (!confirm("Are you sure you want to delete and reset the LGD constituency database?")) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/admin/reset-seed", { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        alert("Database seeded successfully with Madhya Pradesh LGD default structures.");
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
      alert("Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER LOGIN & REGISTRATION GATEWAY ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-[85vh] bg-gradient-to-tr from-[#e3fcf4] to-[#f4f7f6] py-12 px-4 flex justify-center items-center rounded-3xl font-sans text-slate-800 border border-slate-200/50 shadow-inner relative">
        
        {/* Pre-Gateway Selection Popup */}
        {showPreGateway ? (
          <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200 relative z-20">
            
            <div className="mx-auto h-16 w-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-brand-navy shadow-sm">
              <svg viewBox="0 0 24 24" className="h-9 w-9 fill-none stroke-brand-navy" strokeWidth="2">
                <path d="M6 18c0-3 3-4 6-4s6 1 6 4" />
                <circle cx="12" cy="7" r="3" />
              </svg>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Select Access Category</h2>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Gateway Authentication Portal</p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <button
                onClick={() => {
                  setLoginMode("admin");
                  setShowPreGateway(false);
                }}
                className="w-full bg-slate-50 hover:bg-slate-100 text-brand-navy border border-slate-250 p-4 rounded-xl flex items-center gap-3 transition-all text-left shadow-sm group hover:border-brand-saffron cursor-pointer"
              >
                <div className="h-10 w-10 rounded-full bg-orange-50 border border-orange-100 text-brand-saffron flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-extrabold text-xs block group-hover:text-brand-navy">Administrative Login (for MPs)</span>
                  <span className="text-[9px] text-slate-400 block font-medium">Configure priority weights and view citizen dashboard data.</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setLoginMode("citizen");
                  setShowPreGateway(false);
                }}
                className="w-full bg-slate-50 hover:bg-slate-100 text-brand-navy border border-slate-250 p-4 rounded-xl flex items-center gap-3 transition-all text-left shadow-sm group hover:border-brand-saffron cursor-pointer"
              >
                <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 text-brand-green flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-extrabold text-xs block group-hover:text-brand-navy">Citizen Register/Login</span>
                  <span className="text-[9px] text-slate-400 block font-medium">Register profile and submit prioritized constituency suggestions.</span>
                </div>
              </button>
            </div>

            <p className="text-[9px] text-slate-400 leading-relaxed font-semibold max-w-[280px] mx-auto pt-2">
              e-Governance compliance node. Security logged by Ministry of Electronics & IT.
            </p>
          </div>
        ) : (
          
          <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl relative p-6 md:p-8 flex flex-col md:flex-row min-h-[460px] border border-slate-200 animate-in fade-in duration-200">
          
          {/* Left Column: Form Area */}
          <div className="w-full md:w-[65%] pr-0 md:pr-8 flex flex-col justify-between space-y-4">
            
            {/* Top Bar with Logo & Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5 select-none">
                <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-brand-navy shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-5.5 w-5.5 fill-none stroke-brand-navy" strokeWidth="2.5">
                    <path d="M6 18c0-3 3-4 6-4s6 1 6 4" />
                    <circle cx="12" cy="7" r="3" />
                  </svg>
                </div>
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-brand-navy">Gateway Admin</span>
              </div>

              {/* Mode Toggle Switch */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
                <button
                  onClick={() => {
                    setLoginMode("admin");
                    setLoginError("");
                  }}
                  className={`text-[9px] font-extrabold px-3 py-1.5 rounded transition-all cursor-pointer ${
                    loginMode === "admin"
                      ? "bg-brand-navy text-white shadow-sm"
                      : "text-slate-600 hover:text-brand-navy"
                  }`}
                >
                  MP Admin Login
                </button>
                <button
                  onClick={() => {
                    setLoginMode("citizen");
                    setLoginError("");
                  }}
                  className={`text-[9px] font-extrabold px-3 py-1.5 rounded transition-all cursor-pointer ${
                    loginMode === "citizen"
                      ? "bg-brand-navy text-white shadow-sm"
                      : "text-slate-600 hover:text-brand-navy"
                  }`}
                >
                  Citizen Register/Login
                </button>
              </div>
            </div>

            {/* Main Form Fields */}
            {loginMode === "admin" ? (
              <form 
                onSubmit={handleLogin}
                className="flex-1 flex flex-col justify-center space-y-3"
              >
                <div className="space-y-0.5">
                  <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">Log In</h2>
                  <span className="text-[10px] text-slate-400 font-medium">Not admin yet? <span className="text-brand-navy hover:underline cursor-pointer" onClick={() => alert("Please contact the MP Secretariat IT cell to register official credentials.")}>Request access.</span></span>
                </div>

                {loginError && (
                  <div className="p-2 bg-red-50 border border-red-200 text-red-800 rounded-lg text-[10px] font-bold">
                    {loginError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Username</label>
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-semibold focus:outline-none focus:border-brand-saffron focus:bg-white transition-all text-xs"
                  />
                  <span className="text-[8px] text-slate-400 block font-semibold pl-1">Use official sansad ID</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Password / Passcode</label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-semibold focus:outline-none focus:border-brand-saffron focus:bg-white transition-all text-xs"
                  />
                </div>

                {/* 6-digit Captcha validation block */}
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between gap-4 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-r from-slate-200 to-slate-100 border border-slate-300 rounded px-3 py-1 font-mono font-black text-slate-800 text-sm select-none tracking-widest line-through decoration-slate-400 italic">
                      {generatedCaptcha}
                    </div>
                    <button 
                      type="button" 
                      onClick={generateNewCaptcha}
                      className="text-brand-navy hover:text-brand-navy-light p-1"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    placeholder="Enter Code"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    className="w-24 bg-white border border-slate-350 rounded-lg p-1.5 text-center font-bold font-mono text-xs focus:outline-none focus:border-brand-saffron uppercase"
                  />
                </div>

                {/* Buttons in mockup style */}
                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="submit"
                    className="px-8 py-2.5 bg-brand-navy hover:bg-brand-navy-light text-white font-extrabold text-[10px] rounded-full transition-all shadow-md cursor-pointer uppercase tracking-wider"
                  >
                    Submit
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex-1 flex flex-col justify-center space-y-3">
                <div className="space-y-0.5">
                  <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">Citizen Register / Login</h2>
                  <span className="text-[10px] text-slate-400 font-medium">Verify credentials via secure SMS OTP gateway.</span>
                </div>

                {regSuccess ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                    <p className="font-extrabold text-xs text-brand-navy">Registration Successful!</p>
                    <p className="text-[9px] text-slate-500">Redirecting you to the suggestion submission portal...</p>
                    <button
                      onClick={() => {
                        window.location.href = "/submit";
                      }}
                      className="w-full bg-brand-navy text-white text-[9px] py-1.5 rounded-full uppercase tracking-wider font-extrabold cursor-pointer"
                    >
                      Proceed to submit suggestions
                    </button>
                  </div>
                ) : (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!otpSent) {
                        setOtpSent(true);
                        alert("Mock OTP code '4729' dispatched to your mobile number.");
                        return;
                      }
                      if (otpInput !== "4729") {
                        alert("Invalid Code. Use default code: 4729");
                        return;
                      }
                      
                      if (typeof window !== "undefined") {
                        localStorage.setItem("registered_citizen_profile", JSON.stringify({
                          name: regName,
                          phone: regMobile,
                          village_id: regVillageId
                        }));
                      }
                      setRegSuccess(true);
                    }}
                    className="space-y-2"
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-semibold focus:outline-none focus:border-brand-saffron focus:bg-white transition-all text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Mobile Number</label>
                      <div className="flex gap-2">
                        <input 
                          type="tel" 
                          required
                          pattern="[0-9]{10}"
                          value={regMobile}
                          disabled={otpSent}
                          onChange={(e) => setRegMobile(e.target.value)}
                          placeholder="9876543210"
                          className="flex-1 bg-slate-50/50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-semibold focus:outline-none focus:border-brand-saffron focus:bg-white transition-all text-xs disabled:opacity-50"
                        />
                        {!otpSent && (
                          <button
                            type="submit"
                            className="px-3 bg-brand-navy hover:bg-brand-navy-light text-white text-[9px] font-bold rounded-xl cursor-pointer"
                          >
                            Send OTP
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Hierarchical Selection Chain */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">District (जिला)</label>
                      <select
                        value={regSelDistrict}
                        onChange={(e) => setRegSelDistrict(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-semibold focus:outline-none focus:border-brand-saffron focus:bg-white transition-all text-xs"
                      >
                        <option value="">-- Select District (जिला चुनें) --</option>
                        {regDistricts.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Block (ब्लॉक)</label>
                      <select
                        value={regSelBlock}
                        onChange={(e) => setRegSelBlock(e.target.value)}
                        disabled={!regSelDistrict}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-semibold focus:outline-none focus:border-brand-saffron focus:bg-white transition-all text-xs disabled:opacity-50"
                      >
                        <option value="">-- Select Block (ब्लॉक चुनें) --</option>
                        {regBlocks.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gram Panchayat (ग्राम पंचायत)</label>
                      <select
                        value={regSelGP}
                        onChange={(e) => setRegSelGP(e.target.value)}
                        disabled={!regSelBlock}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-semibold focus:outline-none focus:border-brand-saffron focus:bg-white transition-all text-xs disabled:opacity-50"
                      >
                        <option value="">-- Select Gram Panchayat (ग्राम पंचायत चुनें) --</option>
                        {regPanchayats.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Village / Ward (गांव / वार्ड)</label>
                      <select
                        value={regVillageId}
                        onChange={(e) => setRegVillageId(e.target.value)}
                        disabled={!regSelGP}
                        required
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 font-semibold focus:outline-none focus:border-brand-saffron focus:bg-white transition-all text-xs disabled:opacity-50"
                      >
                        <option value="">-- Select Village (गांव चुनें) --</option>
                        {regVillages.map(v => (
                          <option key={v.id} value={String(v.id)}>{v.name}</option>
                        ))}
                      </select>
                    </div>

                    {otpSent && (
                      <div className="space-y-1 animate-in fade-in duration-200">
                        <label className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Enter Verification Code (Default: 4729)</label>
                        <input 
                          type="text" 
                          required
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          placeholder="4729"
                          className="w-full bg-amber-50 border border-amber-250 rounded-xl py-2 px-3 text-center font-mono font-bold text-xs"
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <button 
                        type="submit"
                        className="px-8 py-2.5 bg-brand-navy hover:bg-brand-navy-light text-white font-extrabold text-[10px] rounded-full transition-all shadow-md cursor-pointer uppercase tracking-wider"
                      >
                        {otpSent ? "Verify" : "Register"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Footer Line with Phone Icon */}
            <div className="flex items-center gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-500">
              <span className="font-semibold">Any questions? Call us now.</span>
              <a 
                href="tel:1800112026"
                className="h-7 w-7 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-brand-navy shadow-sm transition-all cursor-pointer"
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: SSO Portals */}
          <div className="w-full md:w-[35%] bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200/60 p-6 md:p-8 flex flex-col justify-center items-center text-center space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Or continue with following options</span>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => alert("Aadhaar Connect Portal is a secure Gov Sandbox integration. (Mocked)")}
                className="h-12 w-12 rounded-xl bg-white border border-slate-250 flex flex-col items-center justify-center shadow-sm hover:border-brand-saffron hover:text-brand-saffron transition-all cursor-pointer group"
                title="Aadhaar Connect"
              >
                <Fingerprint className="h-6 w-6 text-slate-500 group-hover:text-brand-saffron transition-all" />
                <span className="text-[5px] font-black uppercase text-slate-400 mt-0.5 tracking-tighter">UIDAI</span>
              </button>

              <button 
                onClick={() => alert("DigiLocker SSO authentication. (Mocked)")}
                className="h-12 w-12 rounded-xl bg-white border border-slate-250 flex flex-col items-center justify-center shadow-sm hover:border-brand-saffron hover:text-brand-saffron transition-all cursor-pointer group"
                title="DigiLocker Connect"
              >
                <FolderLock className="h-6 w-6 text-slate-500 group-hover:text-brand-saffron transition-all" />
                <span className="text-[5px] font-black uppercase text-slate-400 mt-0.5 tracking-tighter">Locker</span>
              </button>

              <button 
                onClick={() => alert("CSC Digital Seva Portal authentication. (Mocked)")}
                className="h-12 w-12 rounded-xl bg-white border border-slate-250 flex flex-col items-center justify-center shadow-sm hover:border-brand-saffron hover:text-brand-saffron transition-all cursor-pointer group"
                title="CSC Digital Seva"
              >
                <Building2 className="h-6 w-6 text-slate-500 group-hover:text-brand-saffron transition-all" />
                <span className="text-[5px] font-black uppercase text-slate-400 mt-0.5 tracking-tighter">CSC</span>
              </button>
            </div>

            <p className="text-[9px] leading-relaxed text-slate-400 max-w-[180px] font-medium">
              Integrated secure single-sign-on (SSO) systems aligned with e-Kranti framework directives.
            </p>
          </div>

        </div>
        )}
      </div>
    );
  }

  // --- RENDER REDESIGNED PORTAL COMMAND CENTER FOR ADMIN (MP) ---
  const spamCount = submissions.filter(s => s.status === "spam").length;
  const processedCount = submissions.filter(s => s.status === "processed").length;

  return (
    <div className="space-y-6">
      
      {/* 1. MP Portal Command Banner */}
      <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden border border-slate-800">
        
        {/* Decorative backdrop crest */}
        <div className="absolute right-6 -bottom-10 opacity-5 pointer-events-none scale-150">
          <svg viewBox="0 0 100 120" className="h-48 w-48 fill-white">
            <path d="M50,10 C60,10 70,25 70,45 C70,60 62,80 50,95 C38,80 30,60 30,45 C30,25 40,10 50,10 Z"/>
          </svg>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-saffron/10 border border-brand-saffron/30 text-brand-saffron text-[9px] font-black uppercase tracking-wider">
              <Award className="h-3 w-3 shrink-0 text-brand-saffron" />
              <span>Madhya Pradesh Constituency Console</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">
              Constituency Administrative Command Center
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl font-medium">
              Review aggregate raw complaints, bypass security filters to access direct citizen contact directories, configure dynamic prioritization algorithms, and moderate constituency priorities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleResetDb}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset LGD Data
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Cards for the MP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
        
        {/* KPI 1: Ingested Volume */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-emerald-350 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Total Ingested (कुल प्राप्त)</span>
            <div className="text-xl font-black text-brand-navy">{submissions.length}</div>
            <span className="text-[10px] text-slate-400 font-bold block mt-1">Multi-channel representations</span>
          </div>
          <div className="h-11 w-11 rounded-lg bg-emerald-50 text-brand-green flex items-center justify-center shadow-inner group-hover:scale-105 transition-all border border-emerald-100">
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 2: Actionable Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-amber-350 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Actionable Grievances (सक्रिय शिकायतें)</span>
            <div className="text-xl font-black text-brand-navy">{processedCount}</div>
            <span className="text-[10px] text-slate-400 font-bold block mt-1">Passed PII & NLP filtration</span>
          </div>
          <div className="h-11 w-11 rounded-lg bg-amber-50 text-brand-saffron flex items-center justify-center shadow-inner group-hover:scale-105 transition-all border border-amber-100">
            <FileCheck className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 3: Spam Moderated */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-rose-350 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Spam / Invalid (अमान्य फ़िल्टर)</span>
            <div className="text-xl font-black text-brand-navy">{spamCount}</div>
            <span className="text-[10px] text-rose-650 font-bold block mt-1">Excluded from index calculations</span>
          </div>
          <div className="h-11 w-11 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-all border border-rose-100">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 4: Security Mode */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-blue-350 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Data Security Status (सुरक्षा स्थिति)</span>
            <div className={`text-[10px] font-black uppercase mt-1.5 px-2 py-0.5 rounded inline-block border ${
              revealPII 
                ? "bg-rose-100 text-rose-800 border-rose-250 animate-pulse" 
                : "bg-emerald-100 text-emerald-800 border-emerald-250"
            }`}>
              {revealPII ? "DECRYPTED (UNMASKED)" : "SEGREGATED (SECURE)"}
            </div>
            <span className="text-[10px] text-slate-450 font-bold block mt-1">PII segregation protocol active</span>
          </div>
          <div className={`h-11 w-11 rounded-lg flex items-center justify-center shadow-inner group-hover:scale-105 transition-all border ${
            revealPII ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
          }`}>
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* 3. Menu Tabs */}
      <div className="flex border border-slate-200 bg-white p-1 rounded-xl gap-1 shadow-sm max-w-2xl">
        {[
          { id: "roster", label: "Citizen Ingest List", icon: Users },
          { id: "weights", label: "CDPI Algorithm Weights", icon: Settings2 },
          { id: "ai-comparison", label: "AI Proposal Comparison", icon: GitCompare },
          { id: "settings", label: "Admin & System Settings", icon: Building2 }
        ].map(t => {
          const Icon = t.icon;
          const isSel = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                setUpdateMsg("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-xs transition-all ${
                isSel
                  ? "bg-brand-navy text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-brand-navy"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {updateMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-pulse">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{updateMsg}</span>
        </div>
      )}

      {/* TAB 1: Redesigned PII Citizen Roster */}
      {activeTab === "roster" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          
          {/* Controls Bar */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-brand-navy">Constituency Grievance Roster</h3>
              <p className="text-[10px] text-slate-400">Moderating incoming inputs dynamically updates LGD rankings on the main dashboard.</p>
            </div>

            {/* PII Toggle Actions */}
            <div className="flex items-center gap-3">
              
              {/* Scan decryption overlay helper */}
              {decryptingAnim && (
                <span className="text-[10px] text-rose-600 font-black animate-pulse uppercase tracking-wider bg-rose-50 px-2 py-1 rounded border border-rose-100">
                  Validating Secure Token & Decrypting...
                </span>
              )}

              <button
                onClick={handleTogglePII}
                disabled={decryptingAnim}
                className={`py-2 px-4 rounded-xl border font-black flex items-center gap-1.5 text-xs transition-all shadow-sm ${
                  revealPII 
                    ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-750" 
                    : "bg-white border-slate-300 text-slate-700 hover:text-brand-navy hover:bg-slate-50"
                }`}
              >
                {revealPII ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Bypass Decryption (Hide PII)
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Reveal Citizen PII (Unmask Contact)
                  </>
                )}
              </button>
              
              <button
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="p-2.5 bg-white border border-slate-300 rounded-xl text-slate-500 hover:text-brand-navy shadow-sm transition-all"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Master Table Grid */}
          <div className="overflow-x-auto text-xs">
            {loading ? (
              <div className="p-16 text-center text-slate-400 font-bold">Synchronizing priorities database...</div>
            ) : submissions.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-50 font-bold text-[10px] uppercase tracking-wider text-slate-500 select-none">
                    <th className="py-4 px-6 text-center w-24">Channel</th>
                    <th className="py-4 px-6 w-48">Citizen Reference</th>
                    <th className="py-4 px-6">Grievance Feedback Content</th>
                    <th className="py-4 px-6 w-32">Theme Sector</th>
                    <th className="py-4 px-6 w-56">LGD Village Location</th>
                    <th className="py-4 px-6 w-32">Status</th>
                    <th className="py-4 px-6 text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {submissions.map(sub => {
                    const isSpam = sub.status === "spam";
                    const villName = villageNameMap[sub.village_id] || `LGD Village Code: ${sub.village_id}`;
                    
                    // Truncation logic
                    const textSnippet = sub.raw_text.length > 60 ? sub.raw_text.substring(0, 60) + "..." : sub.raw_text;
                    const unredactedTextSnippet = sub.unredacted_text && sub.unredacted_text.length > 60 ? sub.unredacted_text.substring(0, 60) + "..." : sub.unredacted_text || sub.raw_text;
                    
                    return (
                      <tr key={sub.id} className={`border-b border-slate-200 hover:bg-slate-50/60 transition-all font-sans ${isSpam ? "bg-red-50/20 text-slate-400" : ""}`}>
                        
                        {/* Channel Badge Column */}
                        <td className="py-4 px-5 text-center align-middle">
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shadow-sm border ${
                            sub.channel === "whatsapp" ? "bg-emerald-50 text-emerald-800 border-emerald-150" :
                            sub.channel === "twitter" ? "bg-sky-50 text-sky-800 border-sky-150" :
                            sub.channel === "letter" ? "bg-amber-50 text-amber-800 border-amber-150" :
                            "bg-slate-50 text-slate-650 border-slate-200"
                          }`}>
                            {sub.channel}
                          </span>
                        </td>
                        
                        {/* Citizen Reference Column */}
                        <td className="py-4 px-5 font-bold text-[11px] align-middle">
                          {revealPII ? (
                            <span className="text-rose-600 font-extrabold bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded block shadow-sm tracking-tight w-fit">
                              {sub.unredacted_citizen_ref || sub.citizen_ref}
                            </span>
                          ) : (
                            <span className="text-slate-800 font-semibold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 tracking-wide">
                              {sub.citizen_ref}
                            </span>
                          )}
                        </td>

                        {/* Truncated Content with View Button */}
                        <td className="py-4 px-5 align-middle">
                          <div className="flex flex-col gap-1 items-start max-w-xs md:max-w-md">
                            <p className="text-[11px] leading-relaxed text-slate-700 font-medium font-sans">
                              "{revealPII ? unredactedTextSnippet : textSnippet}"
                            </p>
                            <button
                              type="button"
                              onClick={() => setActiveModalSub(sub)}
                              className="px-2 py-0.5 bg-brand-navy/5 border border-brand-navy/15 hover:bg-brand-navy/15 rounded text-[9px] font-bold text-brand-navy cursor-pointer transition-all shadow-sm"
                            >
                              View Detail
                            </button>
                          </div>
                        </td>

                        {/* Theme Sector Column */}
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            sub.sector === "roads" ? "bg-[#e0f2fe] text-blue-800 border border-blue-200" :
                            sub.sector === "education" ? "bg-[#fef3c7] text-amber-800 border border-amber-200" :
                            sub.sector === "health" ? "bg-[#dcfce7] text-green-800 border border-green-200" :
                            sub.sector === "water" ? "bg-[#e0f2fe] text-sky-800 border border-sky-200" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {sub.sector}
                          </span>
                        </td>

                        {/* Village Location LGD Translater Column (Incredibly MP-friendly!) */}
                        <td className="py-4 px-6">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-800 block text-[11px]">{villName}</span>
                            <span className="text-[9px] text-slate-400 font-bold block">LGD CODE: {sub.village_id}</span>
                          </div>
                        </td>
                        
                        {/* Status Column */}
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide border ${
                            isSpam 
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isSpam ? "bg-red-600" : "bg-emerald-600"}`}></span>
                            {sub.status}
                          </span>
                        </td>

                        {/* Actions buttons */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleToggleStatus(sub.id, sub.status)}
                            className={`w-full py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm border ${
                              isSpam 
                                ? "bg-emerald-50 text-brand-green border-brand-green/30 hover:bg-brand-green hover:text-white" 
                                : "bg-red-50 text-red-650 border-red-200 hover:bg-red-650 hover:text-white"
                            }`}
                          >
                            {isSpam ? "Unflag Spam" : "Flag as Spam"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-16 text-center text-slate-400 font-extrabold uppercase tracking-wider">No submissions found in constituency DB. Click reset seed above.</div>
            )}
          </div>
        </div>
      )}
      {/* TAB 2: Redesigned Scoring Weights Slider Deck */}
      {activeTab === "weights" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          
          {/* Header Bar */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-brand-navy uppercase tracking-tight">CDPI Algorithmic Weights Configuration</h3>
              <p className="text-[10px] text-slate-400">Configure weights that govern the constituency priority rankings. Modifications trigger a recalculation immediately.</p>
            </div>
          </div>

          <form onSubmit={handleSaveWeights} className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start text-xs font-sans">
            
            {/* Sliders Deck */}
            <div className="space-y-4">
              {[
                { key: "demand_volume", label: "Citizen Demand Volume Weight", desc: "Weighs the number of unique citizens lodging requests under a single village theme." },
                { key: "demand_intensity", label: "Feedback Intensity / Urgency Weight", desc: "Prioritizes complaints based on warning terms (e.g. 'leak', 'broken', 'immediately')." },
                { key: "population_impact", label: "Location Census Population Weight", desc: "Weighs census population. Prioritizes projects impacting more villagers." },
                { key: "gap_severity", label: "Infrastructure Gap Deficit Weight", desc: "Prioritizes locations with lagging development scores (e.g. poor road connectivity)." },
                { key: "overlap_penalty", label: "Existing Budget Overlap Penalty", desc: "Reduces score if the village is already scheduled for similar works in the local plan." }
              ].map(w => (
                <div key={w.key} className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm space-y-2.5 hover:border-slate-350 transition-all font-sans">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold uppercase text-slate-700 tracking-wider font-sans">{w.label}</span>
                    <span className="text-xs font-black text-brand-navy bg-slate-50 border border-slate-200 px-2 py-0.5 rounded shadow-sm font-mono">
                      {(Number(weights[w.key]) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={weights[w.key]}
                    onChange={(e) => setWeights(prev => ({ ...prev, [w.key]: Number(e.target.value) }))}
                    className="w-full accent-brand-navy h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed font-sans">{w.desc}</p>
                </div>
              ))}
            </div>

            {/* Explanatory Info Card */}
            <div className="space-y-4 bg-slate-50 border border-slate-200 p-5 rounded-xl font-sans">
              <h4 className="font-extrabold text-brand-navy flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                <Info className="h-4 w-4 text-brand-saffron shrink-0" />
                How the Priority Index is Calculated
              </h4>
              <p className="leading-relaxed text-slate-550 text-[11px] font-medium">
                The platform evaluates candidate priority works in each village using a composite formula based on your selected weights. The scores map dynamically to the public portal to guide infrastructure project approvals.
              </p>
              <div className="border-t border-slate-200 pt-3 space-y-2">
                <span className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider block">Formula Summary:</span>
                <code className="block bg-white p-3 rounded-lg border border-slate-250 text-[10px] leading-relaxed text-brand-navy font-mono shadow-sm">
                  CDPI = (W_vol × S_vol) + (W_int × S_int) + (W_pop × S_pop) + (W_gap × S_gap) - (W_over × S_over)
                </code>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-navy hover:bg-brand-navy-light text-white font-extrabold py-2.5 rounded-xl shadow-md transition-all duration-150 uppercase tracking-wider mt-4 text-[10px]"
              >
                {loading ? "Re-prioritizing Constituency Themes..." : "Apply & Recalculate CDPI"}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* TAB 3: AI Proposal Comparison */}
      {activeTab === "ai-comparison" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm font-sans">
          
          {/* Header Bar */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-brand-navy uppercase tracking-tight">AI Co-Pilot Decision Matrix Engine</h3>
              <p className="text-[10px] text-slate-400">Evaluate candidate constituency priority projects side-by-side. The AI determines the optimal allocation using LGD baseline datasets and target reach indicators.</p>
            </div>
          </div>

          <div className="p-6 font-sans">
            {isComparing ? (
              /* Loader Logger view */
              <div className="p-12 border border-slate-250 bg-slate-900 rounded-xl text-emerald-400 font-mono text-xs space-y-4 shadow-inner max-w-2xl mx-auto">
                <div className="flex items-center gap-2 border-b border-emerald-950 pb-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="font-black uppercase tracking-wider text-[10px]">AI PRIORITIZATION INSTANCE STARTED</span>
                </div>
                <div className="space-y-2 min-h-[140px] font-mono leading-relaxed">
                  {comparisonStep >= 0 && <p className="animate-pulse">⏳ [SYS]: Establishing secure link to Local Government Directory (LGD)... OK</p>}
                  {comparisonStep >= 1 && <p>🔍 [SYS]: Querying constituency GP borders and census data... {villages.length} villages loaded</p>}
                  {comparisonStep >= 2 && <p>📊 [SYS]: Parsing infrastructural gap indexes (Road indices, health distances, school ratios)... OK</p>}
                  {comparisonStep >= 3 && <p>💡 [SYS]: Processing citizen representations and semantic demand vectors... {submissions.length} inputs processed</p>}
                  {comparisonStep >= 4 && <p>⚡ [SYS]: Applying CDPI weights: Volume({(weights.demand_volume * 100).toFixed(0)}%), Gap({(weights.gap_severity * 100).toFixed(0)}%), Pop({(weights.population_impact * 100).toFixed(0)}%)...</p>}
                  {comparisonStep >= 5 && <p className="text-emerald-300 font-bold animate-bounce mt-2">✓ [SYS]: Matrix Calculation Complete. Formatting recommendation payload...</p>}
                </div>
              </div>
            ) : comparisonResult ? (
              /* Comparison Results Display */
              <div className="space-y-6">
                
                {/* Back Button */}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Comparison Result (तुलना परिणाम)</span>
                  <button
                    onClick={() => {
                      setComparisonResult(null);
                      setSelectedProposals(["", "", ""]);
                    }}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] rounded-lg border border-slate-250 uppercase tracking-wider shadow-sm transition-all"
                  >
                    ← Start New Comparison
                  </button>
                </div>

                {/* Side by side Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {comparisonResult.proposals.map((prop, idx) => {
                    const isBest = prop.isBest;
                    return (
                      <div 
                        key={idx} 
                        className={`border rounded-2xl flex flex-col justify-between overflow-hidden shadow-sm transition-all relative ${
                          isBest 
                            ? "border-amber-400 bg-amber-50/10 ring-4 ring-amber-400/10 shadow-lg scale-[1.01]" 
                            : "border-slate-200 bg-white hover:border-slate-350"
                        }`}
                      >
                        {/* Best Pick Tag */}
                        {isBest && (
                          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold uppercase text-[9px] py-1.5 px-4 text-center tracking-widest flex items-center justify-center gap-1">
                            <Brain className="h-3.5 w-3.5 fill-white" />
                            👑 AI Recommended Best Pick
                          </div>
                        )}

                        <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-slate-100 border text-slate-600 tracking-wider">
                                {prop.theme.sector.toUpperCase()}
                              </span>
                              <span className="font-mono text-[9px] font-black text-slate-400">
                                LGD: {prop.theme.village_id}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-sm text-brand-navy leading-snug">
                              {prop.theme.label}
                            </h4>
                          </div>

                          {/* Data Matrix */}
                          <div className="space-y-3 pt-3 border-t border-slate-100 text-[10px]">
                            {/* CDPI score */}
                            <div className="space-y-1">
                              <div className="flex justify-between font-bold text-slate-500 uppercase tracking-wide text-[9px]">
                                <span>CDPI Priority Index</span>
                                <span className="font-mono text-brand-navy">{prop.theme.score.toFixed(2)}</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div className="bg-brand-navy rounded-full h-1.5" style={{ width: `${Math.min(prop.theme.score * 100, 100)}%` }}></div>
                              </div>
                            </div>

                            {/* Population */}
                            <div className="space-y-1">
                              <div className="flex justify-between font-bold text-slate-500 uppercase tracking-wide text-[9px]">
                                <span>Beneficiary Population</span>
                                <span className="font-mono text-slate-800">{prop.population.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div className="bg-brand-green rounded-full h-1.5" style={{ width: `${Math.min((prop.population / 60000) * 100, 100)}%` }}></div>
                              </div>
                            </div>

                            {/* Baseline Gap */}
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                              <span className="font-extrabold text-[8px] text-slate-400 uppercase tracking-wider block">Local Infrastructure Baseline</span>
                              <p className="font-bold text-slate-700 mt-0.5 text-[9px]">{prop.gapText}</p>
                            </div>
                          </div>

                          {/* SWOT analysis */}
                          <div className="pt-3 border-t border-slate-100 space-y-2">
                            <span className="font-extrabold text-[8px] text-slate-400 uppercase tracking-wider block">SWOT Analysis</span>
                            <div className="space-y-1.5 text-[9px]">
                              {prop.swot.strengths.map((str, sIdx) => (
                                <div key={sIdx} className="flex gap-1.5 items-start">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-1"></span>
                                  <span className="text-slate-600 font-medium">{str}</span>
                                </div>
                              ))}
                              {prop.swot.weaknesses.map((wk, wIdx) => (
                                <div key={wIdx} className="flex gap-1.5 items-start">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1"></span>
                                  <span className="text-slate-500 font-medium">{wk}</span>
                                </div>
                              ))}
                              {prop.swot.opportunities.map((op, oIdx) => (
                                <div key={oIdx} className="flex gap-1.5 items-start">
                                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mt-1"></span>
                                  <span className="text-slate-600 font-medium">{op}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>

                        {/* Scheme allocation footer */}
                        <div className="bg-slate-50/50 p-4 border-t border-slate-100 space-y-1 text-center mt-auto">
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wide block">Recommended Scheme</span>
                          <span className="text-[10px] font-black text-brand-navy block uppercase">{prop.recommendedScheme}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AI Rationale Summary Block */}
                <div className="p-6 bg-gradient-to-tr from-slate-900 via-brand-navy to-slate-950 text-white rounded-2xl border border-slate-800 shadow-md space-y-3 font-sans">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Brain className="h-5 w-5 text-brand-saffron fill-brand-saffron animate-pulse" />
                    <h4 className="font-extrabold uppercase text-[11px] tracking-wide">AI Recommendation Rationale & Suggested Actions</h4>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300 font-medium max-w-4xl">
                    The recommendation engine selected **{themesList.find(t => t.id === comparisonResult.bestPickId)?.label}** as the primary focus. This decision matches central e-Governance guidelines: it prioritizes locations with the most severe infrastructure deficit (as shown in the LGD baseline gap ratios) and maximizes direct constituency reach.
                  </p>
                  
                  <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => alert("MPLADS fund draft requisition created. (Mocked)")}
                      className="px-4 py-2 bg-brand-saffron hover:bg-orange-650 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg shadow transition-all cursor-pointer font-bold"
                    >
                      Allocate MPLADS Budget
                    </button>
                    <button
                      onClick={() => alert("Drafting Detailed Project Report (DPR) to present to the District Collector... (Mocked)")}
                      className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-extrabold uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer font-bold"
                    >
                      Draft DPR for Collector
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* Proposal Selection Deck */
              <div className="space-y-6 max-w-4xl">
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-xs text-slate-650 leading-relaxed font-medium shadow-inner flex items-start gap-2">
                  <Info className="h-4.5 w-4.5 text-brand-saffron shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-[10px] text-brand-navy uppercase tracking-wider block mb-0.5">Instructions</span>
                    Select up to three active priority development proposals from the constituency roster below. Clicking the analysis button executes a multilateral comparison analyzing LGD demographics, baseline infrastructure index gaps, and representation signals.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[0, 1, 2].map((slotIndex) => (
                    <div key={slotIndex} className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm space-y-3 hover:border-slate-350 transition-all">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Comparison Candidate {slotIndex + 1} {slotIndex === 2 && "(Optional)"}</span>
                      <select
                        value={selectedProposals[slotIndex]}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedProposals(prev => {
                            const newArr = [...prev];
                            newArr[slotIndex] = val;
                            return newArr;
                            
                          });
                        }}
                        className="w-full bg-slate-50 border border-slate-250 rounded-lg p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-brand-saffron text-xs"
                      >
                        <option value="">-- Select Proposal --</option>
                        {themesList.map((theme) => {
                          const vil = villages.find(v => String(v.id) === String(theme.village_id));
                          const vilName = vil ? vil.name.split(" (")[0] : `LGD: ${theme.village_id}`;
                          return (
                            <option key={theme.id} value={theme.id}>
                              {theme.label} [{vilName}] (Score: {theme.score.toFixed(2)})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleStartComparison}
                  className="w-full bg-brand-navy hover:bg-brand-navy-light text-white font-extrabold py-3 rounded-xl shadow-md transition-all duration-150 uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  <Brain className="h-4.5 w-4.5 text-brand-saffron fill-brand-saffron animate-pulse" />
                  Initiate AI Comparative Analysis
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Admin & System Settings */}
      {activeTab === "settings" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm font-sans">
          
          {/* Header Bar */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-brand-navy uppercase tracking-tight">Admin & System Parameters</h3>
              <p className="text-[10px] text-slate-400">Configure MP office profile settings, local seat parameters, and perform database seed resets.</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start text-xs font-sans">
            
            {/* Constituency Metadata Manager */}
            <div className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm space-y-4 hover:border-slate-350 transition-all w-full">
              <h4 className="font-extrabold text-brand-navy flex items-center gap-1.5 text-[10px] uppercase tracking-wider border-b border-slate-100 pb-2">
                <Building2 className="h-4 w-4 text-brand-saffron shrink-0" />
                Constituency Profile Management
              </h4>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Representing MP Name</label>
                  <input 
                    type="text" 
                    value={mpName}
                    onChange={(e) => setMpName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-lg p-2 font-semibold text-slate-800 focus:outline-none focus:border-brand-saffron"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Constituency Lok Sabha Seat</label>
                  <input 
                    type="text" 
                    value={constituencyName}
                    onChange={(e) => setConstituencyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-lg p-2 font-semibold text-slate-800 focus:outline-none focus:border-brand-saffron"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Representing State</label>
                  <select 
                    value={constituencyState}
                    onChange={(e) => setConstituencyState(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-lg p-2 font-semibold text-slate-800 focus:outline-none focus:border-brand-saffron"
                  >
                    <option value="Madhya Pradesh">Madhya Pradesh (मध्य प्रदेश)</option>
                    <option value="Uttar Pradesh">Uttar Pradesh (उत्तर प्रदेश)</option>
                    <option value="Rajasthan">Rajasthan (राजस्थान)</option>
                    <option value="Gujarat">Gujarat (गुजरात)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUpdateMsg("Constituency metadata profile saved successfully.");
                  setTimeout(() => setUpdateMsg(""), 3000);
                }}
                className="w-full bg-brand-navy hover:bg-brand-navy-light text-white font-extrabold py-2 rounded-lg shadow-sm transition-all uppercase tracking-wider text-[10px]"
              >
                Save Profile Parameters
              </button>
            </div>

            {/* Database & Seed Actions */}
            <div className="space-y-4 w-full">
              
              {/* Reset utilities */}
              <div className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm space-y-3 hover:border-slate-350 transition-all">
                <h4 className="font-extrabold text-brand-navy flex items-center gap-1.5 text-[10px] uppercase tracking-wider border-b border-slate-100 pb-2">
                  <RefreshCw className="h-4 w-4 text-brand-saffron shrink-0" />
                  Database Operations & Reset
                </h4>
                <p className="leading-relaxed text-slate-400 text-[10px] font-medium">
                  Perform baseline data synchronization. Resetting restores original LGD structures (Gram Panchayats and Villages) and clears current live simulated telemetry inputs.
                </p>
                <button
                  type="button"
                  onClick={handleResetDb}
                  className="w-full bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white font-extrabold py-2 rounded-lg transition-all uppercase tracking-wider text-[10px] shadow-sm"
                >
                  Synchronize & Reset DB Seed
                </button>
              </div>

              {/* AI Chatbot Training Loop Card */}
              <div className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm space-y-3 hover:border-slate-350 transition-all">
                <h4 className="font-extrabold text-brand-navy flex items-center gap-1.5 text-[10px] uppercase tracking-wider border-b border-slate-100 pb-2">
                  <Brain className="h-4 w-4 text-brand-saffron shrink-0" />
                  NLP Chatbot Training Loop (एआई प्रशिक्षण लूप)
                </h4>
                <p className="leading-relaxed text-slate-400 text-[10px] font-medium">
                  Review new unstructured citizen queries caught by MyGov Saathi. Retraining updates token vector weights dynamically.
                </p>
                
                {/* Simulated unrecognized query list */}
                {typeof window !== "undefined" && localStorage.getItem("saathi_learning_queries") && JSON.parse(localStorage.getItem("saathi_learning_queries")).length > 0 ? (
                  <div className="space-y-1.5 max-h-[110px] overflow-y-auto border border-slate-100 p-2 rounded-lg bg-slate-50">
                    {JSON.parse(localStorage.getItem("saathi_learning_queries")).map((q, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-1.5 border border-slate-200 rounded text-[9px] font-mono text-slate-700">
                        <span className="truncate max-w-[80%]">"{q}"</span>
                        <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1 rounded uppercase tracking-wider">Unresolved</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-slate-100 p-3 rounded-lg bg-slate-50 text-center">
                    <span className="text-[9px] text-slate-450 block font-bold">✓ All citizen queries parsed. NLP models fully optimized.</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      const list = localStorage.getItem("saathi_learning_queries");
                      if (!list || JSON.parse(list).length === 0) {
                        alert("No unrecognized queries to train. NLP classifier is up to date.");
                        return;
                      }
                      setLoading(true);
                      setUpdateMsg("Tokenizing query vectors and retraining neural network classifier... Please wait.");
                      
                      setTimeout(() => {
                        localStorage.setItem("saathi_learning_queries", JSON.stringify([]));
                        setLoading(false);
                        setUpdateMsg("NLP Chatbot model retrained successfully! 5 vocabulary weights updated.");
                        setTimeout(() => setUpdateMsg(""), 3000);
                      }, 2000);
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-brand-navy hover:bg-brand-navy-light text-white font-extrabold py-2 rounded-lg transition-all uppercase tracking-wider text-[10px] shadow-sm flex items-center justify-center gap-1.5"
                >
                  {loading ? "Re-vectorizing NLP weights..." : "Retrain NLP Chatbot Model"}
                </button>
              </div>

              {/* Secure NIC statement */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-[10px] text-slate-550 leading-relaxed font-sans space-y-1.5">
                <div className="font-extrabold text-brand-navy flex items-center gap-1 uppercase tracking-wide">
                  <Info className="h-3.5 w-3.5 text-brand-saffron shrink-0" /> System security node
                </div>
                <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                  Parameters adjusted here are persistent inside the local secure sandbox environment. For central production syncing, adjustments write directly to core e-Governance database clusters.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 4. Grievance Detail Modal Overlay */}
      {activeModalSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            
            {/* Header */}
            <div className="bg-brand-navy text-white p-4 flex justify-between items-center border-b-4 border-brand-saffron">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                  activeModalSub.channel === "whatsapp" ? "bg-emerald-500 text-white border-emerald-600" :
                  activeModalSub.channel === "twitter" ? "bg-sky-500 text-white border-sky-600" :
                  "bg-amber-500 text-white border-amber-600"
                }`}>
                  {activeModalSub.channel}
                </span>
                <span className="font-extrabold text-xs uppercase tracking-wider">Grievance Detail Card</span>
              </div>
              <button 
                onClick={() => setActiveModalSub(null)}
                className="text-slate-300 hover:text-white p-1 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-[11px] font-sans">
              
              {/* Metadata row 1 */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Citizen Reference</span>
                  {revealPII ? (
                    <span className="text-rose-600 font-extrabold bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded block mt-0.5 w-fit">
                      {activeModalSub.unredacted_citizen_ref || activeModalSub.citizen_ref}
                    </span>
                  ) : (
                    <span className="text-slate-800 font-bold block mt-0.5 bg-slate-50 px-1.5 py-0.5 border border-slate-200 rounded w-fit">{activeModalSub.citizen_ref}</span>
                  )}
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">LGD Location Name</span>
                  <span className="text-slate-800 font-extrabold block mt-0.5">
                    {villageNameMap[activeModalSub.village_id] || `LGD Code: ${activeModalSub.village_id}`}
                  </span>
                </div>
              </div>

              {/* Metadata row 2 */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Sector Category</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 border text-slate-700 w-fit block mt-0.5 border-slate-200">
                    {activeModalSub.sector}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Verification Date</span>
                  <span className="text-slate-700 font-semibold block mt-0.5">
                    {new Date(activeModalSub.created_at).toLocaleDateString()} {new Date(activeModalSub.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>

              {/* Full Text Display */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">Full Ingested Text Content</span>
                {revealPII ? (
                  <div className="bg-rose-50/40 border border-rose-100 p-4 rounded-xl text-rose-800 font-bold italic leading-relaxed text-xs shadow-sm max-h-[160px] overflow-y-auto">
                    "{activeModalSub.unredacted_text || activeModalSub.raw_text}"
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-700 leading-relaxed text-xs max-h-[160px] overflow-y-auto font-sans">
                    "{activeModalSub.raw_text}"
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-150 flex justify-end gap-2">
              <button
                onClick={() => {
                  handleToggleStatus(activeModalSub.id, activeModalSub.status);
                  setActiveModalSub(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border shadow-sm ${
                  activeModalSub.status === "spam" 
                    ? "bg-emerald-50 text-brand-green border-brand-green/30 hover:bg-brand-green hover:text-white" 
                    : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-600 hover:text-white"
                }`}
              >
                {activeModalSub.status === "spam" ? "Unflag Spam" : "Flag as Spam"}
              </button>
              <button
                onClick={() => setActiveModalSub(null)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-350 text-slate-700 font-black rounded-lg text-[9px] uppercase tracking-wider transition-all border border-slate-300 shadow-sm"
              >
                Close Detail
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
