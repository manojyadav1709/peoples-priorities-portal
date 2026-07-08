"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Mic, 
  Image as ImageIcon, 
  Smartphone, 
  Upload, 
  HelpCircle, 
  Sparkles, 
  Info,
  CheckCircle2,
  Lock,
  FileText,
  StopCircle,
  FileUp
} from "lucide-react";
import { saveOfflineSuggestion } from "@/lib/db";
import { registerBackgroundSync } from "@/lib/swRegister";
import { API_BASE } from "@/lib/config";
import InteractiveMap from "@/components/InteractiveMap";

// Custom inline SVG for Twitter bird icon
const TwitterIcon = ({ className, ...props }) => (
  <svg 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth="2" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

export default function SubmitSimulation() {
  // Ingestion Tabs
  const [activeTab, setActiveTab] = useState("web"); // web, twitter, pdf
  
  // Dynamic Villages list
  const [villagesList, setVillagesList] = useState([]);
  const [webWard, setWebWard] = useState(""); // Holds LGD village id

  // Web Form State
  const [webCitizen, setWebCitizen] = useState("Jane Doe");
  const [webText, setWebText] = useState("");
  const [simulatedPhoto, setSimulatedPhoto] = useState(false);

  // Live HTML5 Audio Recorder States
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordTime, setRecordTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const audioIntervalRef = useRef(null);

  // Twitter Simulator State
  const [twitterHandle, setTwitterHandle] = useState("IndoreCitizen");
  const [twitterText, setTwitterText] = useState("");
  const [selectedTwitterVillage, setSelectedTwitterVillage] = useState("");

  // PDF Grievance State
  const [pdfFile, setPdfFile] = useState(null);
  const [selectedPdfVillage, setSelectedPdfVillage] = useState("");
  const fileInputRef = useRef(null);

  // WhatsApp Simulator State
  const [chatInputs, setChatInputs] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "citizen", text: "Hello MP Office. The street lights in Kolar (Village 2) are not working. It is unsafe at night.", time: "10:30 AM" }
  ]);
  
  // Offline cached items state
  const [offlineItems, setOfflineItems] = useState([]);
  
  // Pipeline Processing Logs
  const [pipelineLogs, setPipelineLogs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Map state
  const [submissions, setSubmissions] = useState([]);
  const [selectedVillageOnMap, setSelectedVillageOnMap] = useState(null);

  // Load Villages from API
  useEffect(() => {
    async function loadVillages() {
      try {
        const res = await fetch(`${API_BASE}/api/villages`);
        const data = await res.json();
        setVillagesList(data);
        
        // Check if there is a registered citizen profile to pre-fill
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("registered_citizen_profile");
          if (stored) {
            const profile = JSON.parse(stored);
            setWebCitizen(profile.name);
            if (profile.village_id) {
              setWebWard(profile.village_id);
              setSelectedTwitterVillage(profile.village_id);
              setSelectedPdfVillage(profile.village_id);
              return;
            }
          }
        }

        if (data.length > 0) {
          setWebWard(String(data[0].id));
          setSelectedTwitterVillage(String(data[0].id));
          setSelectedPdfVillage(String(data[0].id));
        }
      } catch (err) {
        console.error("Failed to load LGD villages list", err);
      }
    }
    loadVillages();
  }, []);

  // Fetch submissions for map heatmap
  useEffect(() => {
    async function loadSubmissions() {
      try {
        const res = await fetch(`${API_BASE}/api/submissions`);
        const data = await res.json();
        setSubmissions(data);
      } catch (err) {
        console.error("Failed to load submissions for map", err);
      }
    }
    loadSubmissions();
  }, [pipelineLogs]); // re-fetch after new submission

  const loadOfflineItems = async () => {
    try {
      const { db } = await import("@/lib/db");
      const items = await db.CitizenSuggestions.where("sync_status").equals("pending").toArray();
      setOfflineItems(items);
    } catch (err) {
      console.error("Failed to load offline suggestions from Dexie", err);
    }
  };

  useEffect(() => {
    loadOfflineItems();
    const handleSyncComplete = () => {
      loadOfflineItems();
    };
    window.addEventListener("offlineSyncComplete", handleSyncComplete);
    return () => {
      window.removeEventListener("offlineSyncComplete", handleSyncComplete);
    };
  }, []);

  // Timer hook for audio recorder
  useEffect(() => {
    if (isRecording) {
      audioIntervalRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(audioIntervalRef.current);
      setRecordTime(0);
    }
    return () => clearInterval(audioIntervalRef.current);
  }, [isRecording]);

  // Audio Recorder functions
  const startAudioRecording = async () => {
    if (typeof window === "undefined") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioBlob(null);
      setSuccessMsg("");
    } catch (err) {
      console.error("Microphone access error", err);
      alert("Failed to access microphone. Please verify browser settings.");
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Web submit handler
  const handleWebSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setPipelineLogs(null);

    const photoBlob = simulatedPhoto ? new Blob(["mock photo data"], { type: "image/jpeg" }) : null;

    // Check offline status
    if (typeof window !== "undefined" && !navigator.onLine) {
      try {
        await saveOfflineSuggestion({
          citizen_ref: webCitizen,
          channel: "web",
          sector: "other",
          text_content: webText,
          village_id: webWard,
          audio_blob: audioBlob,
          photo_blob: photoBlob
        });
        
        const syncRegistered = await registerBackgroundSync();
        setSuccessMsg(
          syncRegistered 
            ? "Offline Mode: Suggestion saved locally! It will automatically synchronize in the background when connectivity returns."
            : "Offline Mode: Suggestion saved locally! Background Sync unsupported, it will upload when you reconnect and refresh."
        );
        
        await loadOfflineItems();
        setWebText("");
        setAudioBlob(null);
        setSimulatedPhoto(false);
      } catch (err) {
        console.error("Offline save error", err);
        alert("Offline storage error: " + err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    const formData = new FormData();
    formData.append("citizen_ref", webCitizen);
    formData.append("channel", "web");
    formData.append("raw_text", webText);
    formData.append("village_id", webWard);
    
    if (audioBlob) {
      formData.append("audio_file", audioBlob, "recorded_memo.webm");
    }
    if (simulatedPhoto) {
      formData.append("photo_file", photoBlob, "photo.jpg");
    }

    try {
      const res = await fetch("http://localhost:8000/api/submissions", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      
      if (data.status === "success") {
        setSuccessMsg("Suggestion submitted successfully to the processing queue!");
        setPipelineLogs(data.data);
        setWebText("");
        setAudioBlob(null);
        setSimulatedPhoto(false);
      } else {
        alert("Pipeline error: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit. Ensure FastAPI backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  // Twitter submit handler
  const handleTwitterSubmit = async (e) => {
    e.preventDefault();
    if (!twitterText.trim()) return;

    setLoading(true);
    setSuccessMsg("");
    setPipelineLogs(null);

    const formData = new FormData();
    formData.append("citizen_ref", `@${twitterHandle}`);
    formData.append("channel", "twitter");
    formData.append("raw_text", twitterText);
    formData.append("village_id", selectedTwitterVillage);

    try {
      const res = await fetch("http://localhost:8000/api/submissions", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      
      if (data.status === "success") {
        setSuccessMsg("Tweet ingested and clustered into priorities feed!");
        setPipelineLogs(data.data);
        setTwitterText("");
      } else {
        alert("Ingestion error: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  // PDF OCR submit handler
  const handlePdfSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) return;

    setLoading(true);
    setSuccessMsg("");
    setPipelineLogs(null);

    const formData = new FormData();
    formData.append("file", pdfFile);
    formData.append("village_id", selectedPdfVillage);

    try {
      const res = await fetch("http://localhost:8000/api/submissions/document", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.status === "success") {
        setSuccessMsg("Scanned PDF processed and parsed successfully via OCR!");
        setPipelineLogs(data.data);
        setPdfFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        alert("OCR Ingestion error: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload document. Check backend port 8000.");
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp Chat handler
  const handleSendChat = async () => {
    if (!chatInputs.trim()) return;

    const userText = chatInputs;
    setChatInputs("");
    setLoading(true);
    setPipelineLogs(null);

    const newMsg = {
      id: chatMessages.length + 1,
      sender: "citizen",
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsg]);

    const targetVillageId = villagesList.length > 0 ? villagesList[0].id : "472592";

    const formData = new FormData();
    formData.append("citizen_ref", "whatsapp_user_sim");
    formData.append("channel", "whatsapp");
    formData.append("raw_text", userText);
    formData.append("village_id", targetVillageId);

    try {
      const res = await fetch("http://localhost:8000/api/submissions", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.status === "success") {
        setPipelineLogs(data.data);
        
        setChatMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            sender: "bot",
            text: `Thank you! Feedback received. Categorized under: ${data.data.sector.toUpperCase()} in Village LGD: ${data.data.village_id}. We have redacted PII to secure your privacy.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      alert("Webhook simulation failed. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  // Format recording timer
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-extrabold text-brand-navy tracking-tight uppercase">Multi-Channel Ingestion & Simulator</h2>
        <p className="text-sm text-text-muted">Simulate and verify incoming citizen complaints via web forms (with live recording), Twitter feeds, and scanned paper letters (PDF OCR).</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 gap-1 bg-slate-50 p-1.5 rounded-lg border">
        {[
          { id: "web", label: "Web Portal Ingest", icon: Smartphone },
          { id: "twitter", label: "Twitter/X Feed Ingest", icon: TwitterIcon },
          { id: "pdf", label: "Official Grievance (PDF OCR)", icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSuccessMsg("");
                setPipelineLogs(null);
              }}
              className={`flex items-center gap-1.5 py-2 px-4 rounded-md font-bold text-xs transition-all ${
                activeTab === tab.id
                  ? "bg-brand-navy text-white shadow-sm"
                  : "text-slate-650 hover:bg-slate-200/60"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TAB 1: Web Ingestion Form */}
        {activeTab === "web" && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm border-t-4 border-brand-navy">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Upload className="h-5 w-5 text-brand-saffron" />
              <h3 className="font-extrabold text-sm text-brand-navy">Citizen Web Grievance Form</h3>
            </div>

            <form onSubmit={handleWebSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-600 font-bold">Citizen Name / Identifier</label>
                  <input 
                    type="text" 
                    value={webCitizen}
                    onChange={(e) => setWebCitizen(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-850 focus:outline-none focus:border-brand-saffron font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-600 font-bold">Target LGD Village Location</label>
                  <select 
                    value={webWard}
                    onChange={(e) => setWebWard(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-850 focus:outline-none focus:border-brand-saffron font-semibold"
                  >
                    {villagesList.length === 0 ? (
                      <option value="" disabled>Loading villages...</option>
                    ) : (
                      villagesList.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Write developmental suggestion</label>
                <textarea 
                  rows="4"
                  value={webText}
                  onChange={(e) => setWebText(e.target.value)}
                  placeholder="Describe what needs upgrade (e.g. roads, health clinics, schools, water filters). Type in Hindi, Spanish, or English..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-850 focus:outline-none focus:border-brand-saffron font-semibold resize-none"
                ></textarea>
              </div>

              {/* Dynamic Mic Recorder Section */}
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                <span className="font-bold text-slate-500 block text-[10px] uppercase tracking-wide">Citizen Voice Memo Recording</span>
                
                <div className="flex items-center gap-3">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startAudioRecording}
                      className="p-2.5 bg-brand-saffron hover:bg-orange-650 text-white rounded-lg font-bold flex items-center gap-1.5 transition-all text-[11px] shadow-sm"
                    >
                      <Mic className="h-4 w-4" />
                      Record Voice Suggestion
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopAudioRecording}
                      className="p-2.5 bg-red-600 hover:bg-red-750 text-white rounded-lg font-bold flex items-center gap-1.5 transition-all text-[11px] animate-pulse shadow-sm"
                    >
                      <StopCircle className="h-4 w-4" />
                      Stop Recording ({formatTime(recordTime)})
                    </button>
                  )}
                  
                  {isRecording && (
                    <div className="flex items-center gap-0.5 h-4">
                      <span className="w-1 bg-red-500 rounded-full animate-bounce h-2"></span>
                      <span className="w-1 bg-red-500 rounded-full animate-bounce delay-75 h-3"></span>
                      <span className="w-1 bg-red-500 rounded-full animate-bounce delay-150 h-4"></span>
                      <span className="w-1 bg-red-500 rounded-full animate-bounce delay-75 h-2"></span>
                    </div>
                  )}
                </div>

                {audioBlob && (
                  <div className="flex flex-col gap-1.5 p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-brand-green" /> Recorded Memo Available
                    </span>
                    <audio src={URL.createObjectURL(audioBlob)} controls className="w-full h-8" />
                  </div>
                )}
              </div>

              {/* Photo Upload Simulator toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSimulatedPhoto(p => !p)}
                  className={`p-2.5 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition-all text-[10px] ${
                    simulatedPhoto 
                      ? "bg-brand-saffron/10 border-brand-saffron text-brand-saffron" 
                      : "bg-slate-50 border-slate-350 text-slate-500 hover:text-brand-navy"
                  }`}
                >
                  <ImageIcon className="h-4.5 w-4.5" />
                  {simulatedPhoto ? "Attachment: Photo Active" : "Simulate Photo Attachment"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-navy hover:bg-brand-navy-light text-white font-bold py-2.5 rounded-lg shadow transition-all duration-150"
              >
                {loading ? "Executing Ingestion Pipeline..." : "Submit Grievance"}
              </button>
            </form>

            {successMsg && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-semibold">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" /> {successMsg}
              </div>
            )}

            {/* Offline Pending Items List */}
            {offlineItems.length > 0 && (
              <div className="mt-5 border-t border-slate-200 pt-4 space-y-3">
                <span className="font-extrabold text-[10px] text-brand-saffron uppercase tracking-wider block">
                  Cached Offline Suggestions ({offlineItems.length})
                </span>
                <div className="space-y-2">
                  {offlineItems.map((item) => (
                    <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                      <div className="flex justify-between items-center text-[9px] text-slate-400">
                        <span className="font-bold">OFFLINE ID: {item.id}</span>
                        <span className="font-extrabold uppercase px-1.5 py-0.5 bg-orange-100 text-brand-saffron rounded">
                          {item.sync_status}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-700">"{item.text_content}"</p>
                      <div className="flex justify-between items-center text-[9px] text-slate-400">
                        <span>Village LGD: {item.village_id}</span>
                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Twitter Stream Ingestion */}
        {activeTab === "twitter" && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm border-t-4 border-[#1DA1F2]">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <TwitterIcon className="h-5 w-5 text-[#1DA1F2]" />
              <h3 className="font-extrabold text-sm text-[#1DA1F2]">Social Media Stream Simulator</h3>
            </div>

            <form onSubmit={handleTwitterSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-600 font-bold">Twitter Handle / Profile</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">@</span>
                    <input 
                      type="text" 
                      value={twitterHandle}
                      onChange={(e) => setTwitterHandle(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-6 pr-3 py-2 text-slate-850 focus:outline-none focus:border-[#1DA1F2] font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-600 font-bold">Target LGD Village</label>
                  <select 
                    value={selectedTwitterVillage}
                    onChange={(e) => setSelectedTwitterVillage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-850 focus:outline-none focus:border-[#1DA1F2] font-semibold"
                  >
                    {villagesList.length === 0 ? (
                      <option value="" disabled>Loading villages...</option>
                    ) : (
                      villagesList.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center font-bold text-[#1DA1F2] text-[10px]">
                    {twitterHandle.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-black text-slate-800 block leading-none">@{twitterHandle}</span>
                    <span className="text-[8px] text-slate-400">Just now • Public Tweet</span>
                  </div>
                </div>

                <textarea 
                  rows="3"
                  value={twitterText}
                  onChange={(e) => setTwitterText(e.target.value)}
                  placeholder="What is the issue? Mention hashtags like #PeoplesPriorities or target keywords for sectors (e.g. clinic, sanitation, road, school)..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-850 focus:outline-none focus:border-[#1DA1F2] font-semibold resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading || !twitterText.trim()}
                className="w-full bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold py-2.5 rounded-lg shadow transition-all duration-150"
              >
                {loading ? "Parsing Tweet..." : "Post Tweet to Ingestion"}
              </button>
            </form>

            {successMsg && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-semibold">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" /> {successMsg}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PDF Letter Ingest */}
        {activeTab === "pdf" && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm border-t-4 border-amber-500">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileUp className="h-5 w-5 text-amber-500" />
              <h3 className="font-extrabold text-sm text-brand-navy">Scanned Grievance Letter OCR Ingestion</h3>
            </div>

            <form onSubmit={handlePdfSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Target LGD Village</label>
                <select 
                  value={selectedPdfVillage}
                  onChange={(e) => setSelectedPdfVillage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-850 focus:outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="">-- Select Village --</option>
                  {villagesList.length === 0 ? (
                    <option value="" disabled>Loading villages...</option>
                  ) : (
                    villagesList.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 flex flex-col items-center justify-center gap-2 relative">
                <FileText className="h-10 w-10 text-slate-400" />
                <span className="font-bold text-slate-700 block">Select Grievance Scanned Document</span>
                <span className="text-[10px] text-slate-400 block">Supports PDF files up to 5MB</span>
                
                <input 
                  type="file" 
                  accept=".pdf"
                  ref={fileInputRef}
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                
                {pdfFile && (
                  <div className="mt-2 bg-white px-3 py-1.5 rounded-lg border border-slate-250 text-[10px] font-bold text-slate-700 flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" /> {pdfFile.name} ({(pdfFile.size/1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !pdfFile}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg shadow transition-all duration-150"
              >
                {loading ? "Running OCR Analysis..." : "Upload Scanned PDF to OCR"}
              </button>
            </form>

            {successMsg && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-semibold">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" /> {successMsg}
              </div>
            )}
          </div>
        )}

        {/* WhatsApp Mobile Simulator */}
        <div className="flex justify-center">
          <div className="w-[320px] h-[580px] bg-slate-900 border-8 border-slate-800 rounded-[40px] flex flex-col overflow-hidden relative shadow-xl">
            
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-800 rounded-full z-20 flex justify-center items-center">
              <span className="h-1 w-8 bg-slate-700 rounded-full"></span>
            </div>

            {/* Chat Header */}
            <div className="bg-[#075e54] pt-8 pb-3 px-4 flex items-center gap-2 z-10 shrink-0">
              <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[#075e54] text-[10px]">
                PPP
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-white leading-none">Constituency Support Bot</h4>
                <p className="text-[8px] text-[#a5d6a7] mt-0.5">Online • Automated System</p>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 bg-[#efeae2] p-3 overflow-y-auto space-y-3 flex flex-col justify-end text-[11px]">
              <div className="mx-auto bg-slate-200 border border-slate-300/40 rounded px-2.5 py-1 text-[8px] text-slate-500 flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" /> Messages are end-to-end encrypted.
              </div>

              {chatMessages.map(msg => (
                <div 
                  key={msg.id}
                  className={`max-w-[85%] rounded-lg p-2.5 shadow-sm leading-snug ${
                    msg.sender === "citizen"
                      ? "bg-[#d9fdd3] text-[#303030] self-end rounded-tr-none"
                      : "bg-white text-slate-800 self-start rounded-tl-none"
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="text-[7px] text-slate-500 block text-right mt-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Chat Footer Input */}
            <div className="p-2 border-t border-slate-200 bg-[#f0f2f5] flex gap-2 items-center shrink-0">
              <input 
                type="text" 
                value={chatInputs}
                onChange={(e) => setChatInputs(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Type in Hindi/Spanish/English..."
                className="flex-1 bg-white border border-slate-300 text-slate-800 rounded-full py-1.5 px-3 text-xs focus:outline-none"
              />
              <button 
                onClick={handleSendChat}
                className="h-8 w-8 rounded-full bg-[#075e54] flex items-center justify-center text-white hover:opacity-90 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* NLP Pipeline Logs */}
      {pipelineLogs && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Sparkles className="h-5 w-5 text-brand-saffron" />
            <h3 className="font-extrabold text-sm text-brand-navy">AI NLP Ingestion Pipeline Verification Logs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Input & Translation */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <span className="font-bold text-brand-navy block text-[10px] uppercase tracking-wide border-b border-slate-200 pb-1">1. Input & Translation</span>
              <div>
                <span className="text-[10px] text-slate-400 block">Detected Language</span>
                <span className="font-bold text-slate-700 uppercase">{pipelineLogs.language}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">PII Redacted Input</span>
                <p className="text-slate-600 mt-0.5 leading-relaxed bg-white p-2 rounded border border-slate-200">"{pipelineLogs.raw_text}"</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">English Canonical Translation</span>
                <p className="text-brand-navy mt-0.5 leading-relaxed bg-orange-50/20 p-2 rounded border border-brand-saffron/20 font-semibold">"{pipelineLogs.translated_text}"</p>
              </div>
            </div>

            {/* Categorization & Extraction */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <span className="font-bold text-brand-navy block text-[10px] uppercase tracking-wide border-b border-slate-200 pb-1">2. Classification & Tagging</span>
              <div>
                <span className="text-[10px] text-slate-400 block">Tagged Sector Category</span>
                <span className="px-2 py-0.5 bg-brand-navy text-white rounded font-bold uppercase mt-1.5 inline-block">
                  {pipelineLogs.sector}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Location Scope</span>
                <span className="font-bold text-slate-700 block mt-0.5">Village ID: {pipelineLogs.village_id}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">PII Scrubbing Status</span>
                <span className="text-brand-green font-bold block mt-0.5">✓ Phone/Email/ID Sanitized</span>
              </div>
            </div>

            {/* Semantic Clustering */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <span className="font-bold text-brand-navy block text-[10px] uppercase tracking-wide border-b border-slate-200 pb-1">3. Clustering & Vector Match</span>
              <div>
                <span className="text-[10px] text-slate-400 block">Dynamic Theme Assignment</span>
                <p className="text-slate-700 mt-1 leading-relaxed bg-white p-2 rounded border border-slate-200 font-bold">
                  Clustered in Village LGD {pipelineLogs.village_id} sector "{pipelineLogs.sector.toUpperCase()}".
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-slate-200 text-[10px] space-y-1 text-slate-500">
                <span className="font-bold text-brand-navy flex items-center gap-1 text-[9px] uppercase tracking-wide">
                  <Info className="h-3.5 w-3.5 text-brand-saffron" /> Cosine Similarity
                </span>
                <p className="leading-relaxed">
                  Generated 1536 float dimension embeddings. Matched against active village demands with similarity above 0.55 threshold.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Satellite India Map Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <svg className="h-5 w-5 text-brand-saffron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <div>
            <h3 className="font-extrabold text-sm text-brand-navy">India Satellite GIS Constituency Map</h3>
            <p className="text-[11px] text-slate-400 font-medium">Live village grievance heatmap — click any marker to filter by LGD location.</p>
          </div>
        </div>
        <InteractiveMap
          wards={villagesList}
          submissions={submissions}
          selectedWardId={selectedVillageOnMap}
          onSelectWard={(id) => {
            setSelectedVillageOnMap(id);
            if (id) {
              setWebWard(String(id));
              setSelectedTwitterVillage(String(id));
              setSelectedPdfVillage(String(id));
            }
          }}
        />
      </div>

    </div>
  );
}
