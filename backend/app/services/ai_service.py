import os
import hashlib
import re
from typing import List, Dict, Any, Tuple
import requests

# Load API keys if present
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

class AIServiceAdapter:
    """Pluggable, provider-agnostic adapter for Speech-to-Text, Translation, Embeddings, and LLM classification."""

    @staticmethod
    def speech_to_text(audio_content: bytes, filename: str = "voice.mp3") -> str:
        """Transcribe audio bytes to text."""
        if OPENAI_API_KEY:
            try:
                # Call OpenAI Whisper
                headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
                files = {"file": (filename, audio_content, "audio/mpeg")}
                data = {"model": "whisper-1"}
                response = requests.post("https://api.openai.com/v1/audio/transcriptions", headers=headers, files=files, data=data)
                if response.status_code == 200:
                    return response.json().get("text", "")
            except Exception as e:
                print(f"OpenAI Whisper error, falling back to mock: {e}")
        
        # Mock STT fallback
        # Detect some mock text depending on the size or random hash of the file
        h = hashlib.md5(audio_content).hexdigest()
        val = int(h, 16) % 3
        if val == 0:
            return "हाथ जोड़कर निवेदन है कि हमारे गाँव ४ में कोई अस्पताल नहीं है। बीमार पड़ने पर १५ किलोमीटर दूर जाना पड़ता है।"
        elif val == 1:
            return "Necesitamos agua limpia en el Village 2 porque los pozos están secos."
        else:
            return "The bridge near the river junction is breaking and is very dangerous."

    @staticmethod
    def translate_to_english(text: str) -> Tuple[str, str]:
        """Detects language and translates to English. Returns (translated_text, detected_lang)."""
        # Heuristic detection for Mock
        detected_lang = "en"
        translated_text = text

        # Check for Hindi characters
        if re.search(r"[\u0900-\u097f]", text):
            detected_lang = "hi"
            # Simple mock translations for seeded/test inputs
            if "अस्पताल" in text or "स्वास्थ्य" in text:
                translated_text = "It is a humble request that there is no hospital in our Village 4. If someone falls sick, we have to travel 15 kilometers."
            elif "सड़क" in text or "रास्ता" in text:
                translated_text = "The roads in Village 3 are completely broken and full of mud."
            else:
                translated_text = "This is a translated message from Hindi requesting development assistance."
        # Check for Spanish keywords
        elif any(w in text.lower() for w in ["necesitamos", "agua", "limpia", "pozo", "camino", "escuela", "enferman"]):
            detected_lang = "es"
            if "agua" in text or "pozo" in text:
                translated_text = "We need clean water in Village 2. The current well is contaminated and children are constantly getting sick."
            elif "camino" in text or "calle" in text:
                translated_text = "The street in Village 4 needs repair, it is completely damaged."
            else:
                translated_text = "This is a translated message from Spanish requesting local updates."
        
        # If real APIs are available:
        if OPENAI_API_KEY and detected_lang != "en":
            try:
                headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
                payload = {
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {"role": "system", "content": "You are a professional translator. Translate the text to English. Output JSON like: {\"translated_text\": \"...\", \"detected_language\": \"...\"}"},
                        {"role": "user", "content": text}
                    ],
                    "response_format": {"type": "json_object"}
                }
                response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
                if response.status_code == 200:
                    res_json = response.json()["choices"][0]["message"]["content"]
                    import json
                    parsed = json.loads(res_json)
                    return parsed.get("translated_text", text), parsed.get("detected_language", detected_lang)
            except Exception as e:
                print(f"OpenAI translation error: {e}")

        return translated_text, detected_lang

    @staticmethod
    def generate_embedding(text: str) -> List[float]:
        """Generate a 1536-dimension embedding list."""
        if OPENAI_API_KEY:
            try:
                headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
                payload = {"input": text, "model": "text-embedding-ada-002"}
                response = requests.post("https://api.openai.com/v1/embeddings", headers=headers, json=payload)
                if response.status_code == 200:
                    return response.json()["data"][0]["embedding"]
            except Exception as e:
                print(f"OpenAI embedding error: {e}")

        # Mock embedding: generate a deterministic 1536-float vector based on text
        # This allows clustering algorithms to group them if they have similar words
        h = hashlib.sha256(text.lower().encode('utf-8')).hexdigest()
        # Seed float generator based on hash
        seed = int(h[:8], 16)
        
        # Create a vector where specific keywords activate specific dimensions
        vector = [0.01] * 1536
        # Let's assign specific index triggers to sectors to force clustering
        if "road" in text.lower() or "pothole" in text.lower() or "calle" in text.lower() or "camino" in text.lower() or "bridge" in text.lower():
            # Roads
            for idx in range(10, 50):
                vector[idx] = 0.8
        if "water" in text.lower() or "well" in text.lower() or "agua" in text.lower() or "fluoride" in text.lower():
            # Water
            for idx in range(60, 100):
                vector[idx] = 0.8
        if "hospital" in text.lower() or "clinic" in text.lower() or "sick" in text.lower() or "health" in text.lower() or "médico" in text.lower() or "स्वास्थ्य" in text.lower() or "अस्पताल" in text.lower():
            # Health
            for idx in range(110, 150):
                vector[idx] = 0.8
        if "school" in text.lower() or "education" in text.lower() or "escuela" in text.lower() or "desk" in text.lower() or "classroom" in text.lower():
            # Education
            for idx in range(160, 200):
                vector[idx] = 0.8
        if "power" in text.lower() or "electricity" in text.lower() or "transformer" in text.lower() or "outage" in text.lower():
            # Electricity
            for idx in range(210, 250):
                vector[idx] = 0.8
        if "sewage" in text.lower() or "drain" in text.lower() or "sanitation" in text.lower() or "odor" in text.lower() or "smell" in text.lower():
            # Sanitation
            for idx in range(260, 300):
                vector[idx] = 0.8

        # Normalize the vector
        sq_sum = sum(x*x for x in vector)
        norm = sq_sum ** 0.5
        return [x / norm for x in vector]

    @staticmethod
    def classify_and_tag(text: str) -> Dict[str, Any]:
        """Classify sector and extract metadata."""
        text_lower = text.lower()
        
        # Sector matching
        sector = "other"
        if any(w in text_lower for w in ["road", "pothole", "bridge", "street", "highway", "paving", "calle", "camino"]):
            sector = "roads"
        elif any(w in text_lower for w in ["water", "well", "drinking", "borewell", "fluoride", "filtration", "pipe", "agua"]):
            sector = "water"
        elif any(w in text_lower for w in ["hospital", "clinic", "health", "doctor", "medicine", "sick", "médico", "स्वास्थ्य", "अस्पताल"]):
            sector = "health"
        elif any(w in text_lower for w in ["school", "education", "teacher", "desk", "classroom", "student", "escuela", "estudiar"]):
            sector = "education"
        elif any(w in text_lower for w in ["electricity", "power", "light", "transformer", "outage", "generator"]):
            sector = "electricity"
        elif any(w in text_lower for w in ["sewage", "drain", "garbage", "waste", "trash", "sanitation", "toilet"]):
            sector = "sanitation"

        # Urgency/intensity (between 0.0 and 1.0)
        intensity = 0.3
        if any(w in text_lower for w in ["urgent", "dangerous", "hazard", "immediately", "accident", "slip", "broke", "leaking", "contaminate"]):
            intensity = 0.8
        elif "please" in text_lower or "request" in text_lower or "निवेदन" in text_lower:
            intensity = 0.5
        
        # Check if exclamation or uppercase is present
        if "!" in text or text.isupper():
            intensity = min(1.0, intensity + 0.15)

        return {
            "sector": sector,
            "intensity": intensity
        }

    @staticmethod
    def analyze_photo(photo_content: bytes, filename: str = "photo.jpg") -> List[str]:
        """Analyze an uploaded photo and return descriptive tags representing infrastructure conditions."""
        # Mock tags
        h = hashlib.md5(photo_content).hexdigest()
        val = int(h, 16) % 4
        if val == 0:
            return ["damaged road", "pothole", "water logging"]
        elif val == 1:
            return ["sewage leakage", "refuse dump", "sanitation hazard"]
        elif val == 2:
            return ["deteriorating facility", "structural cracks", "classroom damage"]
        else:
            return ["pipe leakage", "unclean water source", "infrastructure failure"]
