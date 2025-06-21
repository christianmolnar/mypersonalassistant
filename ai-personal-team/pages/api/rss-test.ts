import { NextApiRequest, NextApiResponse } from 'next';
import {
  fetchAllRSSFeeds,
  filterRelevantArticles,
  makeFactCheckDecision,
  processInput,
  enhanceFactCheckWithAI
} from '../../agents/RSSFeedIntegration';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('RSS Fact Check API handler called');
  console.log(`Request method: ${req.method}`);
  
  // Set a timeout for the entire request
  const apiTimeout = setTimeout(() => {
    console.error('RSS fact-check API timed out after 30 seconds');
    res.status(504).json({ error: 'Request timed out. Please try again.' });
  }, 30000);
    try {
    // Allow query to come from either query parameter or request body
    let rawQuery = req.query.query as string;
    
    // Track processing time for performance debugging
    const startTime = Date.now();
    
    // If using POST, check the body for the query
    if (req.method === 'POST' && req.body && req.body.query) {
      rawQuery = req.body.query;
      console.log('Received POST request with query in body');
    } else if (rawQuery) {
      console.log('Received query from URL parameter');
    }

    if (!rawQuery || typeof rawQuery !== 'string') {
      console.error('Missing or invalid query parameter');
      clearTimeout(apiTimeout);
      return res.status(400).json({ 
        error: 'Query parameter is required and must be a string',
        message: 'Please provide a claim or URL to fact-check'
      });
    }
    
    // Check for very short queries that likely won't yield good results
    if (rawQuery.length < 10 && !rawQuery.includes('http')) {
      console.warn('Query is very short, may not yield good results:', rawQuery);
      // We'll continue processing, but log this warning
    }
    
    console.log('Processing raw fact-check query:', rawQuery);
    
    // Process the input - handle URLs by extracting content
    const query = await processInput(rawQuery);
    console.log('Processed query for fact-checking:', query.substring(0, 200) + (query.length > 200 ? '...' : ''));    console.log('Fetching all RSS feeds...');
    const allArticles = await fetchAllRSSFeeds();
    console.log(`Fetched ${allArticles.length} articles from RSS feeds.`);
      if (allArticles.length === 0) {
      console.warn('No articles were fetched from RSS feeds');
      clearTimeout(apiTimeout);
      return res.status(500).json({ 
        error: 'Unable to fetch articles from RSS feeds. Please try again later.',
        debug: { query, rawQuery }
      });
    }
    
    // Declare relevantArticles outside the try block for scope access
    let relevantArticles: any[] = [];

    try {
      console.log('Filtering relevant articles...');
      relevantArticles = filterRelevantArticles(allArticles, query);
      console.log(`Found ${relevantArticles.length} relevant articles.`);
      // Safety check to handle unexpected article format
      if (!Array.isArray(relevantArticles)) {
        throw new Error('Unexpected format for filtered articles');
      }
    } catch (filterError) {
      console.error('Error during article filtering:', filterError);
      clearTimeout(apiTimeout);
      return res.status(500).json({ 
        error: 'Error filtering relevant articles',
        message: 'We had trouble finding articles related to your query.',
        details: filterError instanceof Error ? filterError.message : 'Unknown error'
      });
    }
      console.log('Making fact-check decision...');
    const factCheckResult = makeFactCheckDecision(relevantArticles, query);
    console.log('Fact-check decision:', factCheckResult.decision);
    console.log('Claim summary:', factCheckResult.claimSummary);
    console.log('Reason:', factCheckResult.reason);
    console.log(`For: ${factCheckResult.sources.for.length}, Against: ${factCheckResult.sources.against.length}`);
    
    // Prepare supporting and opposing evidence for AI enhancement
    const supportingEvidence = factCheckResult.sources.for
      .slice(0, 5)
      .map(source => source.title)
      .join("\n- ");
      
    const opposingEvidence = factCheckResult.sources.against
      .slice(0, 5)
      .map(source => source.title)
      .join("\n- ");
    
    // Try to enhance the factcheck with AI
    let enhancedResult;
    try {
      console.log('Enhancing fact-check with AI...');
      enhancedResult = await enhanceFactCheckWithAI(
        factCheckResult.claimSummary,
        factCheckResult.decision,
        factCheckResult.reason,
        supportingEvidence,
        opposingEvidence
      );
      console.log('AI enhanced decision:', enhancedResult.enhancedDecision);
      console.log('AI explanation:', enhancedResult.explanation);
    } catch (aiError) {
      console.error('Error during AI enhancement:', aiError);
      enhancedResult = {
        enhancedDecision: factCheckResult.decision,
        confidence: factCheckResult.decision === 'true' ? 0.8 : 
                    factCheckResult.decision === 'false' ? 0.8 : 0.5,
        explanation: factCheckResult.reason
      };
    }
    
    // Calculate processing time
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // Return the categorized results in a consistent format
    clearTimeout(apiTimeout);
    res.status(200).json({
      decision: enhancedResult.enhancedDecision, // Use AI enhanced decision
      for: factCheckResult.sources.for,
      against: factCheckResult.sources.against,
      claimSummary: factCheckResult.claimSummary,
      reason: enhancedResult.explanation, // Use AI enhanced explanation
      confidence: enhancedResult.confidence, // Use AI confidence
      debug: {
        totalArticlesFound: allArticles.length,
        relevantArticlesFound: relevantArticles.length,
        processedQuery: query.substring(0, 200),
        originalInput: rawQuery,
        processingTimeMs: processingTime,
        rssSourceCount: 'Multiple RSS sources',
        originalDecision: factCheckResult.decision
      }
    }); 
  } catch (error) {
    console.error('Error during fact-checking process:', error);
    clearTimeout(apiTimeout);
    res.status(500).json({ 
      error: 'Failed to process fact-checking request',
      message: 'We encountered an error while checking facts. This may be due to issues accessing news sources or processing your request. Please try again later.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper function to generate a human-readable summary of the fact check
function generateSummary(result: any): string {
  const { decision, sources } = result;
  
  if (decision === 'true') {
    return `This claim appears to be true based on ${sources.for.length} supporting sources compared to ${sources.against.length} opposing sources.`;
  } else if (decision === 'false') {
    return `This claim appears to be false based on ${sources.against.length} opposing sources compared to ${sources.for.length} supporting sources.`;
  } else {
    return `The evidence regarding this claim is inconclusive with ${sources.for.length} supporting sources, ${sources.against.length} opposing sources, and ${sources.inconclusive.length} sources that neither clearly support nor oppose the claim.`;
  }
}

// Calculate a confidence score for the decision
function calculateConfidence(result: any): number {
  const { decision, sources } = result;
  const forCount = sources.for.length;
  const againstCount = sources.against.length;
  const inconclusiveCount = sources.inconclusive.length;
  const totalCount = forCount + againstCount + inconclusiveCount;
  
  if (totalCount === 0) return 0;
  
  if (decision === 'true') {
    // More supporting articles = higher confidence
    return Math.min(0.95, forCount / totalCount + (forCount > againstCount * 2 ? 0.3 : 0));
  } else if (decision === 'false') {
    // More opposing articles = higher confidence
    return Math.min(0.95, againstCount / totalCount + (againstCount > forCount * 2 ? 0.3 : 0));
  } else {    // Inconclusive decisions have lower confidence by nature
    return Math.max(0.1, 0.5 - (Math.abs(forCount - againstCount) / totalCount));
  }
}
