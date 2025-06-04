import { Agent, AgentTask, AgentTaskResult } from './Agent';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { AI_CONFIG } from './ai_config';

export class ResearcherAgent implements Agent {
  id = 'researcher';
  name = 'Personal Researcher Agent';
  description = 'Conducts research, summarizes findings, and performs fact-checking using trusted resources.';
  abilities = [
    'Conduct Personal Topic Research',
    'Summarize Personal Findings',
    'Generate Personal Reference Lists',
    'Compare Products/Services',
    'Find Resources for Hobbies, Health, Travel, etc.',
    'Monitor Trends/News in Personal Interest Areas',
    'Draft Personal Project Reports or Summaries',
    'Research news and identify misinformation',
    'Perform fact-checking research using the integrated cheat sheet and online tools'
  ];

  // I'll add a helper to robustly extract a decision from an LLM answer
  private extractDecision(text: string | null | undefined): string {
    if (!text) return 'Uncertain';
    const lower = text.toLowerCase();
    if (/\b(true|yes|correct|accurate|fact)\b/.test(lower)) return 'True';
    if (/\b(false|no|incorrect|inaccurate|myth|hoax|fake)\b/.test(lower)) return 'False';
    if (/\b(uncertain|unknown|unclear|cannot determine|not sure|ambiguous|mixed|disputed)\b/.test(lower)) return 'Uncertain';
    // I'll fallback to the first word if it matches
    const firstWord = lower.split(/\W+/)[0];
    if (["true","false","uncertain","yes","no"].includes(firstWord)) {
      if (firstWord === "yes") return "True";
      if (firstWord === "no") return "False";
      return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
    }
    return 'Uncertain';
  }

  // I'll add a helper to extract a decision from a Wikipedia or Google summary
  private extractDecisionFromSummary(claim: string, summary: string | null | undefined): string {
    if (!summary) return 'Uncertain';
    const claimLower = claim.toLowerCase();
    const summaryLower = summary.toLowerCase();
    // I'll try to extract the subject and role from the claim
    // e.g., "Kamala Harris is President of the US"
    const officeMatch = claim.match(/([\w .'-]+) is (the )?([\w ]+) of ([\w .'-]+)/i);
    if (officeMatch) {
      const subject = officeMatch[1].trim().toLowerCase();
      const role = officeMatch[3].trim().toLowerCase();
      const entity = officeMatch[4].trim().toLowerCase();
      if (summaryLower.includes(subject) && summaryLower.includes(role)) {
        if (role === 'president' && summaryLower.includes('vice president')) return 'False';
        if (role === 'prime minister' && summaryLower.includes('deputy prime minister')) return 'False';
        const presidentMatch = summaryLower.match(/under president ([\w .'-]+)/);
        if (role === 'president' && presidentMatch && !presidentMatch[1].includes(subject)) return 'False';
        if (summaryLower.includes('served as') && summaryLower.includes(role)) return 'True';
        if ((summaryLower.includes('current') || summaryLower.includes('is the')) && summaryLower.includes(role)) return 'True';
        return 'Uncertain';
      }
      if (summaryLower.includes(subject) && !summaryLower.includes(role)) {
        if (role === 'president' && summaryLower.includes('vice president')) return 'False';
        return 'Uncertain';
      }
      const otherPersonMatch = summaryLower.match(new RegExp(`${role} of ${entity}.*?([\w .'-]+)`, 'i'));
      if (otherPersonMatch && !otherPersonMatch[1].includes(subject)) return 'False';
    }
    // I'll handle location/property claims: "X is in Y", "X was built in Y", "X has Y"
    const inMatch = claim.match(/([\w .'-]+) is in ([\w .'-]+)/i);
    if (inMatch) {
      const subject = inMatch[1].trim().toLowerCase();
      const location = inMatch[2].trim().toLowerCase();
      if (summaryLower.includes(subject) && summaryLower.includes(location)) return 'True';
      if (summaryLower.includes(subject) && !summaryLower.includes(location)) return 'False';
    }
    const builtMatch = claim.match(/([\w .'-]+) was built in ([\w .'-]+)/i);
    if (builtMatch) {
      const subject = builtMatch[1].trim().toLowerCase();
      const year = builtMatch[2].trim();
      if (summaryLower.includes(subject) && summaryLower.includes(year)) return 'True';
      if (summaryLower.includes(subject) && /\d{4}/.test(year) && !summaryLower.includes(year)) return 'False';
    }
    // I'll handle numeric/date claims: "X was released in 2023", "X has Y property"
    const dateMatch = claim.match(/([\w .'-]+) (was released|was built|was born|was established|occurred) in (\d{4})/i);
    if (dateMatch) {
      const subject = dateMatch[1].trim().toLowerCase();
      const year = dateMatch[3];
      if (summaryLower.includes(subject) && summaryLower.includes(year)) return 'True';
      if (summaryLower.includes(subject) && !summaryLower.includes(year)) return 'False';
    }
    // I'll handle property claims: "Water boils at 100°C"
    const propertyMatch = claim.match(/([\w .'-]+) (boils at|freezes at|melts at|has a mass of|has a length of|has a population of) ([\d.,°cF]+)/i);
    if (propertyMatch) {
      const subject = propertyMatch[1].trim().toLowerCase();
      const property = propertyMatch[2].trim().toLowerCase();
      const value = propertyMatch[3].trim().toLowerCase();
      if (summaryLower.includes(subject) && summaryLower.includes(value)) return 'True';
      if (summaryLower.includes(subject) && !summaryLower.includes(value)) return 'False';
    }
    // Fallback: if summary directly negates the claim
    if (/not|never|no evidence|disputed|hoax|fake/.test(summaryLower)) return 'False';
    // If summary affirms the claim
    if (/is the|currently|serves as|served as/.test(summaryLower) && summaryLower.includes(claimLower.split(' is ')[0])) return 'True';
    // If summary contains the main subject and at least one key word from the claim, and no contradiction, return 'True'
    const subjectWord = claimLower.split(' ')[0];
    if (summaryLower.includes(subjectWord)) {
      const claimWords = claimLower.split(' ').filter(w => w.length > 3);
      let matchCount = 0;
      for (const w of claimWords) {
        if (summaryLower.includes(w)) matchCount++;
      }
      if (matchCount >= 2) return 'True';
    }
    return 'Uncertain';
  }

  async handleTask(task: AgentTask): Promise<AgentTaskResult> {
    if (task.type === 'fact_check_text') {
      const claim = task.payload?.claim;
      if (!claim) return { success: false, result: null, error: 'No claim provided.' };

      // I'll define common Wikipedia-first patterns
      const wikiPatterns = [
        /who\s+is\s+the\s+president\b/i,
        /current\s+president\b/i,
        /who\s+is\s+the\s+prime\s+minister\b/i,
        /current\s+prime\s+minister\b/i,
        /who\s+is\s+the\s+king\b/i,
        /current\s+king\b/i,
        /who\s+is\s+the\s+queen\b/i,
        /current\s+queen\b/i,
        /who\s+is\s+the\s+governor\b/i,
        /current\s+governor\b/i,
        /who\s+is\s+the\s+mayor\b/i,
        /current\s+mayor\b/i,
        /who\s+is\s+the\s+leader\b/i,
        /current\s+leader\b/i,
        /who\s+is\s+the\s+ceo\b/i,
        /current\s+ceo\b/i,
        /what\s+is\s+the\s+population\b/i,
        /current\s+population\b/i,
        /what\s+is\s+the\s+capital\b/i,
        /current\s+capital\b/i,
        /when\s+was\s+.*\s+founded\b/i,
        /when\s+was\s+.*\s+established\b/i,
        /when\s+was\s+.*\s+born\b/i,
        /when\s+did\s+.*\s+die\b/i,
        /when\s+did\s+.*\s+occur\b/i,
        /what\s+is\s+the\s+area\b/i,
        /current\s+area\b/i,
        /what\s+is\s+the\s+gdp\b/i,
        /current\s+gdp\b/i,
        /what\s+is\s+the\s+currency\b/i,
        /current\s+currency\b/i,
        // I'll add a generic pattern for 'X is president of Y' and similar
        /is\s+.*president\s+of\s+/i,
        /is\s+.*prime\s+minister\s+of\s+/i,
        /is\s+.*king\s+of\s+/i,
        /is\s+.*queen\s+of\s+/i,
        /is\s+.*mayor\s+of\s+/i,
        /is\s+.*governor\s+of\s+/i,
        /is\s+.*ceo\s+of\s+/i,
        /is\s+.*capital\s+of\s+/i,
        /is\s+.*currency\s+of\s+/i,
        /is\s+.*population\s+of\s+/i,
        /is\s+.*gdp\s+of\s+/i
      ];
      let useWikipedia = wikiPatterns.some((pat) => pat.test(claim));
      let wikiSubject: string | null = null;
      // I'll use LLM-based semantic detection if no pattern matched
      if (!useWikipedia) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const llmRes = await axios.post(
            AI_CONFIG.llm.endpoint,
            {
              model: AI_CONFIG.llm.model,
              messages: [
                { role: 'system', content: `You are a world-class fact-checking assistant. Today is ${today}. I want you to classify the following claim. If it is a common fact (such as about a country's leader, capital, population, area, GDP, or currency), respond with 'YES' and the type (e.g., leader, capital, population, etc.) and the subject (e.g., country or entity). If not, respond with 'NO'.` },
                { role: 'user', content: `Claim: ${claim}` }
              ]
            },
            { headers: { 'Authorization': `Bearer ${AI_CONFIG.llm.apiKey}` } }
          );
          const llmText = llmRes.data.choices?.[0]?.message?.content || '';
          if (/^YES/i.test(llmText)) {
            useWikipedia = true;
            // I'll try to extract the subject from the LLM response (e.g., 'YES, leader, United States')
            const parts = llmText.split(',').map((s: string) => s.trim());
            if (parts.length >= 3) {
              wikiSubject = parts.slice(2).join(', '); // Handles commas in country/entity names
            } else if (parts.length === 2) {
              wikiSubject = parts[1];
            }
          }
        } catch (err) {
          // I'll ignore LLM errors for semantic detection and fallback to default
        }
      }
      let wikiResult: any = null;
      let googleResult: any = null;
      let llmResult: any = null;
      // Wikipedia logic
      if (useWikipedia) {
        let wikiTitle = '';
        if (wikiSubject) {
          wikiTitle = wikiSubject;
        } else if (/president.*united states|united states.*president/i.test(claim)) wikiTitle = 'President of the United States';
        else if (/prime minister.*united kingdom|united kingdom.*prime minister/i.test(claim)) wikiTitle = 'Prime Minister of the United Kingdom';
        else if (/president.*france|france.*president/i.test(claim)) wikiTitle = 'President of France';
        else if (/prime minister.*canada|canada.*prime minister/i.test(claim)) wikiTitle = 'Prime Minister of Canada';
        if (!wikiTitle) wikiTitle = claim;
        try {
          const searchRes = await axios.get(`https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(wikiTitle)}&limit=1`);
          const page = searchRes.data.pages?.[0];
          let pageTitle = page?.title || wikiTitle;
          const summaryRes = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`);
          const summary = summaryRes.data;
          wikiResult = {
            summary: summary.extract,
            pageTitle,
            wikipediaUrl: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
            primarySource: 'Wikipedia',
          };
        } catch (err: any) {
          wikiResult = null;
        }
      }
      // Google (SerpAPI) logic
      if (AI_CONFIG.serpApi.apiKey) {
        try {
          const serpRes = await axios.get(
            `${AI_CONFIG.serpApi.endpoint}?q=${encodeURIComponent(claim)}&api_key=${AI_CONFIG.serpApi.apiKey}&hl=en&gl=us`
          );
          const serpData = serpRes.data;
          let snippet = '';
          if (serpData.answer_box && serpData.answer_box.answer) {
            snippet = serpData.answer_box.answer;
          } else if (serpData.answer_box && serpData.answer_box.snippet) {
            snippet = serpData.answer_box.snippet;
          } else if (serpData.organic_results && serpData.organic_results.length > 0) {
            snippet = serpData.organic_results[0].snippet || serpData.organic_results[0].title;
          }
          if (snippet) {
            googleResult = {
              summary: snippet,
              googleSearch: `https://www.google.com/search?q=${encodeURIComponent(claim)}`,
              primarySource: 'Google',
            };
          }
        } catch (serpErr) {
          googleResult = null;
        }
      }
      // LLM logic (always get an answer for synthesis)
      let llmInitialAnswer = null;
      let llmInitialDecision = 'Undetermined';
      try {
        const today = new Date().toISOString().split('T')[0];
        const openaiRes = await axios.post(
          AI_CONFIG.llm.endpoint,
          {
            model: AI_CONFIG.llm.model,
            messages: [
              { role: 'system', content: `You are a world-class fact-checking assistant. Today is ${today}. Always answer with "True", "False", or "Uncertain" and a brief explanation. If the claim is about a political office, always cite the current officeholder as of today.` },
              { role: 'user', content: `Is this statement true as of today (${today}): "${claim}"?` }
            ]
          },
          { headers: { 'Authorization': `Bearer ${AI_CONFIG.llm.apiKey}` } }
        );
        llmInitialAnswer = openaiRes.data.choices?.[0]?.message?.content || '';
        llmResult = {
          summary: llmInitialAnswer,
          primarySource: 'OpenAI',
        };
      } catch (err: any) {
        llmResult = null;
      }
      // Synthesis logic: if there is disagreement or ambiguity, ask the LLM to synthesize
      let synthesizedDecision = null;
      if ((wikiResult && googleResult && wikiResult.summary !== googleResult.summary) || (!wikiResult && googleResult && llmResult) || (!wikiResult && !googleResult && llmResult)) {
        try {
          const synthesisPrompt = [
            'Given the following answers from different sources, synthesize the most likely correct answer and explain why.\n',
            wikiResult ? `Wikipedia: ${wikiResult.summary}` : '',
            googleResult ? `Google: ${googleResult.summary}` : '',
            llmResult ? `OpenAI: ${llmResult.summary}` : '',
          ].filter(Boolean).join('\n');
          const synthRes = await axios.post(
            AI_CONFIG.llm.endpoint,
            {
              model: AI_CONFIG.llm.model,
              messages: [
                { role: 'system', content: 'You are a world-class fact-checking assistant. Synthesize a final answer from the following sources.' },
                { role: 'user', content: synthesisPrompt }
              ]
            },
            { headers: { 'Authorization': `Bearer ${AI_CONFIG.llm.apiKey}` } }
          );
          synthesizedDecision = synthRes.data.choices?.[0]?.message?.content || null;
        } catch (err) {
          synthesizedDecision = null;
        }
      }
      // Compose the result object for the UI
      let decision: string;
      if (wikiResult && wikiResult.summary) {
        decision = this.extractDecisionFromSummary(claim, wikiResult.summary);
      } else if (googleResult && googleResult.summary) {
        decision = this.extractDecisionFromSummary(claim, googleResult.summary);
      } else {
        let decisionSource = synthesizedDecision || llmInitialAnswer;
        decision = this.extractDecision(decisionSource);
      }
      let resultObj: any = {
        sources: {
          wikipedia: wikiResult,
          google: googleResult,
          openai: llmResult,
        },
        synthesizedDecision,
        primarySource: wikiResult ? 'Wikipedia' : (googleResult ? 'Google' : 'OpenAI'),
        summary: wikiResult?.summary || googleResult?.summary || llmResult?.summary || 'No answer found.',
        wikipediaUrl: wikiResult?.wikipediaUrl,
        googleSearch: googleResult?.googleSearch || `https://www.google.com/search?q=${encodeURIComponent(claim)}`,
        decision, // I'll always include the parsed decision
      };
      return { success: true, result: resultObj };
    }
    // I'll return a default error if the task type is not handled
    return { success: false, result: null, error: 'Unsupported task type.' };
  }
}
