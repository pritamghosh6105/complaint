/**
 * CivicPulse AI - Multilingual Normalization & Emergency Detection Service
 * Supports English, Bengali (বাংলা), and Hindi (हिन्दी)
 */

// Common civic terminology transliteration / translation dictionary
const MULTILINGUAL_DICTIONARY = [
  // Roads & Transport
  { bn: 'রাস্তা', hi: 'सड़क', en: 'road' },
  { bn: 'রাস্তার', hi: 'सड़क का', en: 'road' },
  { bn: 'গর্ত', hi: 'गड्ढा', en: 'pothole crater' },
  { bn: 'ভাঙা রাস্তা', hi: 'टूटी सड़क', en: 'damaged road asphalt' },
  { bn: 'পিচ', hi: 'डामर', en: 'tar asphalt' },
  { bn: 'ফুটপাথ', hi: 'फुटपाथ', en: 'footpath sidewalk' },
  { bn: 'যানজট', hi: 'ट्रैफिक जाम', en: 'traffic congestion' },
  { bn: 'ট্রাফিক সিগন্যাল', hi: 'ट्रैफिक सिग्नल', en: 'traffic signal red light' },
  { bn: 'বাস স্টপ', hi: 'बस स्टॉप', en: 'bus stop shelter' },
  { bn: 'স্পিড ব্রেকার', hi: 'स्पीड ब्रेकर', en: 'speed breaker hump' },

  // Waste Management & Cleanliness
  { bn: 'আবর্জনা', hi: 'कचरा', en: 'garbage waste trash' },
  { bn: 'ময়লা', hi: 'गंदगी', en: 'filth dirt waste' },
  { bn: 'ডাস্টবিন', hi: 'कूड़ेदान', en: 'dustbin garbage bin' },
  { bn: 'পচা গন্ধ', hi: 'बदबू', en: 'stench foul odor decomposing' },
  { bn: 'মৃত পশু', hi: 'मरा हुआ जानवर', en: 'dead animal carcass' },
  { bn: 'প্লাস্টিক বর্জ্য', hi: 'प्लास्टिक कचरा', en: 'plastic dumping waste' },

  // Drainage & Sewerage
  { bn: 'নর্দমা', hi: 'नाली', en: 'drain gutter drainage' },
  { bn: 'ড্রেন', hi: 'नाली', en: 'drain sewer drainage' },
  { bn: 'ম্যানহোল', hi: 'मैनहोल', en: 'manhole open cover' },
  { bn: 'জল জমা', hi: 'जलभराव', en: 'waterlogging flooded street' },
  { bn: 'জল জমে', hi: 'पानी भरा', en: 'waterlogged inundation' },
  { bn: 'পয়ঃপ্রণালী', hi: 'सीवेज', en: 'sewage overflow blockage' },
  { bn: 'ড্রেন উপচে পড়ছে', hi: 'नाली उफान', en: 'drain overflowing' },

  // Water Supply
  { bn: 'জল সরবরাহ', hi: 'जल आपूर्ति', en: 'water supply' },
  { bn: 'পানীয় জল', hi: 'पीने का पानी', en: 'drinking water pipeline' },
  { bn: 'পাইপ ফেটে গেছে', hi: 'पाइप फटा', en: 'pipeline burst leakage' },
  { bn: 'জলের পাইপ', hi: 'पानी का पाइप', en: 'water pipe leak' },
  { bn: 'নোংরা জল', hi: 'गंदा पानी', en: 'contaminated polluted water' },
  { bn: 'ট্যাপের জল', hi: 'नल का पानी', en: 'tap water tanker' },

  // Electricity & Streetlight
  { bn: 'বিদ্যুৎ', hi: 'बिजली', en: 'electricity power current' },
  { bn: 'রাস্তার আলো', hi: 'स्ट्रीट लाइट', en: 'streetlight lamp pole' },
  { bn: 'অন্ধকার', hi: 'अंधेरा', en: 'darkness blackout streetlight' },
  { bn: 'ছেঁড়া তার', hi: 'टूटा तार', en: 'loose wire open electrical sparking' },
  { bn: 'ট্রান্সফরমার', hi: 'ट्रांसफार्मर', en: 'transformer power outage' },
  { bn: 'শর্ট সার্কিট', hi: 'शॉर्ट सर्किट', en: 'short circuit sparking fire hazard' },

  // Public Health & Sanitation
  { bn: 'হাসপাতাল', hi: 'अस्पताल', en: 'hospital clinic swasthya' },
  { bn: 'অ্যাম্বুলেন্স', hi: 'एम्बुलेंस', en: 'ambulance emergency medical' },
  { bn: 'মশা', hi: 'मच्छर', en: 'mosquito dengue fogging' },
  { bn: 'ডেঙ্গু', hi: 'डेंगू', en: 'dengue malaria mosquito outbreak' },
  { bn: 'পাবলিক টয়লেট', hi: 'सार्वजनिक शौचालय', en: 'public toilet urinal hygiene' },
  { bn: 'ডাক্তার নেই', hi: 'डॉक्टर नहीं', en: 'doctor hospital clinic medical' },

  // Law, Crime & Women Safety
  { bn: 'পুলিশ', hi: 'पुलिस', en: 'police station law' },
  { bn: 'চুরি', hi: 'चोरी', en: 'theft burglary stolen' },
  { bn: 'ছিনতাই', hi: 'लूटपाट', en: 'snatching robbery mugging' },
  { bn: 'ইভটিজিং', hi: 'छेड़छाड़', en: 'harassment women safety stalking' },
  { bn: 'মহিলাদের নিরাপত্তা', hi: 'महिला सुरक्षा', en: 'women safety harassment' },
  { bn: 'সাইবার ক্রাইম', hi: 'साइबर अपराध', en: 'cyber crime online scam fraud upi hack' },
  { bn: 'জালিয়াতি', hi: 'धोखाधड़ी', en: 'fraud scam unauthorized transaction' },

  // Fire & Disaster
  { bn: 'আগুন', hi: 'आग', en: 'fire flames blaze' },
  { bn: 'দমকল', hi: 'दमकल', en: 'fire brigade emergency' },
  { bn: 'বন্যা', hi: 'बाढ़', en: 'flood inundation waterlogging' },
  { bn: 'ঝড়', hi: 'तूफान', en: 'storm cyclone wind damage' },
  { bn: 'গাছ ভেঙে পড়েছে', hi: 'पेड़ गिर गया', en: 'fallen tree blocking road' }
];

// High-Severity Emergency Triggers in 3 languages
const EMERGENCY_TRIGGERS = [
  // Bengali
  { phrase: 'আগুন লেগেছে', category: 'Fire & Emergency Services', severity: 'CRITICAL', helpline: '101 / 112' },
  { phrase: 'আগুন', category: 'Fire & Emergency Services', severity: 'CRITICAL', helpline: '101 / 112' },
  { phrase: 'সিলিন্ডার বিস্ফোরণ', category: 'Fire & Emergency Services', severity: 'CRITICAL', helpline: '101 / 112' },
  { phrase: 'বিদ্যুতের তার ছিঁড়ে', category: 'Electricity & Power', severity: 'CRITICAL', helpline: '1912 / 112' },
  { phrase: 'কারেন্ট লেগে', category: 'Electricity & Power', severity: 'CRITICAL', helpline: '1912 / 112' },
  { phrase: 'প্রাণহানি', category: 'Public Health & Sanitation', severity: 'CRITICAL', helpline: '108 / 112' },
  { phrase: 'বিপন্ন', category: 'Disaster Management', severity: 'CRITICAL', helpline: '112' },
  { phrase: 'বাচ্চা বিপদে', category: 'Women & Child Safety', severity: 'CRITICAL', helpline: '1098 / 112' },
  { phrase: 'জল বাড়িতে ঢুকছে', category: 'Disaster Management', severity: 'CRITICAL', helpline: '1070 / 112' },
  { phrase: 'বাড়ি ভেঙে পড়েছে', category: 'Disaster Management', severity: 'CRITICAL', helpline: '112' },
  { phrase: 'গ্যাস লিক', category: 'Fire & Emergency Services', severity: 'CRITICAL', helpline: '101 / 112' },

  // Hindi
  { phrase: 'आग लग गई', category: 'Fire & Emergency Services', severity: 'CRITICAL', helpline: '101 / 112' },
  { phrase: 'आग लगी है', category: 'Fire & Emergency Services', severity: 'CRITICAL', helpline: '101 / 112' },
  { phrase: 'सिलेंडर ब्लास्ट', category: 'Fire & Emergency Services', severity: 'CRITICAL', helpline: '101 / 112' },
  { phrase: 'करंट लग गया', category: 'Electricity & Power', severity: 'CRITICAL', helpline: '1912 / 112' },
  { phrase: 'बिजली का तार टूटा', category: 'Electricity & Power', severity: 'CRITICAL', helpline: '1912 / 112' },
  { phrase: 'बच्चे खतरे में', category: 'Women & Child Safety', severity: 'CRITICAL', helpline: '1098 / 112' },
  { phrase: 'मकान गिर गया', category: 'Disaster Management', severity: 'CRITICAL', helpline: '112' },
  { phrase: 'पानी घरों में घुस रहा', category: 'Disaster Management', severity: 'CRITICAL', helpline: '1070 / 112' },
  { phrase: 'गैस रिसाव', category: 'Fire & Emergency Services', severity: 'CRITICAL', helpline: '101 / 112' },

  // English
  { phrase: 'fire broke out', category: 'Fire & Emergency Services', severity: 'CRITICAL', helpline: '101 / 112' },
  { phrase: 'building fire', category: 'Fire & Emergency Services', severity: 'CRITICAL', helpline: '101 / 112' },
  { phrase: 'gas cylinder blast', category: 'Fire & Emergency Services', severity: 'CRITICAL', helpline: '101 / 112' },
  { phrase: 'live wire sparking', category: 'Electricity & Power', severity: 'CRITICAL', helpline: '1912 / 112' },
  { phrase: 'electric shock', category: 'Electricity & Power', severity: 'CRITICAL', helpline: '1912 / 112' },
  { phrase: 'child in danger', category: 'Women & Child Safety', severity: 'CRITICAL', helpline: '1098 / 112' },
  { phrase: 'trapped in building', category: 'Fire & Emergency Services', severity: 'CRITICAL', helpline: '101 / 112' },
  { phrase: 'wall collapsed', category: 'Disaster Management', severity: 'CRITICAL', helpline: '112' },
  { phrase: 'water entering houses', category: 'Disaster Management', severity: 'CRITICAL', helpline: '1070 / 112' },
  { phrase: 'gas leak', category: 'Fire & Emergency Services', severity: 'CRITICAL', helpline: '101 / 112' }
];

/**
 * Detects the script/language of the input text
 */
function detectLanguage(text = '') {
  if (!text) return 'en';
  // Check Bengali Unicode range (\u0980 - \u09FF)
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';
  // Check Devanagari Unicode range (\u0900 - \u097F)
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  return 'en';
}

/**
 * Normalizes Bengali or Hindi text to include English keywords for NLP classification
 */
function normalizeToEnglish(text = '') {
  if (!text) return '';
  const lang = detectLanguage(text);
  let normalizedText = text;
  let translatedTerms = [];

  MULTILINGUAL_DICTIONARY.forEach(item => {
    if (lang === 'bn' && item.bn && text.includes(item.bn)) {
      translatedTerms.push(item.en);
    } else if (lang === 'hi' && item.hi && text.includes(item.hi)) {
      translatedTerms.push(item.en);
    }
  });

  if (translatedTerms.length > 0) {
    normalizedText = `${text} [keywords: ${translatedTerms.join(' ')}]`;
  }

  return {
    originalText: text,
    normalizedText,
    detectedLanguage: lang,
    detectedKeywords: translatedTerms
  };
}

/**
 * Scans text for life-safety emergency triggers in Bengali, Hindi, and English
 */
function detectEmergency(text = '') {
  if (!text) return { isEmergency: false };
  const lower = text.toLowerCase();

  for (const item of EMERGENCY_TRIGGERS) {
    if (lower.includes(item.phrase.toLowerCase()) || text.includes(item.phrase)) {
      return {
        isEmergency: true,
        triggerPhrase: item.phrase,
        category: item.category,
        severity: item.severity,
        helpline: item.helpline,
        guidance: `Urgent hazard detected: "${item.phrase}". Immediate intervention triggered with prioritized SLA. For immediate emergency response, call ${item.helpline}.`
      };
    }
  }

  return { isEmergency: false };
}

module.exports = {
  detectLanguage,
  normalizeToEnglish,
  detectEmergency,
  MULTILINGUAL_DICTIONARY,
  EMERGENCY_TRIGGERS
};
