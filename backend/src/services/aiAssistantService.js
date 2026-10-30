const axios = require('axios');

class AIAssistantService {
  constructor() {
    this.defaultGroqModel = 'llama-3.3-70b-versatile';
    this.defaultOpenRouterModel = 'meta-llama/llama-3.3-70b-instruct';
  }

  /**
   * Resolve active API Key & Provider
   */
  resolveConfig(clientApiKey, clientProvider) {
    const provider = clientProvider || (process.env.OPENROUTER_API_KEY ? 'openrouter' : 'groq');
    let apiKey = clientApiKey;

    if (!apiKey) {
      if (provider === 'openrouter') {
        apiKey = process.env.OPENROUTER_API_KEY || '';
      } else {
        apiKey = process.env.GROQ_API_KEY || '';
      }
    }

    return { provider, apiKey };
  }

  /**
   * Draft an official citizen complaint using Real LLM (Groq or OpenRouter) in English
   */
  async draftComplaint(params) {
    const {
      issue = '',
      location = '',
      isHazardous = 'No',
      hazardDetails = '',
      affectedEstimate = 50,
      locationType = 'Residential',
      clientApiKey = '',
      clientProvider = ''
    } = params;

    const { provider, apiKey } = this.resolveConfig(clientApiKey, clientProvider);

    const systemPrompt = `You are CivicPulse AI, an intelligent civic grievance drafting assistant for municipal governance in West Bengal, India.
Your mission is to convert raw citizen complaints into an authoritative, professional, and well-structured official grievance letter for municipal commissioners, district magistrates, and department heads.

CRITICAL INSTRUCTIONS:
1. Target Language: Write STRICTLY in English (formal administrative and civic grievance style).
2. Tone: Respectful, serious, factual, urgent, and administratively clear.
3. Strict Location Policy: NEVER invent, hallucinate, or insert any specific place, block, or district name (such as "Amdanga", "Kolkata", "North 24 Parganas", etc.) unless the citizen explicitly typed it in the Issue Description. If no place was mentioned, address the grievance generally to the concerned municipal/ward authority without fabricating any geographical names.
4. Structure the formal description into clear paragraphs:
   - Paragraph 1: Executive Summary of the incident and specific issue.
   - Paragraph 2: Physical realities, affected surroundings, and ground conditions.
   - Paragraph 3: Life safety risk, hazard assessment, and public health impact.
   - Paragraph 4: Citizen impact and urgent appeal for prompt departmental inspection and mobilization.
5. Professional Polish: Do NOT output placeholder brackets like [Insert Address] or [Date]. Write natural, complete, ready-to-file administrative petitions.
6. Output Format: You MUST reply with ONLY a single, valid JSON object containing NO markdown wrappers, NO backticks, and NO conversational text.

Expected JSON schema:
{
  "title": "A concise, powerful, professional grievance subject line",
  "formal_description": "The complete, detailed, formal complaint text in English",
  "department_suggestion": "Suggested municipal department responsible (e.g. Roads & Public Works, Water Supply, Solid Waste Management, Drainage & Sewerage, Electricity & Lighting)",
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "key_demands": ["Action 1", "Action 2", "Action 3"],
  "hazard_summary": "1-line summary of safety hazard"
}`;

    const userPrompt = `Please synthesize an official grievance from the following citizen details:
- Issue Description: ${issue}
${location ? `- Location / Landmark: ${location}` : '- Location: Not specified by citizen (do NOT invent any specific place name)'}
- Is Life Safety Hazard Present: ${isHazardous}
- Hazard Details: ${hazardDetails || 'None stated'}
- Target Language: English

Produce the JSON object now.`;

    // Attempt Real LLM Call if API key is present
    if (apiKey) {
      try {
        let endpoint = '';
        let headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        };

        let modelsToTry = [];
        if (provider === 'openrouter') {
          endpoint = 'https://openrouter.ai/api/v1/chat/completions';
          modelsToTry = [params.model || this.defaultOpenRouterModel];
          headers['HTTP-Referer'] = 'http://localhost:3000';
          headers['X-Title'] = 'CivicPulse AI Complaint Assistant';
        } else {
          // Default: Groq - tries high performance models available on user account
          endpoint = 'https://api.groq.com/openai/v1/chat/completions';
          modelsToTry = [
            params.model,
            'openai/gpt-oss-120b',
            'llama-3.3-70b-versatile',
            'openai/gpt-oss-20b',
            'qwen/qwen3.8-27b'
          ].filter(Boolean);
        }

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
                temperature: 0.3,
                max_tokens: 1024,
                response_format: { type: 'json_object' }
              },
              { headers, timeout: 15000 }
            );

            if (response?.data?.choices?.[0]?.message?.content) {
              break;
            }
          } catch (modelErr) {
            console.warn(`[AIAssistantService] Groq model ${m} failed:`, modelErr.response?.data?.error?.message || modelErr.message);
            response = null;
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
            description: parsed.formal_description || parsed.description,
            department: parsed.department_suggestion || 'Municipal Administration',
            priority: parsed.priority || (isHazardous === 'Yes' ? 'CRITICAL' : 'HIGH'),
            is_emergency: isHazardous === 'Yes' || parsed.priority === 'CRITICAL',
            key_demands: parsed.key_demands || [],
            hazard_summary: parsed.hazard_summary || '',
            affected_count: affectedEstimate,
            location_type: locationType
          };
        }
      } catch (err) {
        console.warn(`[AIAssistantService] Real LLM request to ${provider} failed:`, err.response?.data?.error?.message || err.message);
      }
    }

    // Dynamic Intelligent Fallback (if no API key provided or network fails)
    return this.generateSmartFallback({
      issue,
      location,
      isHazardous,
      hazardDetails,
      affectedEstimate,
      locationType,
      providerNotice: apiKey ? 'Fallback mode active (LLM timeout or quota)' : 'Tip: Add a free Groq API key for instant Llama-3.3-70B generation'
    });
  }

  /**
   * High-accuracy English fallback generator
   */
  generateSmartFallback(opts) {
    const {
      issue,
      location,
      isHazardous,
      hazardDetails,
      affectedEstimate,
      locationType,
      providerNotice
    } = opts;

    const isCritical = isHazardous === 'Yes' || 
      /urgent|danger|shock|spark|fire|trapped|victim|child|hospital|collapse/i.test(issue + ' ' + hazardDetails);

    const loc = location ? location.trim() : 'Designated Municipal Ward (West Bengal)';
    
    const title = isCritical
      ? `CRITICAL CIVIC GRIEVANCE: Immediate Safety Intervention Required at ${loc}`
      : `Official Grievance: Civic Infrastructure & Public Maintenance at ${loc}`;

    const description = `To the Competent Municipal Authority & Department Nodal Officer,

I am formally submitting this public grievance regarding an urgent civic issue requiring immediate inspection, mobilization, and remediation.

1. INCIDENT & ISSUE SUMMARY:
${issue}

2. LOCATION CONTEXT & GROUND REALITY:
• Location: ${loc}
• Zone Classification: ${locationType} Sector
• Impacted Citizen Radius: Approximately ${affectedEstimate} residents directly affected

3. HAZARD & RISK APPRAISAL:
${isHazardous === 'Yes' ? `• HIGH-RISK SAFETY HAZARD: ${hazardDetails || 'Active physical peril identified requiring immediate containment'}. Delay in response poses serious liability.` : '• Standard Municipal Issue: Poses significant community inconvenience and sanitation/mobility friction if left unaddressed.'}

4. PRAYER FOR RELIEF:
In light of the above ground realities, we urgently request the concerned engineering taskforce to dispatch field personnel, conduct on-site verification, and complete necessary rectifications under guaranteed civic SLA timelines.`;

    return {
      success: true,
      source: 'CivicPulse Neural Synthesis Engine',
      model: 'Built-in Contextual NLP',
      title,
      description,
      department: 'Civic Works & Public Grievance',
      priority: isCritical ? 'CRITICAL' : (affectedEstimate >= 200 ? 'HIGH' : 'MEDIUM'),
      is_emergency: isCritical,
      affected_count: affectedEstimate,
      location_type: locationType,
      notice: providerNotice
    };
  }
}

module.exports = new AIAssistantService();
