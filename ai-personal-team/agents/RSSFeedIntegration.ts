import Parser from 'rss-parser';
import natural from 'natural';
import axios from 'axios'; // Import axios for fetching URL content
import { OpenAI } from 'openai';

// Initialize the parser
const parser = new Parser();

// Simple in-memory cache for RSS feeds
type CacheEntry = {
  timestamp: number;
  data: Parser.Item[];
};

const RSS_CACHE: Record<string, CacheEntry> = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// Create a simple similarity function as fallback in case natural has issues
function simpleSimilarity(str1: string, str2: string): number {
  str1 = str1.toLowerCase();
  str2 = str2.toLowerCase();
  
  // Count common words
  const words1 = str1.split(/\s+/).filter(w => w.length > 3);
  const words2 = str2.split(/\s+/).filter(w => w.length > 3);
  
  let commonWords = 0;
  words1.forEach(w1 => {
    if (words2.some(w2 => w2.includes(w1) || w1.includes(w2))) {
      commonWords++;
    }
  });
  
  // Calculate similarity score
  if (words1.length === 0 || words2.length === 0) return 0;
  return commonWords / Math.max(words1.length, words2.length);
}

// Expanded list of RSS feeds for more comprehensive coverage
const rssFeeds = [
  // Mainstream news sources
  'https://feeds.bbci.co.uk/news/rss.xml',
  'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
  'https://feeds.npr.org/1001/rss.xml',
  'https://abcnews.go.com/abcnews/topstories',
  'https://www.cbsnews.com/latest/rss/main',
  'https://feeds.skynews.com/feeds/rss/home.xml',
  'https://www.ft.com/rss/home',
  'https://rss.csmonitor.com/feeds/csm',
  'https://www.latimes.com/rss2.0.xml',
  
  // Right-leaning sources
  'https://moxie.foxnews.com/google-publisher/politics.xml', 
  'https://nypost.com/feed/',
  'https://www.washingtontimes.com/rss/headlines/news/politics/',
  'https://www.dailywire.com/feeds/rss.xml',
  'https://www.newsmax.com/rss/Politics/1/',
  'https://www.breitbart.com/feed/',
  'https://www.theblaze.com/feeds/feed.rss',
  'https://www.nationalreview.com/feed/',
  
  // Left-leaning sources
  'https://www.theguardian.com/uk/rss',
  'https://www.aljazeera.com/xml/rss/all.xml',
  'https://www.independent.co.uk/news/world/rss',
  'https://www.huffpost.com/section/front-page/feed',
  'https://www.motherjones.com/feed/',
  'https://www.vox.com/rss/index.xml',
  
  // News aggregators and specific topics
  'https://thehill.com/rss/syndicator/19110',
  'https://www.newsweek.com/rss',
  'https://www.economist.com/the-world-this-week/rss.xml',
  'https://rss.politico.com/politics-news.xml',
  'https://feeds.reuters.com/reuters/politicsNews',
  'https://feeds.reuters.com/reuters/topNews',
  'https://rss.cnn.com/rss/cnn_allpolitics.rss',
  'https://www.factcheck.org/feed/',
  'https://www.politifact.com/rss/articles/',
  'https://www.snopes.com/feed/'
];

// Function to extract content from a URL with multiple fallback methods
export async function extractContentFromUrl(url: string): Promise<string> {
  try {
    console.log(`Attempting to fetch content from URL: ${url}`);
    
    // Try to extract publication name from URL for better context
    const urlObj = new URL(url);
    const domainParts = urlObj.hostname.split('.');
    const publication = domainParts.filter(part => 
      !['www', 'com', 'org', 'net', 'gov', 'co', 'uk'].includes(part)
    ).join(' ');
      // Set appropriate headers to mimic a real browser
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.google.com/',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      },
      timeout: 15000, // 15 seconds
      maxContentLength: 5 * 1024 * 1024 // Limit to 5MB
    });
    
    // Extract text from HTML using a more sophisticated approach
    let html = response.data.toString();
    
    // First remove scripts, styles, and other non-content elements
    html = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, ' ')
      .replace(/<comment\b[^<]*(?:(?!<\/comment>)<[^<]*)*<\/comment>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ');
    
    // Extract article title if available
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract meta description for additional context
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) || 
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
    const metaDescription = descriptionMatch ? descriptionMatch[1].trim() : '';
    
    // Look for specific metadata that might be available
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["'][^>]*>/i);
    const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : '';
    
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["'][^>]*>/i);
    const ogDescription = ogDescMatch ? ogDescMatch[1].trim() : '';
    
    // Try to find article body or main content with multiple patterns
    let mainContent = '';
    const bodyMatches = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*story[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*body[^"]*"[^>]*>([\s\S]*?)<\/div>/i, 
      /<div[^>]*class="[^"]*text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="[^"]*main[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    ];
    
    for (const pattern of bodyMatches) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].length > 200) { // Only use if substantial
        mainContent = match[1];
        break;
      }
    }
    
    // If we couldn't find main content, use the whole body
    if (!mainContent) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      mainContent = bodyMatch ? bodyMatch[1] : html;
    }
    
    // Combine all extracted metadata
    const metaContent = [title, metaDescription, ogTitle, ogDescription].filter(Boolean).join(' ');
    
    // Remove remaining HTML tags and normalize spacing
    let text = (metaContent + ' ' + mainContent)
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ')
      .trim();
    
    // Try to extract key information from URL
    const urlInfo = extractKeywordsFromUrl(url);
    
    // Enhanced, cleaned text combining all sources
    const enhancedText = [
      publication ? `Source: ${publication}` : '',
      text,
      urlInfo
    ].filter(Boolean).join(' ');
    
    console.log(`Successfully extracted ${enhancedText.length} characters from URL`);
    return enhancedText;
  
  } catch (error: any) {
    console.error(`Error fetching URL content: ${error.message || 'Unknown error'}`);
    // Fallback: Use URL parsing to extract meaningful information
    return extractKeywordsFromUrl(url);
  }
}

// Helper function to extract keywords from URL when content can't be fetched
function extractKeywordsFromUrl(url: string): string {
  try {
    console.log('Extracting keywords from URL structure');
    const urlObj = new URL(url);
    
    // Extract the domain name (publication)
    const domainParts = urlObj.hostname.split('.');
    const publication = domainParts.filter(part => 
      !['www', 'com', 'org', 'net', 'gov', 'co', 'uk'].includes(part)
    ).join(' ');
    
    // Extract path components
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Clean path parts (convert kebab case, remove dates and numbers)
    const cleanedPathParts = pathParts
      .map(part => part
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\d{4}\/\d{2}\/\d{2}/, '')
        .replace(/^\d+$/, '')
        .trim()
      )
      .filter(part => part.length > 0);
    
    // Extract search parameters
    const searchParams = Array.from(urlObj.searchParams.entries())
      .map(([key, value]) => {
        // Only include values that look like keywords, not IDs
        if (value.length > 3 && !/^\d+$/.test(value)) {
          return value.replace(/-/g, ' ').replace(/_/g, ' ');
        }
        return '';
      })
      .filter(Boolean);
    
    // Combine all extracted components
    const urlKeywords = [
      publication ? `Publication: ${publication}` : '',
      cleanedPathParts.length > 0 ? `Topic: ${cleanedPathParts.join(' ')}` : '',
      searchParams.length > 0 ? `Additional: ${searchParams.join(' ')}` : ''
    ].filter(Boolean).join(', ');
    
    console.log(`Extracted URL keywords: ${urlKeywords}`);    return urlKeywords;
  } catch (e) {
    console.error('Error extracting keywords from URL:', e);
    return url; // Return the raw URL as a last resort
  }
}

// Improved function to handle both claims and URLs
export async function processInput(input: string): Promise<string> {
  // Check if input is a URL
  const urlPattern = /^(https?:\/\/)[a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}(\/[a-zA-Z0-9-_./?=&%]*)?$/;
  
  if (urlPattern.test(input)) {
    console.log('Input appears to be a URL, attempting to extract content');
    const extractedContent = await extractContentFromUrl(input);
    
    if (extractedContent && extractedContent.length > 50) {
      // Extract the most relevant content (first 2000 chars should capture main points)
      return extractedContent.substring(0, 2000);
    }
  }
  
  // If not a URL or URL extraction failed, use input as is
  return input;
}

// Fetch and parse RSS feeds with improved error handling and timeout
export async function fetchAllRSSFeeds(): Promise<Parser.Item[]> {
  const allArticles: Parser.Item[] = [];
  
  console.log(`Starting to fetch articles from ${rssFeeds.length} RSS feeds...`);
  
  // Use Promise.allSettled to fetch all feeds in parallel with timeouts
  const feedPromises = rssFeeds.map((url, index) => {
    return new Promise<Parser.Item[]>(async (resolve) => {
      try {
        console.log(`Attempting to fetch from RSS feed #${index+1}: ${url}`);
        
        // Check cache first
        const cached = RSS_CACHE[url];
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          console.log(`Using cached data for ${url}`);
          resolve(cached.data);
          return;
        }
        
        // Create a timeout for the fetch
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 10000); // Extended to 10 second timeout
        });
        
        // Create the fetch promise
        const fetchPromise = parser.parseURL(url);
        
        // Race the fetch against the timeout
        const feed = await Promise.race([fetchPromise, timeoutPromise]) as any;
        if (feed && feed.items && Array.isArray(feed.items)) {
          console.log(`Successfully fetched ${feed.items.length} articles from ${url}`);
          
          // Update cache
          RSS_CACHE[url] = {
            timestamp: Date.now(),
            data: feed.items
          };
          
          resolve(feed.items);
        } else {
          console.log(`Feed from ${url} was empty or invalid`);
          resolve([]);
        }
      } catch (error) {
        console.error(`Error fetching RSS feed from ${url}:`, error);
        resolve([]); // Return empty array on error
      }
    });
  });
  
  // Wait for all feeds (successful or not)
  const results = await Promise.allSettled(feedPromises);
  
  // Process the results
  let successCount = 0;
  let articleCount = 0;
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const items = result.value;
      if (items && items.length > 0) {
        successCount++;
        articleCount += items.length;
        allArticles.push(...items);
      }
    } else {
      console.error(`Failed to fetch from ${rssFeeds[index]}:`, result.reason);
    }
  });
    console.log(`Results summary: ${successCount}/${rssFeeds.length} feeds successful, ${articleCount} total articles fetched`);
  console.log(`Final result: ${allArticles.length} valid articles available for fact checking`);
  
  if (allArticles.length === 0) {
    console.warn("WARNING: No articles were fetched from any RSS feeds! This will cause fact checking to fail.");
  }
  
  return allArticles;
}

// Enhanced filtering logic with semantic similarity and topic analysis
export function filterRelevantArticles(articles: Parser.Item[], query: string): Parser.Item[] {
  // Debug info
  console.log(`Filtering ${articles.length} articles for relevance to query: "${query}"`);
  
  if (articles.length === 0) {
    console.warn("WARNING: No articles available to filter!");
    return [];
  }
  
  // Normalize and preprocess the query
  const normalizedQuery = query.toLowerCase().trim();
  
  // Extract main keywords and phrases (more sophisticated than simple splitting)
  const queryKeywords = normalizedQuery.split(/[.,;!?]/)
    .flatMap(phrase => phrase.split(/\s+/))
    .filter(word => 
      word.length > 2 && !['the', 'and', 'for', 'but', 'not', 'with', 'that', 'this', 'was', 'were', 'has', 'have', 'had'].includes(word)
    );
  
  // Extract key phrases (2-3 word sequences that might be important)
  const queryPhrases: string[] = [];
  const words = normalizedQuery.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    queryPhrases.push(`${words[i]} ${words[i+1]}`);
    if (i < words.length - 2) {
      queryPhrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
    }
  }
  
  // Try to identify named entities (people, places, organizations)
  const namedEntities: string[] = [];
  
  // Simple named entity recognition - look for proper nouns
  // Look for capitalized words that aren't at the start of sentences
  const capitalizedWords = normalizedQuery.match(/(?:^|\s|\.)([A-Z][a-z]{1,})/g) || [];
  if (capitalizedWords.length > 0) {
    namedEntities.push(...capitalizedWords.map(w => w.trim().toLowerCase()));
  }
  
  // Check for common political figures that might be mentioned
  const politicalFigures = [
    'trump', 'biden', 'harris', 'obama', 'clinton', 'mcconnell', 'schumer', 
    'pelosi', 'mccarthy', 'desantis', 'newsom', 'sanders', 'ratcliffe'
  ];
  
  politicalFigures.forEach(figure => {
    if (normalizedQuery.includes(figure)) {
      namedEntities.push(figure);
    }
  });
  
  // Important countries/regions often in news
  const countries = [
    'us', 'usa', 'america', 'american', 'china', 'chinese', 'russia', 'russian',
    'iran', 'iranian', 'israel', 'israeli', 'ukraine', 'ukrainian', 'north korea', 
    'south korea', 'europe', 'european'
  ];
  
  countries.forEach(country => {
    if (normalizedQuery.includes(country)) {
      namedEntities.push(country);
    }
  });
  
  // Important topics that often appear in fact-checking
  const keyTopics = [
    'election', 'vote', 'pandemic', 'covid', 'vaccine', 'climate', 'economy', 
    'inflation', 'war', 'military', 'immigration', 'border', 'tax', 'healthcare'
  ];
  
  keyTopics.forEach(topic => {
    if (normalizedQuery.includes(topic)) {
      namedEntities.push(topic);
    }
  });
  
  console.log('Query keywords:', queryKeywords);
  console.log('Query phrases:', queryPhrases);
  console.log('Named entities:', namedEntities);
  console.log(`Starting with ${articles.length} total articles...`);
  
  // If we have very few query keywords, get more lenient in our filtering
  const isShortQuery = queryKeywords.length <= 3;
  
  // ULTRA MINIMAL filtering to ensure we get SOME results
  // Extract individual words from phrases for broader matching
  const allQueryWords = new Set<string>();
  queryKeywords.forEach(keyword => {
    // Split compound words (e.g., "majority-back" to ["majority", "back"])
    keyword.split(/[-_\s]/).forEach(word => {
      if (word.length > 2) allQueryWords.add(word.toLowerCase());  // Reduced minimum word length
    });
  });
  
  console.log(`Expanded query words:`, Array.from(allQueryWords));
  
  // Break the query into minimal components - single words
  const simpleWords = normalizedQuery
    .split(/\s+/)
    .filter(w => w.length >= 3)
    .map(w => w.toLowerCase());
  console.log('Simple words:', simpleWords);
  
  // Sample some articles to see what content is available
  console.log('Sample article titles:');
  for (let i = 0; i < Math.min(5, articles.length); i++) {
    console.log(`- ${articles[i].title || 'Untitled'}`);
  }
  
  // Super lenient first-pass filtering - grab anything vaguely relevant
  let filteredArticles = articles.filter(article => {
    if (!article.title && !article.contentSnippet && !article.content) {
      return false; // Skip empty articles
    }
    
    const title = article.title?.toLowerCase() || '';
    const description = article.contentSnippet?.toLowerCase() || '';
    const content = article.content?.toLowerCase() || '';
    const combined = title + ' ' + description + ' ' + content;
    
    // DEBUG individual articles
    if (Math.random() < 0.05) { // Log ~5% of articles for debugging
      console.log(`\nArticle: "${title}"\nDescription: ${description.substring(0, 100)}...`);
    }
    
    // ANY match with named entities is good
    if (namedEntities.length > 0) {
      for (const entity of namedEntities) {
        if (combined.includes(entity)) {
          // Log matches for debugging
          console.log(`Matched entity "${entity}" in article "${title}"`);
          return true;
        }
      }
    }
    
    // ANY match with simple words is good enough
    for (const word of simpleWords) {
      if (combined.includes(word)) {
        console.log(`Matched simple word "${word}" in article "${title}"`);
        return true;
      }
    }
    
    // For short queries, be extra lenient - check for partial matches too
    if (isShortQuery) {
      for (const word of simpleWords) {
        if (word.length >= 5) { // Only for longer words to avoid false positives
          // Check for partial matches (beginning of word)
          for (const contentWord of combined.split(/\s+/)) {
            if (contentWord.startsWith(word) || word.startsWith(contentWord)) {
              console.log(`Partial match: "${word}" ~ "${contentWord}" in article "${title}"`);
              return true;
            }
          }
        }
      }
    }
    
    // Check recency - include very recent news that might be about the topic
    if (article.isoDate) {
      const pubDate = new Date(article.isoDate);
      const now = new Date();
      const hoursSincePub = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60);
      
      // Very recent articles with ANY keyword match
      if (hoursSincePub < 24) {
        for (const word of simpleWords) {
          if (combined.includes(word)) {
            console.log(`Recent article (${hoursSincePub.toFixed(1)}h old) matched "${word}": "${title}"`);
            return true;
          }
        }
      }
    }
    
    return false;
  });
  
  console.log(`Filtered to ${filteredArticles.length} articles`);
  
  // ALWAYS return some articles if available, even if just the most recent ones
  if (filteredArticles.length === 0 && articles.length > 0) {
    console.log("No articles matched filtering criteria. Using fallback strategy...");
    
    // Sort by date (newest first) if available
    const sortedArticles = [...articles].sort((a, b) => {
      if (!a.isoDate) return 1;
      if (!b.isoDate) return -1;
      return new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime();
    });
    
    // Return the 10 most recent articles as a fallback
    filteredArticles = sortedArticles.slice(0, 10);
    console.log(`Fallback: Using ${filteredArticles.length} most recent articles`);
    
    // Log what we're returning
    filteredArticles.forEach((article, i) => {
      console.log(`Fallback article ${i+1}: "${article.title || 'Untitled'}"`);
    });
  }
    return filteredArticles;
}

// Improved decision logic with weighted scoring and context analysis
export function makeFactCheckDecision(relevantArticles: Parser.Item[], query: string = ''): {
  decision: string;
  sources: {
    for: { title: string; link: string }[];
    against: { title: string; link: string }[];
    inconclusive: { title: string; link: string }[];
  };
  claimSummary: string;
  reason: string;
} {
  const forArticles: { title: string; link: string }[] = [];
  const againstArticles: { title: string; link: string }[] = [];
  const inconclusiveArticles: { title: string; link: string }[] = [];
  
  // Extract most compelling articles and their content for analysis
  const keyArticleContent: string[] = [];

  console.log(`Making fact check decision based on ${relevantArticles.length} articles`);

  // Generate a summary of what the claim is about from the articles
  const claimSummary = extractClaimSummary(relevantArticles, query);
  console.log('Generated claim summary:', claimSummary);

  if (relevantArticles.length === 0) {
    console.warn("No articles to make a decision from!");
    return { 
      decision: 'inconclusive', 
      sources: { 
        for: [], 
        against: [], 
        inconclusive: [] 
      },
      claimSummary: query ? `Unable to find any relevant information about: "${query}"` : 'No claim provided',
      reason: 'No relevant articles were found to make a determination'
    };
  }
  // Expanded keywords that might indicate support or opposition
  const supportKeywords = [
    'confirm', 'support', 'true', 'correct', 'accurate', 'valid', 'verify', 'evidence', 'proof',
    'studies show', 'research indicates', 'evidence suggests', 'according to', 'factual', 'legitimate',
    'confirmed by', 'verified by', 'substantiated', 'authenticated', 'validated', 'proves', 
    'demonstrated', 'established', 'corroborated', 'affirmed', 'endorsed', 'backed', 'upheld',
    'legitimate', 'real', 'genuine', 'official', 'authentic', 'documented', 'proven', 'verifiable',
    'ratified', 'authorized', 'certified', 'affirmed'
  ];
  
  const againstKeywords = [
    'false', 'incorrect', 'wrong', 'debunk', 'deny', 'refute', 'fake', 'mislead', 'inaccurate',
    'misinformation', 'disinformation', 'baseless', 'unfounded', 'conspiracy', 'no evidence',
    'disputed', 'fabricated', 'unverified', 'contested', 'dubious', 'unsubstantiated',
    'misleading', 'hoax', 'rumor', 'falsehood', 'lie', 'deceit', 'deception', 'fraud', 'bogus',
    'phony', 'sham', 'forgery', 'counterfeit', 'not true', 'never happened', 'didn\'t happen', 
    'untrue', 'mistaken', 'erroneous', 'fallacious', 'specious', 'spurious', 'fake news'
  ];

  // We'll track the overall certainty score
  let totalSupportScore = 0;
  let totalAgainstScore = 0;
  let totalRelevanceScore = 0;
    // First, assign every article to a category to ensure we have something to work with
  const articleScores: {article: Parser.Item; supportScore: number; againstScore: number; relevance: number}[] = [];
  
  relevantArticles.forEach(article => {
    const title = article.title?.toLowerCase() || '';
    const content = article.content?.toLowerCase() || article.contentSnippet?.toLowerCase() || '';
    const articleText = title + ' ' + content;
    
    // Calculate article relevance
    let relevance = 1;
    if (title.length > 20) {
      relevance = 1.5;
    }
    if (content.length > 500) {
      relevance += 0.5;
    }
    
    totalRelevanceScore += relevance;
    
    // Count occurrences of support/against keywords
    let supportScore = 0;
    let againstScore = 0;
    
    // Check for supportive keywords
    supportKeywords.forEach(keyword => {
      // Simple word matching first
      if (articleText.includes(keyword)) {
        supportScore += 1;
      }
      
      // Then try more precise matching if needed
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = (articleText.match(regex) || []).length;
      supportScore += matches * 0.5; // Weight exact matches less to avoid overwhelming the score
    });
    
    // Check for opposing keywords
    againstKeywords.forEach(keyword => {
      // Simple word matching first
      if (articleText.includes(keyword)) {
        againstScore += 1;
      }
      
      // Then try more precise matching
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = (articleText.match(regex) || []).length;
      againstScore += matches * 0.5;
    });
    
    // Look for negation phrases that might flip the meaning
    const negationPhrases = ['not true', 'isn\'t true', 'is false', 'no evidence', 'lacks evidence'];
    negationPhrases.forEach(phrase => {
      if (articleText.includes(phrase)) {
        againstScore += 1.5;
      }
    });
    
    // Weight scores by relevance
    supportScore *= relevance;
    againstScore *= relevance;
    
    totalSupportScore += supportScore;
    totalAgainstScore += againstScore;
    
    // Save scores for sorting later
    articleScores.push({
      article,
      supportScore,
      againstScore,
      relevance
    });
    
    // Also collect key content from high-relevance articles for analysis
    if (relevance >= 1.5) {
      keyArticleContent.push(`Title: ${article.title || 'Untitled'}\nContent: ${article.contentSnippet || ''}`);
    }
  });
  
  // Sort articles by their scores
  const forSorted = articleScores
    .filter(item => item.supportScore > item.againstScore)
    .sort((a, b) => b.supportScore - a.supportScore)
    .slice(0, 10) // Limit to 10 most relevant supporting articles
    .map(item => ({
      title: item.article.title || 'Untitled',
      link: item.article.link || '#'
    }));
  
  const againstSorted = articleScores
    .filter(item => item.againstScore > item.supportScore)
    .sort((a, b) => b.againstScore - a.againstScore)
    .slice(0, 10) // Limit to 10 most relevant opposing articles
    .map(item => ({
      title: item.article.title || 'Untitled',
      link: item.article.link || '#'
    }));
  
  // Filter out inconclusive articles (we're removing them from the results)
  const inconclusiveCount = articleScores.filter(
    item => item.supportScore === item.againstScore
  ).length;
    
  forArticles.push(...forSorted);
  againstArticles.push(...againstSorted);
  
  // Log categorization results
  console.log(`Categorized ${forArticles.length} supporting articles, ${againstArticles.length} opposing articles`);
  console.log(`${inconclusiveCount} inconclusive articles ignored`)

  // Log the distribution of articles
  console.log(`Article distribution: FOR=${forArticles.length}, AGAINST=${againstArticles.length}, INCONCLUSIVE=${inconclusiveArticles.length}`);
  
  // If NO articles have been assigned to any category, put them all in inconclusive
  if (forArticles.length === 0 && againstArticles.length === 0 && inconclusiveArticles.length === 0) {
    console.log("No articles were categorized! Putting all in inconclusive category.");
    relevantArticles.forEach(article => {
      inconclusiveArticles.push({
        title: article.title || 'Untitled',
        link: article.link || '#'
      });
    });    return { 
      decision: 'inconclusive', 
      sources: { 
        for: [], 
        against: [], 
        inconclusive: inconclusiveArticles 
      },
      claimSummary: query ? `Unable to find any conclusive information about: "${query}"` : 'No claim provided',
      reason: 'No reliable sources were found that take a clear position on this claim'
    };
  }
    // Generate a reason for the decision based on article distribution
  let reason = '';
  let decision = 'inconclusive';
  const emptyInconclusive: { title: string; link: string }[] = []; // Empty array for inconclusive sources
  
  // Make a decision based on simple majority
  if (forArticles.length > againstArticles.length * 1.5) {
    decision = 'true';
    reason = `There are ${forArticles.length} reliable sources supporting this claim compared to only ${againstArticles.length} opposing sources. The evidence strongly suggests this claim is accurate.`;
  } else if (againstArticles.length > forArticles.length * 1.5) {
    decision = 'false';
    reason = `There are ${againstArticles.length} reliable sources refuting this claim compared to only ${forArticles.length} supporting sources. The evidence strongly suggests this claim is false.`;
  } else if (forArticles.length > againstArticles.length) {
    decision = 'true';
    reason = `While the evidence is mixed, there are more sources (${forArticles.length}) supporting the claim than opposing it (${againstArticles.length}).`;
  } else if (againstArticles.length > forArticles.length) {
    decision = 'false';
    reason = `While the evidence is mixed, there are more sources (${againstArticles.length}) opposing the claim than supporting it (${forArticles.length}).`;
  } else if (forArticles.length === 0 && againstArticles.length === 0) {
    decision = 'inconclusive';
    reason = 'No reliable sources were found that either support or oppose this claim, making it impossible to verify.';
  } else {
    decision = 'inconclusive';
    reason = `The evidence is evenly split, with ${forArticles.length} sources supporting and ${againstArticles.length} sources opposing the claim, making it difficult to determine its accuracy.`;
  }
  
  return { 
    decision, 
    sources: { 
      for: forArticles, 
      against: againstArticles, 
      inconclusive: emptyInconclusive // Empty array as we're removing inconclusive sources
    },
    claimSummary,
    reason
  };
}

// Function to use OpenAI for more sophisticated fact-checking
// Create OpenAI client if environment variables are set
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('OpenAI client initialized successfully');
  } else {
    console.log('OpenAI API key not found in environment variables');
  }
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

// Enhanced fact checking with OpenAI
export async function enhanceFactCheckWithAI(
  claimSummary: string,
  decision: string,
  reason: string,
  supportingEvidence: string,
  opposingEvidence: string
): Promise<{
  enhancedDecision: string;
  confidence: number;
  explanation: string;
}> {
  if (!openai) {
    console.log('OpenAI not available for enhanced fact-checking');
    return {
      enhancedDecision: decision,
      confidence: decision === 'inconclusive' ? 0.5 : decision === 'true' ? 0.8 : 0.8,
      explanation: reason
    };
  }

  try {
    const prompt = `
      You are a factchecking specialist who analyzes news articles and claims to determine accuracy.
      
      CLAIM TO CHECK: "${claimSummary}"
      
      INITIAL DECISION FROM NEWS SOURCES: ${decision}
      
      REASON FOR INITIAL DECISION: ${reason}
      
      SUPPORTING EVIDENCE: ${supportingEvidence}
      
      OPPOSING EVIDENCE: ${opposingEvidence}
      
      Your job is to analyze this data and provide:
      1. A final factcheck decision (TRUE, FALSE, or INCONCLUSIVE)
      2. A confidence score from 0.0 to 1.0
      3. A clear explanation of your reasoning
      
      Respond in JSON format as follows:
      {
        "decision": "TRUE|FALSE|INCONCLUSIVE",
        "confidence": 0.XX,
        "explanation": "Your explanation here"
      }
      
      Base your decision on the actual evidence provided, not on preexisting knowledge.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content || '';
    console.log('OpenAI Response:', content);
    
    // Try to parse the JSON response
    try {
      // Find JSON in the response (in case there's additional text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonResponse = JSON.parse(jsonMatch[0]);
        
        return {
          enhancedDecision: jsonResponse.decision.toLowerCase(),
          confidence: jsonResponse.confidence || 0.5,
          explanation: jsonResponse.explanation || reason
        };
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      // Fall back to original decision
      return {
        enhancedDecision: decision,
        confidence: decision === 'inconclusive' ? 0.5 : 0.8,
        explanation: reason
      };
    }
  } catch (error) {
    console.error('Error calling OpenAI for fact-checking:', error);
    // Return the original decision if AI enhancement fails
    return {
      enhancedDecision: decision,
      confidence: decision === 'inconclusive' ? 0.5 : 0.8,
      explanation: reason
    };
  }
}

// Extract key information from articles to generate a claim summary
function extractClaimSummary(relevantArticles: Parser.Item[], query: string): string {
  if (relevantArticles.length === 0) {
    return `No relevant information found about: "${query}"`;
  }
  
  // Get most frequent words and phrases to identify key topics
  const allText = relevantArticles
    .map(article => {
      const title = article.title || '';
      const content = article.contentSnippet || article.content || '';
      return `${title} ${content}`;
    })
    .join(' ')
    .toLowerCase();
  
  // Extract relevant sentences that might contain the claim
  const sentences: string[] = [];
  relevantArticles.forEach(article => {
    const title = article.title || '';
    const content = article.contentSnippet || article.content || '';
    
    // Split content into sentences
    const articleSentences = (title + '. ' + content)
      .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
      .split("|")
      .map(s => s.trim())
      .filter(s => s.length > 15 && s.length < 200); // Reasonable sentence length
    
    sentences.push(...articleSentences);
  });
  
  // Find sentences most relevant to the query
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  // Score sentences by how many query words they contain
  const scoredSentences = sentences.map(sentence => {
    const lowerSentence = sentence.toLowerCase();
    let score = 0;
    
    queryWords.forEach(word => {
      if (lowerSentence.includes(word)) score += 1;
    });
    
    // Boost sentences with claim-like phrases
    const claimPhrases = ['according to', 'claimed that', 'states that', 'reported', 'shows that'];
    claimPhrases.forEach(phrase => {
      if (lowerSentence.includes(phrase)) score += 0.5;
    });
    
    return { sentence, score };
  });
  
  // Sort by score and take top sentences
  scoredSentences.sort((a, b) => b.score - a.score);
  const topSentences = scoredSentences.slice(0, 3).map(item => item.sentence);
  
  // Create a concise summary from the top sentences
  let summary = topSentences.join(' ');
  
  // Ensure the summary isn't too long
  if (summary.length > 300) {
    summary = summary.substring(0, 297) + '...';
  }
  
  return summary || `Information related to: "${query}"`;
}

// Example usage - commented out to prevent automatic execution when importing
/*
(async () => {
  const allArticles = await fetchAllRSSFeeds();
  console.log('All Articles:', allArticles.length);

  const query = 'Trump Iran policy';
  const relevantArticles = filterRelevantArticles(allArticles, query);
  console.log('Relevant Articles:', relevantArticles.length);

  const factCheckDecision = makeFactCheckDecision(relevantArticles);
  console.log('Fact Check Decision:', factCheckDecision);
})();
*/
