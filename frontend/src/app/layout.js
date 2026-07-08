"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  MessageSquarePlus, 
  GitCompare, 
  Settings, 
  Vote,
  ExternalLink,
  ChevronDown,
  Lock,
  LogOut,
  X,
  Building2,
  Users,
  Phone,
  Fingerprint,
  FolderLock
} from "lucide-react";
import { registerServiceWorker } from "@/lib/swRegister";
import ChatbotSaathi from "@/components/ChatbotSaathi";
import "./globals.css";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [lang, setLang] = useState("EN");
  const [textSize, setTextSize] = useState("normal");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Modal Login states matching the glassmorphic card design
  const [modalTab, setModalTab] = useState("admin"); // admin, citizen
  const [modalUsername, setModalUsername] = useState("");
  const [modalPassword, setModalPassword] = useState("");
  const [modalCaptcha, setModalCaptcha] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalName, setModalName] = useState("");
  const [modalMobile, setModalMobile] = useState("");
  const [modalOtp, setModalOtp] = useState("");
  const [modalOtpSent, setModalOtpSent] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalVillageId, setModalVillageId] = useState("");
  const [modalVillages, setModalVillages] = useState([]);
  
  // Dynamic geographical states for modal citizen registration
  const [modalDistricts, setModalDistricts] = useState([]);
  const [modalBlocks, setModalBlocks] = useState([]);
  const [modalPanchayats, setModalPanchayats] = useState([]);
  const [modalSelDistrict, setModalSelDistrict] = useState("");
  const [modalSelBlock, setModalSelBlock] = useState("");
  const [modalSelGP, setModalSelGP] = useState("");

  useEffect(() => {
    registerServiceWorker();
    
    if (typeof window !== "undefined") {
      setIsAdminLoggedIn(sessionStorage.getItem("admin_logged_in") === "true");

      const handleLoginChange = () => {
        setIsAdminLoggedIn(sessionStorage.getItem("admin_logged_in") === "true");
      };

      window.addEventListener("admin-login-changed", handleLoginChange);
      return () => {
        window.removeEventListener("admin-login-changed", handleLoginChange);
      };
    }
  }, []);

  // Fetch initial districts when modal opens
  useEffect(() => {
    if (!showLoginModal) return;
    async function loadDistricts() {
      try {
        const res = await fetch("http://localhost:8000/api/districts");
        const data = await res.json();
        setModalDistricts(data);
      } catch (err) {
        console.error("Modal: Failed to load districts", err);
      }
    }
    loadDistricts();
  }, [showLoginModal]);

  // Fetch blocks when district changes
  useEffect(() => {
    if (!showLoginModal) return;
    async function fetchBlocks() {
      try {
        let url = "http://localhost:8000/api/blocks";
        if (modalSelDistrict) {
          url += `?district_id=${modalSelDistrict}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setModalBlocks(data);
        setModalSelBlock("");
        setModalSelGP("");
        setModalVillageId("");
      } catch (err) {
        console.error("Modal: Failed to load blocks", err);
      }
    }
    fetchBlocks();
  }, [modalSelDistrict, showLoginModal]);

  // Fetch Gram Panchayats when block changes
  useEffect(() => {
    if (!showLoginModal || !modalSelBlock) {
      setModalPanchayats([]);
      setModalSelGP("");
      setModalVillageId("");
      return;
    }
    async function fetchPanchayats() {
      try {
        const res = await fetch(`http://localhost:8000/api/panchayats?block_id=${modalSelBlock}`);
        const data = await res.json();
        setModalPanchayats(data);
        setModalSelGP("");
        setModalVillageId("");
      } catch (err) {
        console.error("Modal: Failed to load panchayats", err);
      }
    }
    fetchPanchayats();
  }, [modalSelBlock, showLoginModal]);

  // Fetch Villages when GP changes
  useEffect(() => {
    if (!showLoginModal || !modalSelGP) {
      setModalVillages([]);
      setModalVillageId("");
      return;
    }
    async function fetchVillages() {
      try {
        const res = await fetch(`http://localhost:8000/api/villages?gram_panchayat_id=${modalSelGP}`);
        const data = await res.json();
        setModalVillages(data);
        if (data.length > 0) {
          setModalVillageId(String(data[0].id));
        }
      } catch (err) {
        console.error("Modal: Failed to load villages", err);
      }
    }
    fetchVillages();
  }, [modalSelGP, showLoginModal]);

  const navItems = [
    { name: "Dashboard (डैशबोर्ड)", href: "/" },
    { name: "Simulation & Submit (सिमुलेशन और सबमिट)", href: "/submit" },
    { name: "Proposal Comparison (प्रस्ताव तुलना)", href: "/comparison" },
    { name: "Privacy Policy (गोपनीयता नीति)", href: "/privacy" }
  ];

  // Text size classes
  const sizeClass = 
    textSize === "small" ? "text-xs" : 
    textSize === "large" ? "text-base" : "text-sm";

  return (
    <html lang="en">
      <head>
        <title>People's Priorities Portal - Government of India</title>
        <meta name="description" content="AI for Constituency Development Planning - National Portal of India Style" />
      </head>
      <body className="flex flex-col min-h-screen bg-background text-foreground antialiased">
        
        {/* 1. Tricolor Top Strip */}
        <div className="tricolor-strip w-full shrink-0"></div>

        {/* 2. Top Utility accessibility bar */}
        <div className="bg-[#f8fafc] border-b border-slate-200 py-1.5 px-4 text-[10px] sm:text-xs font-semibold text-slate-600 flex justify-between items-center shrink-0">
          <div className="flex gap-4">
            <span className="hover:text-black cursor-pointer">भारत सरकार | GOVERNMENT OF INDIA</span>
            <span className="hidden sm:inline hover:text-black cursor-pointer">लोक प्राथमिकता पोर्टल | constituency portal</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Resizing controls */}
            <div className="flex items-center gap-1.5 border-r border-slate-300 pr-3">
              <button onClick={() => setTextSize("small")} className={`px-1.5 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-100 ${textSize === "small" ? "font-bold text-brand-navy" : ""}`}>A-</button>
              <button onClick={() => setTextSize("normal")} className={`px-1.5 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-100 ${textSize === "normal" ? "font-bold text-brand-navy" : ""}`}>A</button>
              <button onClick={() => setTextSize("large")} className={`px-1.5 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-100 ${textSize === "large" ? "font-bold text-brand-navy" : ""}`}>A+</button>
            </div>
            
            {/* Language Switch */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setLang("EN")} 
                className={`hover:text-brand-saffron transition-all ${lang === "EN" ? "text-brand-saffron font-bold underline" : ""}`}
              >
                English
              </button>
              <span className="text-slate-300">|</span>
              <button 
                onClick={() => setLang("HI")} 
                className={`hover:text-brand-saffron transition-all ${lang === "HI" ? "text-brand-saffron font-bold underline" : ""}`}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>

        {/* 3. Main Brand Header */}
        <header className="bg-white py-4 px-6 md:px-12 flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-200 gap-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Stylized Gold Emblem SVG */}
            <svg viewBox="0 0 100 120" className="h-16 w-14 fill-none stroke-brand-gold shrink-0">
              <path d="M50,10 C60,10 70,25 70,45 C70,60 62,80 50,95 C38,80 30,60 30,45 C30,25 40,10 50,10 Z" strokeWidth="2" strokeMiterlimit="10"/>
              <path d="M50,10 L50,95 M30,45 C40,48 60,48 70,45" strokeWidth="1.5" strokeDasharray="2,2"/>
              <circle cx="50" cy="50" r="10" strokeWidth="2" />
              <path d="M50,60 L50,95 M45,75 L55,75 M42,85 L58,85" strokeWidth="2" />
              <path d="M38,95 L62,95 L50,110 Z" fill="#d4af37" />
            </svg>
            <div>
              <h1 className="text-lg md:text-xl font-black text-brand-navy tracking-wide leading-tight uppercase">
                {lang === "EN" ? "People's Priorities Portal" : "लोक प्राथमिकता पोर्टल"}
              </h1>
              <p className="text-[10px] md:text-xs text-brand-green font-bold uppercase tracking-wider">
                {lang === "EN" ? "AI Constituency Development & Evidence Planning" : "एआई निर्वाचन क्षेत्र विकास और साक्ष्य योजना"}
              </p>
              <p className="text-[9px] text-text-muted mt-0.5">
                {lang === "EN" ? "Member of Parliament (MP) Office Initiative • Government of India" : "संसद सदस्य (सांसद) कार्यालय पहल • भारत सरकार"}
              </p>
            </div>
          </div>

          {/* Right logos */}
          <div className="flex items-center gap-4 self-end md:self-auto text-right">
            <div className="hidden lg:block text-xs border-r border-slate-200 pr-4">
              <span className="text-[10px] text-text-muted block">National Helpline</span>
              <strong className="text-brand-navy">1800-11-2026</strong>
            </div>
            
            {/* Clickable Digital India Logo */}
            <a 
              href="https://digitalindia.gov.in/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex h-12 w-28 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-300 px-2 shadow-sm transition-all text-center select-none cursor-pointer"
            >
              <span className="text-[8px] font-black tracking-tight leading-none text-slate-500 uppercase">Power To Empower</span>
              <span className="text-xs font-black tracking-tighter mt-0.5 leading-none">
                <span className="text-[#0073e6]">Digital </span>
                <span className="text-[#ff671f]">In</span>
                <span className="text-[#046a38]">dia</span>
              </span>
            </a>

            {/* Header Admin Console / Logout Button */}
            {isAdminLoggedIn ? (
              <button 
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sessionStorage.removeItem("admin_logged_in");
                    window.dispatchEvent(new Event("admin-login-changed"));
                    window.location.href = "/admin";
                  }
                }}
                className="flex h-12 px-4 items-center justify-center gap-1.5 rounded border border-rose-600 text-rose-650 hover:bg-rose-50 hover:text-rose-700 font-extrabold text-xs transition-all shadow-sm cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                Logout
              </button>
            ) : (
              <Link 
                href="/admin"
                className="flex h-12 px-4 items-center justify-center gap-1.5 rounded border border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white font-extrabold text-xs transition-all shadow-sm cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5" />
                Login
              </Link>
            )}
          </div>
        </header>

        {/* 4. Horizontal Navigation Bar */}
        <nav className="bg-brand-navy text-white text-xs md:text-sm font-semibold shrink-0 shadow-md">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row md:items-center">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-5 py-3.5 transition-all text-slate-100 hover:bg-brand-navy-light ${
                    isActive 
                      ? "bg-brand-saffron text-white border-b-4 border-brand-navy font-extrabold" 
                      : ""
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* 5. Main Content Container */}
        <main className={`flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6 ${sizeClass}`}>
          {children}
        </main>

        {/* 6. Official Footer */}
        <footer className="bg-brand-navy text-slate-300 py-8 px-6 text-xs shrink-0 border-t-4 border-brand-saffron mt-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <h4 className="font-extrabold text-white uppercase tracking-wider text-sm">About the Portal</h4>
              <p className="leading-relaxed text-slate-400 text-[11px]">
                This is the official AI Planning and Constituency Consolidation portal built under the guidelines of the Ministry of Electronics & IT, Government of India. It uses NLP models to aggregate citizen feedback from WhatsApp, Telegram, web, and offline files.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-extrabold text-white uppercase tracking-wider text-sm">Useful Links</h4>
              <ul className="space-y-1 text-slate-400 text-[11px]">
                <li><a href="https://www.india.gov.in/" target="_blank" className="hover:underline flex items-center gap-1">National Portal of India <ExternalLink className="h-3 w-3 inline" /></a></li>
                <li><a href="https://www.mygov.in/" target="_blank" className="hover:underline flex items-center gap-1">MyGov Portal <ExternalLink className="h-3 w-3 inline" /></a></li>
                <li><a href="https://digitalindia.gov.in/" target="_blank" className="hover:underline flex items-center gap-1">Digital India Scheme <ExternalLink className="h-3 w-3 inline" /></a></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-extrabold text-white uppercase tracking-wider text-sm">Contact Information</h4>
              <p className="leading-relaxed text-slate-400 text-[11px]">
                Member of Parliament Secretariat Office<br/>
                New Delhi, India - 110001<br/>
                Email: support-priorities@gov.in
              </p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto border-t border-brand-navy-light mt-6 pt-4 text-center text-[10px] text-slate-400 flex flex-col sm:flex-row sm:justify-between">
            <span>© 2026 People's Priorities Portal, Government of India. All rights reserved.</span>
            <span className="mt-1 sm:mt-0">Designed & Maintained by Ministry of Electronics & IT (MeitY)</span>
          </div>

        </footer>

        {/* Floating AI Chatbot Assistant */}
        <ChatbotSaathi />

      </body>
    </html>
  );
}
