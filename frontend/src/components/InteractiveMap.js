"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Info, ArrowRight, Compass, ShieldAlert, Globe } from "lucide-react";

export default function InteractiveMap({ wards, submissions, onSelectWard, selectedWardId }) {
  const [overlayType, setOverlayType] = useState("submissions"); // submissions, road, hospital, school
  
  // Map zoom scope: constituency vs national
  const [mapScope, setMapScope] = useState("national"); // Default to national so they see the whole country first
  const [activeRegion, setActiveRegion] = useState("MP"); // Active state/region
  
  // Geotargeting states
  const [userLocation, setUserLocation] = useState(null);
  const [detectingLoc, setDetectingLoc] = useState(false);

  // Map DOM reference & Leaflet instance reference
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersGroupRef = useRef(null);

  // Village LGD Coordinates Mapping for real Leaflet GIS representation
  const villageCoords = {
    "472592": { name: "Abhaypur Village", lat: 23.2844, lng: 77.4226 },
    "472999": { name: "Kolar Village", lat: 23.1678, lng: 77.4098 },
    "472593": { name: "Bhopal Village", lat: 23.2599, lng: 77.4126 },
    "472594": { name: "Rampur Village", lat: 23.2000, lng: 77.4500 },
    "4": { name: "Indore Ward 4", lat: 22.7196, lng: 75.8577 }
  };

  // Get total submissions for a specific village
  const getSubCount = (wardId) => {
    return submissions.filter(s => String(s.village_id) === String(wardId)).length;
  };

  // Get color coding matching the NIC satellite map standard
  const getColorForOverlay = (wardId, wardData) => {
    if (!wardData) return "#64748b";
    
    if (overlayType === "submissions") {
      const count = getSubCount(wardId);
      if (count === 0) return "#10b981"; // Green (good)
      if (count <= 2) return "#f59e0b"; // Yellow (warning)
      return "#ef4444"; // Red (critical hotspot)
    }

    if (overlayType === "road") {
      const index = wardData.road_quality_index;
      if (index < 0.3) return "#ef4444";
      if (index < 0.7) return "#f59e0b";
      return "#10b981";
    }

    if (overlayType === "hospital") {
      const dist = wardData.distance_to_nearest_hospital_km;
      if (dist > 10) return "#ef4444";
      if (dist > 4) return "#f59e0b";
      return "#10b981";
    }

    if (overlayType === "school") {
      const ratio = wardData.school_enrollment_ratio;
      if (ratio < 60) return "#ef4444";
      if (ratio < 85) return "#f59e0b";
      return "#10b981";
    }

    return "#64748b";
  };

  // Run live GPS geolocation detection
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setDetectingLoc(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude.toFixed(4),
            lng: position.coords.longitude.toFixed(4),
            district: "Bhopal (भोपाल)",
            block: "Phanda (फंदा)",
            village: "Abhaypur (अभयपुर)",
            lgd: "472592"
          });
          setDetectingLoc(false);
        },
        (error) => {
          setTimeout(() => {
            setUserLocation({
              lat: "23.2599",
              lng: "77.4126",
              district: "Bhopal (भोपाल)",
              block: "Phanda (फंदा)",
              village: "Abhaypur (अभयपुर)",
              lgd: "472592"
            });
            setDetectingLoc(false);
          }, 1000);
        }
      );
    }
  }, []);

  // Initialize Leaflet satellite map dynamically
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let L;
    let activeMap;

    // Dynamically import Leaflet on client side
    import("leaflet").then((leafletModule) => {
      L = leafletModule.default;

      // Check if Leaflet map instance already exists, remove it first
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch (_) {}
        leafletMapRef.current = null;
      }

      // Also clear any stale Leaflet internal container state
      if (mapContainerRef.current) {
        delete mapContainerRef.current._leaflet_id;
      }

      // Initialize map container
      activeMap = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      });
      leafletMapRef.current = activeMap;

      // Add zoom control at bottom right
      L.control.zoom({ position: "bottomright" }).addTo(activeMap);

      // Add ESRI Satellite Tile layer (No API key needed, high fidelity)
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19
      }).addTo(activeMap);

      // Add ESRI World Boundaries & Labels overlay (enables readable state borders & place names over satellite imagery)
      L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        opacity: 0.8
      }).addTo(activeMap);

      // Create a layer group for markers
      const markersGroup = L.layerGroup().addTo(activeMap);
      markersGroupRef.current = markersGroup;

      // Set initial view based on Map Scope (National India vs Local Bhopal)
      if (mapScope === "national") {
        activeMap.setView([22.9734, 78.6569], 5); // Center on India

        // Render Saffron pulse marker over Madhya Pradesh active seat
        const mpCenter = [23.2599, 77.4126];
        
        // Custom Pulsing DivIcon for Bhopal/Indore seat
        const pulseIcon = L.divIcon({
          className: "custom-pulse-icon",
          html: `<div style="position: relative; width: 24px; height: 24px;">
                  <div style="position: absolute; width: 14px; height: 14px; background: #ff9933; border: 2px solid white; border-radius: 50%; top: 5px; left: 5px; box-shadow: 0 0 8px rgba(0,0,0,0.5);"></div>
                  <div style="position: absolute; width: 24px; height: 24px; border: 2.5px solid #ff9933; border-radius: 50%; animation: pulse-ring 1.5s infinite; top: 0; left: 0; box-shadow: 0 0 4px #ff9933;"></div>
                 </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const nationalMarker = L.marker(mpCenter, { icon: pulseIcon }).addTo(markersGroup);
        nationalMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px; padding: 4px; line-height: 1.4;">
            <strong style="color: #092240; font-size: 12px; text-transform: uppercase;">Madhya Pradesh constituency</strong><br/>
            <span>Active planning boundaries loaded for Bhopal/Indore Lok Sabha seat.</span><br/>
            <button id="btn-drill-down" style="margin-top: 6px; width: 100%; background: #092240; color: white; border: none; font-weight: bold; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
              Drill Down to Constituency Map
            </button>
          </div>
        `, { closeButton: false }).openPopup();

        // Bind click handler inside popup
        activeMap.on("popupopen", () => {
          const btn = document.getElementById("btn-drill-down");
          if (btn) {
            btn.onclick = () => {
              setMapScope("constituency");
            };
          }
        });
      } else {
        // Local Constituency view zoomed in on Bhopal LGD villages
        if (selectedWardId && villageCoords[selectedWardId]) {
          // If a village is selected, pan and zoom directly to its satellite view coordinates
          const selCoords = villageCoords[selectedWardId];
          activeMap.setView([selCoords.lat, selCoords.lng], 14);
        } else {
          // Default viewpoint centered to fit all Bhopal GP/Village bounds
          activeMap.setView([23.235, 77.425], 11);
        }

        // Draw circles for LGD villages
        wards.forEach(ward => {
          const coords = villageCoords[ward.id];
          if (!coords) return;

          const color = getColorForOverlay(ward.id, ward);
          const subCount = getSubCount(ward.id);
          const isSelected = String(selectedWardId) === String(ward.id);

          // Add a circle marker
          const circleMarker = L.circleMarker([coords.lat, coords.lng], {
            radius: subCount > 0 ? 12 + subCount * 2 : 10,
            fillColor: color,
            color: isSelected ? "#ff9933" : "#ffffff",
            weight: isSelected ? 3.5 : 1.5,
            fillOpacity: isSelected ? 0.95 : 0.7,
            className: "cursor-pointer transition-all duration-150"
          }).addTo(markersGroup);

          // Popup detail card
          circleMarker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 11px; padding: 2px; line-height: 1.4;">
              <strong style="color: #092240; font-size: 12px;">${coords.name}</strong><br/>
              <span>LGD CODE: <strong>${ward.id}</strong></span><br/>
              <span>Grievance Count: <strong>${subCount}</strong></span><br/>
              <span>Population: ${ward.population.toLocaleString()}</span>
            </div>
          `);

          // Automatically open popup if selected
          if (isSelected) {
            circleMarker.openPopup();
          }

          // Handle click to filter dashboard LGD variables
          circleMarker.on("click", () => {
            onSelectWard(ward.id);
          });
        });
      }
    });

    // Cleanup Leaflet instance on unmount or tab scope updates
    return () => {
      if (activeMap) {
        try {
          activeMap.remove();
        } catch (_) {}
        activeMap = null;
      }
      leafletMapRef.current = null;
    };
  }, [mapScope, overlayType, selectedWardId, submissions, wards]);

  // Find LGD details matching the selected LGD ID
  const selectedWardDetails = wards.find(w => String(w.id) === String(selectedWardId));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* Dynamic Leaflet Satellite Map Frame */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between relative shadow-sm">
        
        {/* CSS Pulse Ring animation injected for satellite pulse */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse-ring {
            0% { transform: scale(0.6); opacity: 1; }
            100% { transform: scale(1.4); opacity: 0; }
          }
          .custom-pulse-icon {
            background: none !important;
            border: none !important;
          }
        `}} />

        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-extrabold text-brand-navy text-sm flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-brand-saffron" />
                Constituency Geographic Heatmap (LGD GIS Satellite Console)
              </h3>
              <p className="text-[11px] text-text-muted mt-0.5">Explore satellite imaging and unmask village priorities directly on the GIS map.</p>
            </div>
            
            {/* View Scope Toggle */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setMapScope("constituency")}
                className={`text-[10px] font-extrabold px-3 py-1.5 rounded-md transition-all ${
                  mapScope === "constituency"
                    ? "bg-brand-navy text-white shadow-sm"
                    : "text-slate-600 hover:text-brand-navy"
                }`}
              >
                Local Villages Map
              </button>
              <button
                onClick={() => setMapScope("national")}
                className={`text-[10px] font-extrabold px-3 py-1.5 rounded-md transition-all ${
                  mapScope === "national"
                    ? "bg-brand-navy text-white shadow-sm"
                    : "text-slate-600 hover:text-brand-navy"
                }`}
              >
                India Satellite Map
              </button>
            </div>
          </div>
        </div>

        {/* Leaflet DOM Node Element */}
        <div className="relative h-[380px] bg-slate-150 rounded-lg border border-slate-200 overflow-hidden shadow-inner">
          <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} className="z-10" />

          {/* Leaflet CSS Stylesheet injected directly into page render */}
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

          {/* Map Legend Overlay */}
          {mapScope === "constituency" && (
            <div className="absolute bottom-2 left-2 bg-white/95 border border-slate-200 rounded-lg p-2 text-[9px] space-y-1 shadow-md z-20">
              <span className="font-extrabold uppercase text-[8px] tracking-wider text-brand-navy block">GIS Legend</span>
              {overlayType === "submissions" ? (
                <div className="space-y-1 text-slate-700">
                  <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block border"></span> 0 complaints</div>
                  <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block border"></span> 1-2 complaints</div>
                  <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block border"></span> 3+ hotspots</div>
                </div>
              ) : (
                <div className="space-y-1 text-slate-700">
                  <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block border"></span> Favorable Index</div>
                  <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block border"></span> Moderate Gaps</div>
                  <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block border"></span> Critical Deficit</div>
                </div>
              )}
            </div>
          )}

          {/* Local Overlay Selection Control Panel */}
          {mapScope === "constituency" && (
            <div className="absolute top-2 right-2 flex flex-col gap-1 bg-white/95 border border-slate-200 rounded-lg p-1.5 shadow-md z-20">
              {[
                { type: "submissions", label: "Grievance Hotspots" },
                { type: "road", label: "Road Quality" },
                { type: "hospital", label: "Hospital Dist" },
                { type: "school", label: "School Ratio" }
              ].map(opt => (
                <button
                  key={opt.type}
                  onClick={() => setOverlayType(opt.type)}
                  className={`text-[9px] font-bold px-2 py-1 rounded text-left transition-all ${
                    overlayType === opt.type
                      ? "bg-slate-100 text-brand-navy"
                      : "text-slate-500 hover:text-brand-navy"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ward Info Details Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm border-t-4 border-brand-navy">
        {selectedWardDetails ? (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-extrabold text-brand-saffron uppercase tracking-wider">Village LGD Profile (ग्राम प्रोफ़ाइल)</span>
              <h3 className="font-extrabold text-base text-brand-navy mt-0.5">{selectedWardDetails.name}</h3>
            </div>

            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Total Population</span>
                <span className="font-extrabold text-slate-800">{selectedWardDetails.population.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Literacy Rate</span>
                <span className="font-extrabold text-slate-800">{selectedWardDetails.literacy_rate}%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Road Quality Index</span>
                <span className={`font-extrabold ${selectedWardDetails.road_quality_index < 0.5 ? "text-red-655" : "text-emerald-700"}`}>
                  {selectedWardDetails.road_quality_index} / 1.0
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Nearest Hospital</span>
                <span className={`font-extrabold ${selectedWardDetails.distance_to_nearest_hospital_km > 8 ? "text-red-655" : "text-emerald-700"}`}>
                  {selectedWardDetails.distance_to_nearest_hospital_km} km
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">School Enrollment Ratio</span>
                <span className={`font-extrabold ${selectedWardDetails.school_enrollment_ratio < 75 ? "text-red-655" : "text-emerald-700"}`}>
                  {selectedWardDetails.school_enrollment_ratio}%
                </span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1 text-xs text-slate-600">
              <span className="font-extrabold flex items-center gap-1 text-[10px] text-brand-navy uppercase tracking-wide">
                <Info className="h-3.5 w-3.5 text-brand-saffron shrink-0" /> Infrastructure Gap Synopsis
              </span>
              <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
                {String(selectedWardDetails.id) === "472592" && "Detected location. Favorable school enrollment but experiences severe water fluorosis and primary school facility repair needs."}
                {String(selectedWardDetails.id) === "472999" && "Potholes on the main road causing danger for children travel. Exists in local plan for upgrade."}
                {String(selectedWardDetails.id) === "472593" && "Sanitation leaks and drinking water pipeline gaps reported. Stable literacy but lacks community clinics."}
                {String(selectedWardDetails.id) === "472594" && "School building expansion requested. Road index is moderate but travel to local health centers exceeds 7km."}
                {String(selectedWardDetails.id) === "4" && "Indore Municipal Ward 4. Highly populated urban area with stable connectivity but requires electricity transformers maintenance."}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <Compass className="h-10 w-10 text-slate-300 shrink-0" />
            <p className="font-extrabold text-sm text-brand-navy uppercase tracking-wider">No Region Selected</p>
            <p className="text-xs text-text-muted">Click any region on the local village map to load demographic datasets and LGD village reports.</p>
          </div>
        )}

        {selectedWardId && (
          <button
            onClick={() => onSelectWard(null)}
            className="w-full mt-5 bg-slate-50 hover:bg-slate-100 text-brand-navy font-extrabold py-2 px-3 rounded-lg border border-slate-300 text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            Clear Map Filter
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

    </div>
  );
}
