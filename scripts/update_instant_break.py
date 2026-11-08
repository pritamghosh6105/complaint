import os

filepath = 'backend/src/services/aiAssistantService.js'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

old_loop = """        for (const m of modelsToTry) {
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
                temperature: 0.25,
                max_tokens: 1024,
                response_format: { type: 'json_object' }
              },
              { headers, timeout: 3500 }
            );
            if (response?.data?.choices?.[0]?.message?.content) break;
          } catch (modelErr) {
            console.warn(`[AIAssistantService] Model ${m} attempt failed:`, modelErr.message);
            response = null;
          }
        }"""

new_loop = """        for (const m of modelsToTry) {
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
                temperature: 0.25,
                max_tokens: 1024,
                response_format: { type: 'json_object' }
              },
              { headers, timeout: 2000 }
            );
            if (response?.data?.choices?.[0]?.message?.content) break;
          } catch (modelErr) {
            console.warn(`[AIAssistantService] Model ${m} attempt failed:`, modelErr.message);
            response = null;
            // If auth or endpoint 404/401, don't waste seconds retrying other models
            if (modelErr.response && (modelErr.response.status === 404 || modelErr.response.status === 401)) {
              break;
            }
          }
        }"""

text = text.replace(old_loop, new_loop)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated aiAssistantService with instant 404 break")

