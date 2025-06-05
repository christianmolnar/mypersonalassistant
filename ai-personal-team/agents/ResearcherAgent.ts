import { Agent, AgentTask, AgentTaskResult } from './Agent';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { AI_CONFIG } from './ai_config';
import puppeteer from 'puppeteer';

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
    // Strong negation patterns
    if (/\b(false|no|incorrect|inaccurate|myth|hoax|fake|refuted|contradicts|not true|not correct|not accurate|the statement is false|is not|are not|does not|cannot be|never)\b/.test(lower)) {
      return 'False';
    }
    // Strong affirmation patterns
    if (/\b(true|yes|correct|accurate|fact|the statement is true|is correct|is true|are true|is accurate|is a fact)\b/.test(lower)) {
      return 'True';
    }
    if (/\b(uncertain|unknown|unclear|cannot determine|not sure|ambiguous|mixed|disputed)\b/.test(lower)) return 'Uncertain';
    // Fallback: check for explicit contradiction in the first sentence
    const firstSentence = lower.split(/[.!?]/)[0];
    if (/not|never|no evidence|refuted|contradicts/.test(firstSentence)) return 'False';
    // Fallback: first word logic
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
      let primarySource = wikiResult ? 'Wikipedia' : (googleResult ? 'Google' : 'OpenAI');
      let summary = wikiResult?.summary || googleResult?.summary || llmResult?.summary || 'No answer found.';
      // If there is disagreement or synthesis was used, prefer the synthesized answer
      if (synthesizedDecision) {
        decision = this.extractDecision(synthesizedDecision);
        summary = synthesizedDecision;
        primarySource = 'Synthesis';
      } else if (wikiResult && wikiResult.summary) {
        decision = this.extractDecisionFromSummary(claim, wikiResult.summary);
        primarySource = 'Wikipedia';
        summary = wikiResult.summary;
      } else if (googleResult && googleResult.summary) {
        decision = this.extractDecisionFromSummary(claim, googleResult.summary);
        primarySource = 'Google';
        summary = googleResult.summary;
      } else {
        let decisionSource = llmInitialAnswer;
        decision = this.extractDecision(decisionSource);
        primarySource = 'OpenAI';
        summary = llmInitialAnswer || 'No answer found.';
      }
      let resultObj: any = {
        sources: {
          wikipedia: wikiResult,
          google: googleResult,
          openai: llmResult,
        },
        synthesizedDecision,
        primarySource,
        summary,
        wikipediaUrl: wikiResult?.wikipediaUrl,
        googleSearch: googleResult?.googleSearch || `https://www.google.com/search?q=${encodeURIComponent(claim)}`,
        decision, // I'll always include the parsed decision
      };
      return { success: true, result: resultObj };
    }
    if (task.type === 'fact_check_image') {
      // I'll scaffold image fact-checking support
      const imageUrl = task.payload?.imageUrl;
      if (!imageUrl) {
        return { success: false, result: null, error: 'No image URL or file provided.' };
      }
      // I'll return a placeholder response with TODOs for each challenge
      return {
        success: true,
        result: {
          summary: 'Image fact-checking is in development. Here is how I will approach it:',
          categories: [
            {
              type: 'Objects/People',
              todo: 'Check authenticity (altered, deepfake, etc.), context, provenance, and run reverse image search.'
            },
            {
              type: 'Image with Caption',
              todo: 'Extract and fact-check overlaid text (OCR), check if caption matches image, and detect misleading/fake captions.'
            },
            {
              type: 'Image of Text',
              todo: 'Extract text (OCR), verify source, and fact-check the extracted claim.'
            },
            {
              type: 'Image of Article',
              todo: 'Verify publication authenticity, detect alterations, and check source trustworthiness.'
            }
          ],
          guidance: 'For now, try a reverse image search (Google, Tineye) and use OCR tools to extract any text for fact-checking.',
          imageUrl
        }
      };
    }
    if (task.type === 'fact_check_url') {
      // I'll scaffold URL/article fact-checking support
      const url = task.payload?.url;
      const claim = task.payload?.claim;
      if (!url) {
        return { success: false, result: null, error: 'No URL provided.' };
      }
      // TODO: Fetch the article/site, extract main text, and summarize/extract main claim(s)
      // For now, return a placeholder response
      return {
        success: true,
        result: {
          summary: 'URL/article fact-checking is in development. I will fetch the article, extract the main claim(s), and run them through the fact-checking pipeline.',
          url,
          claim,
          guidance: 'For now, manually review the article and paste the main claim for fact-checking.'
        }
      };
    }
    if (task.type === 'fetch_webpage_text') {
      const url = task.payload?.url;
      console.log('[ResearcherAgent] fetch_webpage_text handler called for URL:', url);
      if (!url) {
        console.log('[ResearcherAgent] Returning: No URL provided.');
        return { success: false, result: null, error: 'No URL provided.' };
      }
      // Try Cheerio first
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FactCheckerBot/1.0; +https://github.com/your-repo)',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          timeout: 15000,
        });
        const html = response.data;
        const $ = cheerio.load(html);

        // Remove common navigation/header/footer elements
        $('nav, header, footer, aside, .nav, .navigation, .menu, .sidebar').remove();

        // Extract headline first
        let headline = $('h1').first().text().trim();
        if (!headline && $('title').length) {
          headline = $('title').first().text().trim();
        }
        // Fallback: try to get a unique phrase from the URL
        if (!headline && url) {
          const urlParts = url.split('/').filter(Boolean);
          headline = urlParts[urlParts.length - 1]?.replace(/[-_]/g, ' ');
        }

        // Smart article content detection
        let mainText = '';
        let articleContent = '';
        const possibleContentSelectors = [
          'article', 
          '[role="article"]',
          '.article',
          '.post-content',
          '.entry-content',
          '.content',
          'main',
          '#main-content',
          '.main-content'
        ];

        // Try each selector until we find content
        for (const selector of possibleContentSelectors) {
          const elements = $(selector);
          if (elements.length > 0) {
            elements.each((_, el) => {
              const text = $(el).text().trim();
              // Only consider text that's likely to be article content
              if (text.length >= 200 && (text.match(/\./g) || []).length >= 3) {
                if (text.length > articleContent.length) {
                  articleContent = text;
                }
              }
            });
          }
          if (articleContent) break;
        }

        // If no article content found through selectors, try smart div selection
        if (!articleContent) {
          let maxDiv = '';
          let maxLen = 0;
          let maxScore = 0;

          $('div').each((_, el) => {
            const $el = $(el);
            const text = $el.text().trim();
            const len = text.length;
            
            // Skip very short text or likely navigation
            if (len < 200) return;
            
            // Calculate a content score based on various factors
            let score = 0;
            
            // Text length is a strong signal
            score += len * 0.1;
            
            // Presence of paragraphs is a good signal
            score += $el.find('p').length * 20;
            
            // More sentences suggest article content
            score += (text.match(/[.!?]+/g) || []).length * 5;
            
            // Presence of quotes often indicates article content
            score += (text.match(/["""'']/g) || []).length * 2;
            
            // Links density should be low in article content
            const linkLength = $el.find('a').text().length;
            if (linkLength) {
              score -= (linkLength / len) * 50;
            }

            if (score > maxScore) {
              maxScore = score;
              maxLen = len;
              maxDiv = text;
            }
          });

          if (maxDiv) {
            articleContent = maxDiv;
          }
        }

        mainText = articleContent.replace(/\s+/g, ' ').trim();
        const sentenceCount = (mainText.match(/[.!?]+/g) || []).length;
        
        const mainTextLower = mainText.toLowerCase();
        const headlineLower = headline ? headline.toLowerCase() : '';
        let headlineActuallyFound = false;
        let searchAreaLength = 0;

        // Look for headline in first part of content
        if (headline && headlineLower) {
          searchAreaLength = Math.min(mainTextLower.length, headlineLower.length + 1000);
          if (mainTextLower.substring(0, searchAreaLength).includes(headlineLower)) {
            headlineActuallyFound = true;
          }
        }

        // Additional validation
        const contentScore = {
          hasMinLength: mainText.length >= 500,
          hasSentences: sentenceCount >= 5,
          hasQuotes: (mainText.match(/["""'']/g) || []).length > 0,
          hasHeadline: headlineActuallyFound,
          hasParagraphBreaks: (mainText.match(/\n\s*\n/g) || []).length > 0,
          linkDensity: ($('a').text().length / mainText.length) < 0.3
        };

        console.log('[ResearcherAgent] Content validation:', {
          url,
          scores: contentScore,
          mainTextLength: mainText.length,
          sentenceCount,
          extractedHeadline: headline,
          mainTextStartsWithSample: mainText.substring(0, 80) + '...'
        });

        const isValidContent = contentScore.hasMinLength && 
                             contentScore.hasSentences && 
                             contentScore.hasHeadline &&
                             (contentScore.hasQuotes || contentScore.hasParagraphBreaks) &&
                             contentScore.linkDensity;

        if (isValidContent) {
          return { success: true, result: { text: mainText } };
        } else {
          console.log('[ResearcherAgent] Content validation failed, falling back to Puppeteer');
          // Fall through to Puppeteer
        }
      } catch (err: any) {
        console.error('[Cheerio fetch error]', err);
        console.log('[ResearcherAgent] Returning: Cheerio fetch error', err.message || err);
        return { success: false, result: null, error: `Cheerio fetch error: ${err.message || err}` };
      }

      // Puppeteer fallback with robust logging
      let step = 'init';
      try {
        let executablePath = undefined;
        if (process.platform === 'win32') {
          step = 'resolve executablePath';
          executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
          if (!executablePath) {
            const user = process.env.USERPROFILE || process.env.HOME || '';
            const chromePath = path.join(user, '.cache', 'puppeteer', 'chrome', 'win64-137.0.7151.55', 'chrome-win64', 'chrome.exe');
            try { await fs.access(chromePath); executablePath = chromePath; } catch (e) { console.warn('[Puppeteer] Could not access default chrome path:', chromePath); }
          }
        }

        step = 'launch browser';
        console.log('[Puppeteer] Launching browser', executablePath ? `with executablePath: ${executablePath}` : '(default)');
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], executablePath });
        
        step = 'new page';
        const page = await browser.newPage();
        
        step = 'goto';
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        
        step = 'extract text';
        const extractResult = await page.evaluate(() => {
          const getText = (el: Element | null) => el ? el.textContent || '' : '';
          
          // First try to remove common non-content elements
          document.querySelectorAll('nav, header, footer, aside, [role="navigation"], .nav, .navigation, .menu, .sidebar')
            .forEach(el => el.remove());

          // Get headline
          let headline = '';
          const h1 = document.querySelector('h1');
          if (h1) headline = h1.textContent || '';
          if (!headline) {
            const title = document.querySelector('title');
            if (title) headline = title.textContent || '';
          }

          // Smart content extraction
          const possibleContentSelectors = [
            'article', 
            '[role="article"]',
            '.article',
            '.post-content',
            '.entry-content',
            '.content',
            'main',
            '#main-content',
            '.main-content'
          ];

          let bestContent = '';
          let bestScore = 0;

          // Try selectors first
          for (const selector of possibleContentSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length === 0) continue;

            elements.forEach(el => {
              const text = el.textContent || '';
              if (text.length < 200) return;

              let score = 0;
              score += text.length * 0.1;
              score += el.querySelectorAll('p').length * 20;
              score += (text.match(/[.!?]+/g) || []).length * 5;
              score += (text.match(/["""'']/g) || []).length * 2;
              
              const links = el.querySelectorAll('a');
              let linkTextLength = 0;
              links.forEach(link => linkTextLength += (link.textContent || '').length);
              if (linkTextLength) {
                score -= (linkTextLength / text.length) * 50;
              }

              if (score > bestScore) {
                bestScore = score;
                bestContent = text;
              }
            });
          }

          // If no content found through selectors, try divs
          if (!bestContent) {
            document.querySelectorAll('div').forEach(el => {
              const text = el.textContent || '';
              if (text.length < 200) return;

              let score = 0;
              score += text.length * 0.1;
              score += el.querySelectorAll('p').length * 20;
              score += (text.match(/[.!?]+/g) || []).length * 5;
              score += (text.match(/["""'']/g) || []).length * 2;
              
              const links = el.querySelectorAll('a');
              let linkTextLength = 0;
              links.forEach(link => linkTextLength += (link.textContent || '').length);
              if (linkTextLength) {
                score -= (linkTextLength / text.length) * 50;
              }

              if (score > bestScore) {
                bestScore = score;
                bestContent = text;
              }
            });
          }

          const mainText = bestContent.replace(/\s+/g, ' ').trim();
          const sentenceCount = (mainText.match(/[.!?]+/g) || []).length;
          
          // Validate content
          const contentScore = {
            hasMinLength: mainText.length >= 500,
            hasSentences: sentenceCount >= 5,
            hasQuotes: (mainText.match(/["""'']/g) || []).length > 0,
            hasHeadline: headline && mainText.toLowerCase().includes(headline.toLowerCase()),
            hasParagraphBreaks: (mainText.match(/\n\s*\n/g) || []).length > 0
          };

          return {
            text: mainText,
            headline,
            validation: contentScore,
            stats: {
              length: mainText.length,
              sentenceCount,
              score: bestScore
            }
          };
        });

        step = 'close browser';
        await browser.close();

        console.log('[ResearcherAgent] Puppeteer extraction results:', {
          url,
          validation: extractResult.validation,
          stats: extractResult.stats
        });

        const isValidContent = extractResult.validation.hasMinLength && 
                             extractResult.validation.hasSentences && 
                             (extractResult.validation.hasQuotes || extractResult.validation.hasParagraphBreaks);

        if (isValidContent) {
          console.log('[ResearcherAgent] Returning: Puppeteer success');
          return { success: true, result: { text: extractResult.text } };
        } else {
          console.warn('[Puppeteer] Extraction failed validation checks');
          console.log('[ResearcherAgent] Returning: Puppeteer extraction failed validation');
          return { 
            success: false, 
            result: null, 
            error: `Could not extract valid article content. Content validation failed: ${
              Object.entries(extractResult.validation)
                .filter(([_, passed]) => !passed)
                .map(([test]) => test)
                .join(', ')
            }`
          };
        }
      } catch (err: any) {
        console.error(`[Puppeteer fetch error at step: ${step}]`, err);
        console.log('[ResearcherAgent] Returning: Puppeteer fetch error', err.message || err);
        return { success: false, result: null, error: `Puppeteer fetch error at step: ${step}: ${err.message || err}` };
      }
    }
    // I'll return a default error if the task type is not handled
    return { success: false, result: null, error: 'Unsupported task type.' };
  }
}
