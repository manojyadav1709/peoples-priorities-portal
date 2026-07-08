"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, ShieldCheck, BarChart2, MapPin, Globe } from "lucide-react";

export default function ChatbotSaathi() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState("EN"); // EN, HI, HINGLISH, BN, MR
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  const translations = {
    EN: {
      welcome: "Namaskar! I am MyGov Saathi (MyGov साथी), your virtual AI assistant. I can guide you on submitting representations, data privacy protection, and the constituency CDPI prioritization algorithms. How can I help you today?",
      inputPlaceholder: "Ask Saathi a question...",
      faqTitle: "Quick FAQ Queries:",
      chips: [
        { label: "How to submit a grievance?", q: "submit" },
        { label: "How does CDPI priority work?", q: "cdpi" },
        { label: "Is my personal data (PII) secure?", q: "privacy" },
        { label: "What is an LGD Code?", q: "lgd" }
      ],
      responses: {
        submit: "To submit a priority suggestion, go to the 'Simulation & Submit' tab in the navigation bar. You can submit using Web Forms, Voice Input, or PDF scan files.",
        cdpi: "The CDPI algorithm prioritizes projects based on demand volume, NLP urgency intensity, census population, road/hospital gaps, and duplication checks.",
        privacy: "Your personal details (PII) are segregated into unredacted database columns. The public dashboard only sees masked references (e.g. CITIZEN-REF-***).",
        lgd: "LGD stands for Local Government Directory. It maps citizen locations to official government village codes on our satellite GIS map.",
        default: "Thank you for asking. Our portal aggregates citizen recommendations from Web, Voice, PDF, and Twitter. How else can I guide you?"
      }
    },
    HI: {
      welcome: "नमस्ते! मैं आपका वर्चुअल एआई सहायक मायगॉव साथी हूँ। मैं शिकायतों को दर्ज करने, व्यक्तिगत डेटा सुरक्षा और प्राथमिकता स्कोर एल्गोरिदम के बारे में मार्गदर्शन कर सकता हूँ। मैं आपकी क्या मदद कर सकता हूँ?",
      inputPlaceholder: "साथी से प्रश्न पूछें...",
      faqTitle: "त्वरित प्रश्न:",
      chips: [
        { label: "शिकायत कैसे दर्ज करें?", q: "submit" },
        { label: "CDPI प्राथमिकता कैसे काम करती है?", q: "cdpi" },
        { label: "क्या मेरा डेटा सुरक्षित है?", q: "privacy" },
        { label: "LGD कोड क्या है?", q: "lgd" }
      ],
      responses: {
        submit: "शिकायत दर्ज करने के लिए, नेविगेशन बार में 'Simulation & Submit' टैब पर जाएं। आप वेब फॉर्म, वॉयस रिकॉर्डिंग या पीडीएफ लेटर अपलोड का उपयोग कर सकते हैं।",
        cdpi: "CDPI प्राथमिकता स्कोर 5 मापदंडों पर आधारित है: मांग संख्या, त्वरित शब्द तीव्रता, गांव की आबादी, सड़क/अस्पताल की कमी, और बजट ओवरलैप जुर्माना।",
        privacy: "आपका व्यक्तिगत डेटा (PII) अलग रखा गया है और केवल सांसद (MP) ही इसे लॉगिन के बाद देख सकते हैं। सार्वजनिक रूप से डेटा मास्क (CITIZEN-REF-***) रहता है।",
        lgd: "LGD का मतलब स्थानीय सरकारी निर्देशिका है। यह नागरिक स्थान को हमारे सैटेलाइट मैप पर आधिकारिक सरकारी गाँव कोड से जोड़ता है।",
        default: "मायगॉव साथी से संपर्क करने के लिए धन्यवाद। हमारा पोर्टल वेब, वॉयस, पीडीएफ और ट्विटर से शिकायतें एकत्र करता है। मैं आपकी और कैसे मदद कर सकता हूँ?"
      }
    },
    HINGLISH: {
      welcome: "Namaskar! Main hoon MyGov Saathi, aapka AI assistant. Main suggestions submit karne, data privacy aur CDPI algorithm ke baare me bata sakta hu. Main aapki kya help karu?",
      inputPlaceholder: "Saathi se sawaal poochein...",
      faqTitle: "Frequent Questions:",
      chips: [
        { label: "Grievance kaise submit karein?", q: "submit" },
        { label: "CDPI priority kaise chalti hai?", q: "cdpi" },
        { label: "Data privacy safe hai kya?", q: "privacy" },
        { label: "LGD Code kya hota hai?", q: "lgd" }
      ],
      responses: {
        submit: "Suggestions submit karne ke liye, menu me 'Simulation & Submit' tab par jayein. Aap Web Form, Voice Record ya PDF letter scan upload kar sakte hain.",
        cdpi: "CDPI score projects ko rank karta hai local population, road/hospital gaps, public demand volume aur duplicate check parameters ko jodkar.",
        privacy: "Aapki personal information (PII) unredacted secure table me rehti hai jo sirf MP dekh sakte hain. Public user ko masked text dikhta hai.",
        lgd: "LGD Code matlab Local Government Directory code. Ye hamare satellite map par village ko official government index se link karta hai.",
        default: "Puchne ke liye dhanyawaad. Ye portal mobile, web, voice aur Twitter feeds se data collect karta hai. Main aapki kya sahayata kar sakta hu?"
      }
    },
    BN: {
      welcome: "নমস্কার! আমি আপনার ভার্চুয়াল এআই সহকারী মাইগভ সাথী। আমি অভিযোগ জমা দেওয়া, ডেটা গোপনীয়তা এবং সিডিপিআই অ্যালগরিদম সম্পর্কে তথ্য দিতে পারি। আমি কীভাবে আপনাকে সাহায্য করতে পারি?",
      inputPlaceholder: "সাথীকে প্রশ্ন করুন...",
      faqTitle: "দ্রুত প্রশ্ন:",
      chips: [
        { label: "কীভাবে অভিযোগ জমা দেব?", q: "submit" },
        { label: "CDPI কীভাবে কাজ করে?", q: "cdpi" },
        { label: "আমার ডেটা কি নিরাপদ?", q: "privacy" },
        { label: "LGD কোড কী?", q: "lgd" }
      ],
      responses: {
        submit: "অভিযোগ জমা দেওয়ার জন্য, নেভিগেশন বারে 'Simulation & Submit' ট্যাবে যান। আপনি ওয়েব ফর্ম বা পিডিএফ লেটার ব্যবহার করতে পারেন।",
        cdpi: "CDPI অ্যালগরিদম জনগণের চাহিদা, গ্রামের জনসংখ্যা এবং সড়ক/হাসপাতাল ব্যবধানের ওপর ভিত্তি করে অগ্রাধিকার নির্ধারণ করে।",
        privacy: "আপনার ব্যক্তিগত বিবরণ (PII) আলাদা করা থাকে এবং কেবল সংসদ সদস্যই দেখতে পারেন। পাবলিক ড্যাশবোর্ডে এটি মাস্ক করা থাকে।",
        lgd: "LGD হলো লোকাল গভর্নমেন্ট ডিরেক্টরি। এটি নাগরিকের অবস্থানকে আমাদের স্যাটেলাইট ম্যাপে সরকারি গ্রামের কোডের সাথে যুক্ত করে।",
        default: "মাইগভ সাথীকে প্রশ্ন করার জন্য ধন্যবাদ। আমাদের পোর্টাল ওয়েব ও ভয়েস থেকে অভিযোগ সংগ্রহ করে। আমি আপনাকে কীভাবে সাহায্য করতে পারি?"
      }
    },
    MR: {
      welcome: "नमस्कार! मी मायगव्ह साथी, आपला व्हर्च्युअल एआय सहाय्यक आहे. मी तक्रार दाखल करणे, वैयक्तिक डेटा सुरक्षा आणि प्राधान्य गुण अल्गोरिदम याबद्दल मार्गदर्शन करू शकतो. मी आपली काय मदत करू?",
      inputPlaceholder: "साथीला प्रश्न विचारा...",
      faqTitle: "त्वरित प्रश्न:",
      chips: [
        { label: "तक्रार कशी नोंदवावी?", q: "submit" },
        { label: "CDPI प्राधान्य कसे चालते?", q: "cdpi" },
        { label: "माझा डेटा सुरक्षित आहे का?", q: "privacy" },
        { label: "LGD कोड म्हणजे काय?", q: "lgd" }
      ],
      responses: {
        submit: "तक्रार नोंदवण्यासाठी, मेनूमध्ये 'Simulation & Submit' टॅबवर जा. आपण वेब फॉर्म, व्हॉइस किंवा पीडीएफ द्वारे तक्रार दाखल करू शकता.",
        cdpi: "CDPI स्कोअर लोकसंख्या, रस्ता/रुग्णालय कमतरता आणि नागरिकांची संख्या यावर आधारित गावांचे प्राधान्य ठरवतो.",
        privacy: "तुमची वैयक्तिक माहिती (PII) सुरक्षित ठेवली जाते जी केवळ खासदार लॉगिन नंतर पाहू शकतात. जनतेला फक्त मास्क केलेले नाव दिसते.",
        lgd: "LGD म्हणजे लोकल गव्हर्नमेंट डिरेक्टरी. हे आपल्या सॅटेलाइट मॅपवर गावाला अधिकृत सरकारी कोडशी जोडते.",
        default: "मायगव्ह साथीशी संपर्क साधल्याबद्दल धन्यवाद. आमचे पोर्टल वेब, व्हॉइस आणि ट्विटरवरून तक्रारी गोळा करते. मी आपली काय मदत करू शकतो?"
      }
    }
  };

  // Select language and proceed to chat
  const handleSelectLanguage = (langKey) => {
    setLanguage(langKey);
    setHasSelectedLanguage(true);
  };

  // Reset chat welcome message on language change
  useEffect(() => {
    if (hasSelectedLanguage) {
      setMessages([
        {
          sender: "bot",
          text: translations[language].welcome,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [language, hasSelectedLanguage]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, hasSelectedLanguage]);

  const handleSendMessage = (text, tag = null) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = {
      sender: "user",
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      let botResponse = "";
      const lowerText = text.toLowerCase();
      const currentRes = translations[language].responses;

      if (tag === "submit" || lowerText.includes("submit") || lowerText.includes("grievance") || lowerText.includes("complaint") || lowerText.includes("voice") || lowerText.includes("pdf")) {
        botResponse = currentRes.submit;
      } else if (tag === "cdpi" || lowerText.includes("cdpi") || lowerText.includes("priority") || lowerText.includes("algorithm") || lowerText.includes("score")) {
        botResponse = currentRes.cdpi;
      } else if (tag === "privacy" || lowerText.includes("privacy") || lowerText.includes("pii") || lowerText.includes("secure") || lowerText.includes("personal") || lowerText.includes("safe")) {
        botResponse = currentRes.privacy;
      } else if (tag === "lgd" || lowerText.includes("lgd") || lowerText.includes("code") || lowerText.includes("village") || lowerText.includes("district")) {
        botResponse = currentRes.lgd;
      } else {
        // Fallback default response
        botResponse = currentRes.default;

        // Save unrecognized query for MP retraining training loop
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem("saathi_learning_queries");
          const queryList = cached ? JSON.parse(cached) : [];
          if (!queryList.includes(text)) {
            queryList.push(text);
            localStorage.setItem("saathi_learning_queries", JSON.stringify(queryList));
          }
        }
      }

      const botMsg = {
        sender: "bot",
        text: botResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-brand-navy hover:bg-brand-navy-light text-white px-4 py-3 rounded-full shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 border border-brand-saffron/40"
        >
          <div className="relative">
            <MessageSquare className="h-5 w-5" />
            <span className="absolute -top-1.5 -right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-saffron opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-saffron"></span>
            </span>
          </div>
          <span className="text-xs font-black uppercase tracking-wider">Ask MyGov Saathi</span>
        </button>
      )}

      {/* Expanded Chat Dialog window */}
      {isOpen && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[350px] sm:w-[380px] h-[510px] flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Official Crest Header */}
          <div className="bg-brand-navy text-white p-3 flex justify-between items-center border-b-4 border-brand-saffron shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-7.5 w-7.5 rounded-full bg-white flex items-center justify-center border border-slate-200 shrink-0">
                <Globe className="h-4.5 w-4.5 text-brand-navy" />
              </div>
              <div>
                <h4 className="font-extrabold text-[11px] tracking-wide uppercase">MyGov Saathi (MyGov साथी)</h4>
                <span className="text-[8px] text-emerald-450 font-bold block uppercase tracking-widest font-mono">Bhashini translation Active</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {hasSelectedLanguage && (
                /* Back to language selection / dropdown change */
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-brand-navy-light text-white text-[9px] font-black border border-slate-700 rounded px-1.5 py-0.5 outline-none cursor-pointer focus:border-brand-saffron font-sans"
                >
                  <option value="EN">English</option>
                  <option value="HI">हिंदी</option>
                  <option value="HINGLISH">Hinglish</option>
                  <option value="BN">বাংলা</option>
                  <option value="MR">मराठी</option>
                </select>
              )}
              
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setHasSelectedLanguage(false); // Reset to onboarding on close so next click prompts again
                }}
                className="text-slate-300 hover:text-white p-1 transition-all rounded-lg hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Body & Onboarding Selection Switch */}
          {!hasSelectedLanguage ? (
            // --- ONBOARDING LANGUAGE SELECTION PANEL ---
            <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-center items-center bg-[#f8fafc] text-center space-y-5 font-sans">
              <div className="space-y-2">
                <Globe className="h-10 w-10 text-brand-saffron animate-spin-slow mx-auto shrink-0" />
                <h3 className="font-extrabold text-sm text-brand-navy">Welcome to MyGov Helpdesk</h3>
                <h3 className="font-bold text-xs text-slate-700">मायगॉव साथी हेल्पडेस्क में आपका स्वागत है</h3>
                <p className="text-[10px] text-slate-400 font-medium max-w-[280px]">
                  Please select your preferred language to continue.<br/>
                  आगे बढ़ने के लिए कृपया अपनी पसंदीदा भाषा चुनें।
                </p>
              </div>

              {/* Language Selection Buttons */}
              <div className="grid grid-cols-1 w-full gap-2 max-w-[260px]">
                {[
                  { key: "EN", label: "English" },
                  { key: "HI", label: "हिंदी (Hindi)" },
                  { key: "HINGLISH", label: "Hinglish (Hindi/English)" },
                  { key: "BN", label: "বাংলা (Bengali)" },
                  { key: "MR", label: "मराठी (Marathi)" }
                ].map((langOpt) => (
                  <button
                    key={langOpt.key}
                    onClick={() => handleSelectLanguage(langOpt.key)}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 hover:text-brand-navy border border-slate-200 hover:border-brand-saffron font-extrabold py-2.5 px-4 rounded-xl text-[11px] shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-saffron shrink-0"></span>
                    {langOpt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // --- ACTIVE CHAT SESSION PANEL ---
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
                {messages.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[11px] leading-relaxed shadow-sm font-medium ${
                        m.sender === "user" 
                          ? "bg-brand-navy text-white rounded-tr-none" 
                          : "bg-white text-slate-700 border border-slate-200 rounded-tl-none"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[8px] text-slate-400 font-bold mt-1 px-1">
                      {m.time}
                    </span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 w-fit">
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Quick FAQ Chips */}
              <div className="p-2 border-t border-slate-100 bg-white space-y-1">
                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block px-1">
                  {translations[language].faqTitle}
                </span>
                <div className="flex flex-wrap gap-1">
                  {translations[language].chips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip.label, chip.q)}
                      className="text-[9px] font-bold text-slate-600 hover:text-brand-navy hover:bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 flex items-center gap-1 transition-all"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input text sender */}
              <div className="p-3 border-t border-slate-200 bg-white flex gap-2 items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage(inputText);
                  }}
                  placeholder={translations[language].inputPlaceholder}
                  className="flex-1 bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-saffron"
                />
                <button
                  onClick={() => handleSendMessage(inputText)}
                  className="p-2 bg-brand-navy hover:bg-brand-navy-light text-white rounded-xl shadow-sm transition-all"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </div>
            </>
          )}

        </div>
      )}

    </div>
  );
}
