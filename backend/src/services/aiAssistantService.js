const axios = require('axios');

class AIAssistantService {
  constructor() {
    this.defaultGroqModel = 'llama-3.1-8b-instant';
    this.defaultOpenRouterModel = 'meta-llama/llama-3.3-70b-instruct';
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
  }

  /**
   * Resolve active API Key & Provider
   */
  resolveConfig(clientApiKey, clientProvider) {
    let provider = clientProvider;
    let apiKey = clientApiKey;

    if (!provider) {
      if (process.env.GEMINI_API_KEY) {
        provider = 'gemini';
        apiKey = process.env.GEMINI_API_KEY;
      } else if (process.env.OPENROUTER_API_KEY) {
        provider = 'openrouter';
        apiKey = process.env.OPENROUTER_API_KEY;
      } else {
        provider = 'groq';
        apiKey = process.env.GROQ_API_KEY || '';
      }
    } else if (!apiKey) {
      if (provider === 'gemini') apiKey = process.env.GEMINI_API_KEY || '';
      else if (provider === 'openrouter') apiKey = process.env.OPENROUTER_API_KEY || '';
      else apiKey = process.env.GROQ_API_KEY || '';
    }

    return { provider, apiKey };
  }

  /**
   * Stage 1: AI Incident Understanding & Clarification Formulation
   */
  async understandIncident(params) {
    const { issue = '', title = '', location = '', clientApiKey = '', clientProvider = '' } = params;
    const cleanIssue = (issue || '').trim();

    // 1. Fetch base understanding from ultra-fast local ML microservice (10ms)
    let mlUnderstanding = null;
    try {
      const mlRes = await axios.post(`${this.mlServiceUrl}/understand-incident`, {
        text: cleanIssue,
        title: title || ''
      }, { timeout: 1500 });
      if (mlRes.data && mlRes.data.structured_incident) {
        return {
          success: true,
          structured_incident: mlRes.data.structured_incident,
          is_vague: Boolean(mlRes.data.is_vague),
          clarification_questions: mlRes.data.clarification_questions || [],
          source: 'CivicPulse ML Incident Engine (Instant)'
        };
      }
    } catch (e) {
      // ML microservice fallback heuristic
    }

    // 2. If ML microservice was offline, check if LLM key is available
    const { provider, apiKey } = this.resolveConfig(clientApiKey, clientProvider);
    if (apiKey && cleanIssue) {
      try {
        let endpoint = provider === 'openrouter' 
          ? 'https://openrouter.ai/api/v1/chat/completions' 
          : 'https://api.groq.com/openai/v1/chat/completions';

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };
        if (provider === 'openrouter') {
          headers['HTTP-Referer'] = 'http://localhost:3000';
          headers['X-Title'] = 'CivicPulse AI Incident Understanding';
        }

        const systemPrompt = `You are CivicPulse AI Complaint Understanding Assistant.
Your mission is to understand civic incidents deeply, extract structured facts, and identify if crucial operational details are missing.

CRITICAL INSTRUCTIONS:
1. STRICT FACTUAL ACCURACY: Populate fields ONLY when supported by citizen input. NEVER invent facts, names, dates, or places. Use null for unknown information.
2. VAGUE COMPLAINT POLICY:
   - If citizen entered a vague complaint (e.g. "The road is damaged", "Power cut", "Water problem", "Sewage leaking"):
     Set "is_vague": true.
     Ask up to 3 relevant, highly specific clarification questions (e.g. "Where is the damaged road located?", "Are there potholes, cracks, or a collapsed section?", "Is there an ongoing hazard for vehicles or pedestrians?").
   - If the complaint is ALREADY clear and detailed:
     Set "is_vague": false and leave "clarification_questions": []. Do NOT ask unnecessary questions.
3. Output MUST be ONLY valid JSON matching this schema:
{
  "incident_type": string or null,
  "incident_subtype": string or null,
  "incident_summary": string or null,
  "reported_location": string or null,
  "incident_date": string or null,
  "affected_people": string or null,
  "visible_damage": string or null,
  "immediate_danger": string or null,
  "requested_action": string or null,
  "missing_information": string[],
  "uncertainties": string[],
  "is_vague": boolean,
  "clarification_questions": string[]
}`;

        const userPrompt = `Analyze this citizen input:
Citizen input: "${cleanIssue}"
${location ? `Location provided: "${location}"` : 'Location: Not provided'}

Return the JSON object now.`;

        const resp = await axios.post(endpoint, {
          model: provider === 'openrouter' ? this.defaultOpenRouterModel : this.defaultGroqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 800,
          response_format: { type: 'json_object' }
        }, { headers, timeout: 2500 });

        const raw = resp?.data?.choices?.[0]?.message?.content;
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            success: true,
            structured_incident: parsed,
            is_vague: Boolean(parsed.is_vague),
            clarification_questions: parsed.clarification_questions || [],
            source: 'LLM Deep Incident Understanding'
          };
        }
      } catch (err) {
        console.warn('[AIAssistantService] Deep LLM incident understanding failed, using ML service output:', err.message);
      }
    }

    const words = cleanIssue.split(/\s+/).filter(Boolean);
    const isVague = words.length < 8;
    return {
      success: true,
      structured_incident: mlUnderstanding?.structured_incident || {
        incident_type: 'Civic Service Issue',
        incident_summary: cleanIssue.slice(0, 100),
        is_vague: isVague,
        clarification_questions: isVague ? [
          'Where exactly is the incident located (street, landmark, or district)?',
          'What specific damage or issue is visible?',
          'Is there an immediate safety danger to vehicles or pedestrians?'
        ] : []
      },
      is_vague: mlUnderstanding ? Boolean(mlUnderstanding.is_vague) : isVague,
      clarification_questions: mlUnderstanding?.clarification_questions || (isVague ? [
        'Where exactly is the incident located (street, landmark, or district)?',
        'What specific damage or issue is visible?',
        'Is there an immediate safety danger to vehicles or pedestrians?'
      ] : []),
      source: 'CivicPulse ML Incident Engine (Fallback)'
    };
  }

  /**
   * Stage 1: Generate Professional Factual Complaint Description (Without Hallucinations)
   */
  async draftComplaint(params) {
    const {
      issue = '',
      location = '',
      isHazardous = 'No',
      hazardDetails = '',
      affectedEstimate = 50,
      locationType = 'Residential',
      clarificationAnswers = {},
      clientApiKey = '',
      clientProvider = ''
    } = params;

    const { provider, apiKey } = this.resolveConfig(clientApiKey, clientProvider);

    const systemPrompt = `You are CivicPulse AI Complaint Drafting Assistant for public administration.
Your role is to help citizens formulate a clear, professional, factual, and editable complaint description based strictly on the citizen's actual words.

STRICT GROUNDING & ZERO-HALLUCINATION RULES:
1. NEVER INVENT FACTS:
   - Do NOT invent or assume any location, street, landmark, or district unless explicitly provided by the citizen.
   - Do NOT invent dates, times, financial amounts, transaction IDs, or names.
   - Do NOT invent causes, negligence, or claims of official verification.
   - Do NOT claim that authorities have already inspected or verified the site.
2. DOMAIN-SPECIFIC FORMULATION:
   - For Cyber Crime / Financial Fraud (e.g. UPI fraud, banking scam, phishing):
     Frame it clearly as a financial cybercrime grievance. If details are minimal, state what is reported without filler:
     Example for "UPI fraud":
     "I am reporting a suspected fraudulent UPI transaction. Kindly guide me through the appropriate cybercrime reporting process and review transaction logs upon submission."
     Example for "I sent ₹5,000 through UPI but the transaction was fraudulent":
     "I am reporting a suspected UPI-related financial fraud involving a transaction of ₹5,000. Kindly review the complaint and guide me through the appropriate cybercrime reporting process."
   - For Physical Civic Issues (e.g. potholes, broken swing, blocked drain, water leak):
     Focus on the visible physical defect and public safety condition.
3. FORBIDDEN BOILERPLATE:
   - NEVER generate generic phrases such as:
     "A civic problem has been reported regarding..."
     "The issue is causing persistent inconvenience and potential disruption to local residents."
     "The concerned authority is requested to inspect the reported site, verify the ground reality..."
   - Write natural, professional, direct administrative prose.

Respond ONLY with valid JSON:
{
  "title": "A concise, specific title (e.g. 'Suspected Fraudulent UPI Transaction')",
  "description": "The concise, professional, factual complaint description",
  "department": "Appropriate 30-department name (e.g. 'Cyber Crime', 'Roads & Public Works', 'Parks & Public Spaces')",
  "subcategory": "Appropriate subcategory name"
}`;

    let clarificationContext = '';
    if (clarificationAnswers && Object.keys(clarificationAnswers).length > 0) {
      clarificationContext = '\nCitizen Clarifications:\n' +
        Object.entries(clarificationAnswers)
          .filter(([_, ans]) => ans && ans.trim())
          .map(([q, ans]) => `  ${q}: ${ans.trim()}`)
          .join('\n');
    }

    const userPrompt = `Citizen Input: "${issue}"
${location ? `Location: "${location}"` : 'Location: Not specified (do NOT invent any place name)'}
Life Safety Hazard: ${isHazardous} ${hazardDetails ? `(${hazardDetails})` : ''}
${clarificationContext}

Produce the JSON object now.`;

    if (apiKey) {
      try {
        if (provider === 'gemini') {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
          const geminiRes = await axios.post(
            geminiUrl,
            {
              contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
            },
            { timeout: 7000 }
          );

          const geminiText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (geminiText) {
            const parsed = JSON.parse(geminiText);
            return {
              success: true,
              source: 'CivicPulse Gemini Intelligence',
              model: 'gemini-3.5-flash-lite',
              title: parsed.title,
              description: parsed.description || parsed.formal_description,
              department: parsed.department || 'Cyber Crime',
              subcategory: parsed.subcategory || 'General',
              priority: isHazardous === 'Yes' ? 'CRITICAL' : 'HIGH',
              is_emergency: isHazardous === 'Yes',
              original_input: issue
            };
          }
        } else {
          let endpoint = provider === 'openrouter'
            ? 'https://openrouter.ai/api/v1/chat/completions'
            : 'https://api.groq.com/openai/v1/chat/completions';

          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          };
          if (provider === 'openrouter') {
            headers['HTTP-Referer'] = 'http://localhost:3000';
            headers['X-Title'] = 'CivicPulse AI Complaint Assistant';
          }

          const modelsToTry = provider === 'openrouter'
            ? [params.model || this.defaultOpenRouterModel]
            : [params.model, 'llama-3.1-8b-instant', 'llama-3.3-70b-versatile'].filter(Boolean);

          let response = null;
          let usedModel = modelsToTry[0];

          for (const m of modelsToTry) {
            try {
              usedModel = m;
              response = await axios.post(
                endpoint,
                {
                  model: m,
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                  ],
                  temperature: 0.2,
                  max_tokens: 1024,
                  response_format: { type: 'json_object' }
                },
                { headers, timeout: 4000 }
              );
              if (response?.data?.choices?.[0]?.message?.content) break;
            } catch (modelErr) {
              response = null;
              if (modelErr.response && (modelErr.response.status === 404 || modelErr.response.status === 401)) {
                break;
              }
            }
          }

          const content = response?.data?.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            return {
              success: true,
              source: provider === 'openrouter' ? 'OpenRouter LLM' : `Groq AI (${usedModel.replace('openai/', '')})`,
              model: usedModel,
              title: parsed.title,
              description: parsed.description || parsed.formal_description,
              department: parsed.department || 'Municipal Administration',
              priority: parsed.priority || (isHazardous === 'Yes' ? 'CRITICAL' : 'HIGH'),
              is_emergency: isHazardous === 'Yes' || parsed.priority === 'CRITICAL',
              original_input: issue
            };
          }
        }
      } catch (err) {
        console.warn('[AIAssistantService] Real LLM request failed, falling back to grounded NLP:', err.message);
      }
    }

    return this.generateSmartFallback({
      issue,
      location,
      isHazardous,
      hazardDetails,
      affectedEstimate,
      locationType,
      clarificationAnswers
    });
  }

  generateSmartFallback(opts) {
    const { issue = '', location = '', isHazardous = 'No', hazardDetails = '', clarificationAnswers = {} } = opts;
    const cleanIssue = issue.trim();
    const issueLower = cleanIssue.toLowerCase();

    let dept = 'Public Grievance / General Admin';
    let subcat = 'General Civic Issue';
    let title = `Civic Grievance: ${cleanIssue.slice(0, 50)}`;
    let desc = '';

    // Grounded domain-specific synthesis without generic filler sentences
    if (/\b(upi|cyber|phishing|otp|scam|fraud|hacked|banking fraud|transaction|debit card|credit card)\b/i.test(cleanIssue)) {
      dept = 'Cyber Crime';
      subcat = 'UPI / Digital Payment Fraud';
      title = `Suspected Financial / Cyber Fraud: ${cleanIssue.slice(0, 50)}`;
      desc = `I am reporting a suspected fraudulent transaction / cybercrime incident involving: ${cleanIssue}. Kindly review the complaint, record the incident details, and guide me on the formal cybercrime verification process.`;
    } else if (/\b(pothole|crater|damaged road|road broken|asphalt)\b/i.test(cleanIssue)) {
      dept = 'Roads & Public Works';
      subcat = 'Pothole / Surface Crater';
      title = `Road Surface Damage: ${cleanIssue.slice(0, 50)}`;
      desc = `A road surface defect / pothole has been reported regarding: ${cleanIssue}${location ? ' located at ' + location : ''}. Kindly arrange a physical inspection and necessary asphalt repair.`;
    } else if (/\b(swing|park|playground|bench)\b/i.test(cleanIssue)) {
      dept = 'Parks & Public Spaces';
      subcat = 'Damaged Children Swings / Play Equipment';
      title = `Damaged Park / Playground Equipment: ${cleanIssue.slice(0, 50)}`;
      desc = `Deteriorated or damaged public playground equipment has been reported: ${cleanIssue}${location ? ' at ' + location : ''}. Kindly arrange safety inspection and necessary structural repairs.`;
    } else if (/\b(fire|blaze|cylinder explosion|gas leak)\b/i.test(cleanIssue)) {
      dept = 'Fire & Emergency Services';
      subcat = 'Residential Structure Fire';
      title = `Emergency Fire Hazard: ${cleanIssue.slice(0, 50)}`;
      desc = `An urgent fire / smoke emergency has been reported: ${cleanIssue}${location ? ' at ' + location : ''}. Immediate dispatch and safety cordon required.`;
    } else if (/\b(drain|sewer|manhole|waterlogging)\b/i.test(cleanIssue)) {
      dept = 'Drainage & Sewerage';
      subcat = 'Blocked / Clogged Drain';
      title = `Drainage / Sewerage Issue: ${cleanIssue.slice(0, 50)}`;
      desc = `A drainage blockage / sewage overflow condition is reported: ${cleanIssue}${location ? ' at ' + location : ''}. Remedial desilting and maintenance requested.`;
    } else if (/\b(water|tap|drinking water|pipeline)\b/i.test(cleanIssue)) {
      dept = 'Water Supply';
      subcat = 'Contaminated / Muddy Drinking Water';
      title = `Water Supply Grievance: ${cleanIssue.slice(0, 50)}`;
      desc = `A drinking water supply condition has been reported: ${cleanIssue}${location ? ' at ' + location : ''}. Water quality sampling and supply restoration requested.`;
    } else {
      desc = `A grievance has been submitted regarding: ${cleanIssue}${location ? ' at ' + location : ''}. Kindly review the reported issue and assign the relevant field unit for verification.`;
    }

    if (isHazardous === 'Yes' || hazardDetails) {
      desc += ` Active safety hazard noted: ${hazardDetails || 'immediate hazard present'}.`;
    }

    return {
      success: true,
      source: 'CivicPulse Grounded Synthesis Engine',
      model: 'Built-in Contextual NLP',
      title,
      description: desc,
      department: dept,
      subcategory: subcat,
      priority: isHazardous === 'Yes' ? 'CRITICAL' : 'HIGH',
      is_emergency: isHazardous === 'Yes',
      original_input: cleanIssue
    };
  }
}

module.exports = new AIAssistantService();
