"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function FactCheckerPage() {
  const [claim, setClaim] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  // Removed image-related state variables

  useEffect(() => {
    document.body.style.background =
      "linear-gradient(135deg, #181a1b 0%, #232526 100%)";
    document.body.style.color = "#f3f3f3";
    document.body.style.fontFamily = "Segoe UI, Arial, sans-serif";
    return () => {
      document.body.style.background = "";
      document.body.style.color = "";
      document.body.style.fontFamily = "";
    };
  }, []);

  async function fetchArticleText(url: string): Promise<{ text: string | null; error: string | null }> {
    console.log('Fetching article text for URL:', url);
    try {
      const res = await axios.post("/api/agents", {
        agentId: "researcher",
        task: { type: "fetch_webpage_text", payload: { url } },
      });
      console.log('API Response:', res);
      const data = res.data;
      console.log('API Data:', data);
      
      if (data && data.result && data.result.text) {
        console.log('Successfully extracted text, length:', data.result.text.length);
        return { text: data.result.text, error: null };
      }
      if (data && data.error) {
        console.error('API returned error:', data.error);
        return { text: null, error: data.error };
      }
      console.error('Unknown response format:', data);
      return { text: null, error: "Unknown error fetching article text." };
    } catch (err) {
      console.error('Network or server error:', err);
      return { text: null, error: "Network or server error fetching article text." };
    }
  }

  async function handleFactCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const isUrl = claim.match(/^https?:\/\//i);
    if (isUrl) {
      // Fetch article text
      const { text: articleText, error: fetchError } = await fetchArticleText(claim);
      if (fetchError) {
        setResult(fetchError);
        setLoading(false);
        return;
      }
      if (!articleText) {
        setResult("Could not fetch article text. Please check the URL or try again later.");
        setLoading(false);
        return;
      }
      
      console.log('Article text extracted, length:', articleText.length);
      console.log('First 200 chars:', articleText.substring(0, 200));
      
      // Extract main claim(s) using LLM
      try {
        console.log('Attempting to extract claims...');
        const extractRes = await fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId: "researcher",
            task: { type: "extract_claims_from_text", payload: { text: articleText, url: claim } },
          }),
        });
        
        if (!extractRes.ok) {
          throw new Error(`HTTP error! status: ${extractRes.status}`);
        }
        
        const extractData = await extractRes.json();
        console.log('Extract claims response:', extractData);
        
        if (extractData.error) {
          setResult(`Error extracting claims: ${extractData.error}`);
          setLoading(false);
          return;
        }
        
        // Check all possible locations for claims
        const mainClaim = extractData.result?.mainClaim || 
                         extractData.result?.claims?.[0] || 
                         extractData.mainClaim || 
                         extractData.claims?.[0] || 
                         null;

        if (!mainClaim) {
          console.error('No main claim found in response:', extractData);
          setResult("Could not find any factual claims to check in the article.");
          setLoading(false);
          return;
        }
        
        console.log('Main claim extracted:', mainClaim);
        
        // Fact-check the extracted claim
        const factCheckRes = await fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId: "researcher",
            task: { type: "fact_check_text", payload: { claim: mainClaim } },
          }),
        });
        
        if (!factCheckRes.ok) {
          throw new Error(`HTTP error! status: ${factCheckRes.status}`);
        }
        
        const factCheckData = await factCheckRes.json();
        console.log('Fact check response:', factCheckData);
        
        if (factCheckData.error) {
          setResult(`Error fact-checking claim: ${factCheckData.error}`);
        } else {
          setResult(factCheckData.result || 'No result from fact-check');
        }
    } catch (err: any) {
      console.error('Error in fact-checking process:', err);
      setResult(`Error processing article: ${err?.message || 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
    return;
  }
    // Otherwise, treat as claim/quote
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: "researcher",
        task: { type: "fact_check_text", payload: { claim } },
      }),
    });
    const data = await res.json();
    setResult(data.result || data.error);
    setLoading(false);
  }


  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #181a1b 0%, #232526 100%)",
        color: "#f3f3f3",
        fontFamily: "Segoe UI, Arial, sans-serif",
        padding: 0,
        margin: 0,
      }}
    >
      <main
        style={{
          maxWidth: 600,
          margin: "0 auto",
          padding: 32,
          background: "rgba(34, 40, 49, 0.98)",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          minHeight: 600,
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#ffb347",
            letterSpacing: 1,
          }}
        >
          Research Agent: Fact Checker
        </h1>
        <form
          onSubmit={handleFactCheck}
          style={{
            marginBottom: 32,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <input
            type="text"
            placeholder="Paste News Claim, Quote, or URL here"
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 6,
              border: "1px solid #888",
              background: "#232526",
              color: "#f3f3f3",
              fontSize: 16,
            }}
          />
          <button
            type="submit"
            disabled={loading || !claim}
            style={{
              padding: "12px 0",
              borderRadius: 6,
              border: "none",
              background:
                "linear-gradient(90deg, #ffb347 0%, #ffcc33 100%)",
              color: "#232526",
              fontWeight: 700,
              fontSize: 18,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
            }}
          >
            {loading ? "Checking..." : "Check Claim or URL"}
          </button>
        </form>
        {loading && (
          <div style={{ textAlign: "center", color: "#ffb347" }}>Checking...</div>
        )}
        {result && (
          <div
            style={{
              background: "rgba(44, 62, 80, 0.98)",
              borderRadius: 12,
              padding: 24,
              marginTop: 16,
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            }}
          >
            <strong>Result:</strong>
            {typeof result === 'string' ? (
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#232526', padding: 16, borderRadius: 8 }}>{result}</pre>
            ) : (
              <div>
                {result.primarySource && (
                  <div style={{ marginBottom: 12 }}>
                    <strong style={{ color: '#ffb347' }}>Primary Source: {result.primarySource}</strong>
                    {result.primarySource === 'Wikipedia' && result.wikipediaUrl && (
                      <span style={{ marginLeft: 8 }}>
                        (<a href={result.wikipediaUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#ffcc33', textDecoration: 'underline' }}>View on Wikipedia</a>)
                      </span>
                    )}
                  </div>
                )}
                {result.summary && (
                  <div style={{ marginBottom: 12 }}>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#232526', color: '#ffcc33', padding: 8, borderRadius: 6, marginTop: 4 }}>{result.summary}</pre>
                  </div>
                )}
                {result.llmInitialAnswer && result.primarySource === 'OpenAI' && (
                  <div style={{ marginBottom: 12 }}>
                    <strong style={{ color: '#ffb347' }}>OpenAI LLM Initial Answer:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#232526', color: '#ffcc33', padding: 8, borderRadius: 6, marginTop: 4 }}>{result.llmInitialAnswer}</pre>
                  </div>
                )}
                {result.decision && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>Decision:</strong> <span style={{ color: result.decision === 'Likely false' ? '#ff6f61' : '#ffb347' }}>{result.decision}</span>
                  </div>
                )}
                {result.reasons && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>Top Reasons:</strong>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {result.reasons.map((reason: string, i: number) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.guidance && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>Guidance:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#232526', color: '#ffcc33', padding: 8, borderRadius: 6 }}>{result.guidance}</pre>
                  </div>
                )}
                {result.sources && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>Sources:</strong>
                    <ul style={{ listStyle: 'disc', paddingLeft: 20 }}>
                      {Object.entries(result.sources).map(([key, src]: [string, any], i: number) => (
                        src && src.summary && (
                          <li key={key} style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 'bold', fontSize: 16, color: '#ffcc33', textDecoration: 'underline' }}>{key.charAt(0).toUpperCase() + key.slice(1)}: {src.summary}</div>
                            {src.quote && (
                              <details style={{ marginTop: 6 }}>
                                <summary style={{ cursor: 'pointer', color: '#ffb347', fontWeight: 500 }}>Show full quoted source</summary>
                                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#181a1b', color: '#f3f3f3', padding: 8, borderRadius: 6, marginTop: 4 }}>{src.quote}</pre>
                              </details>
                            )}
                            {src.wikipediaUrl && (
                              <div><a href={src.wikipediaUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#ffcc33', textDecoration: 'underline' }}>View on Wikipedia</a></div>
                            )}
                            {src.googleSearch && (
                              <div><a href={src.googleSearch} target="_blank" rel="noopener noreferrer" style={{ color: '#ffcc33', textDecoration: 'underline' }}>Google Search</a></div>
                            )}
                          </li>
                        )
                      ))}
                    </ul>
                  </div>
                )}
                {result.googleSearch && (
                  <div style={{ marginBottom: 8 }}>
                    <a href={result.googleSearch} target="_blank" rel="noopener noreferrer" style={{ color: '#ffcc33', textDecoration: 'underline' }}>Google Search for Claim</a>
                  </div>
                )}
                {result.cheatSheet && (
                  <div style={{ marginBottom: 8, fontSize: 13, color: '#888' }}>{result.cheatSheet}</div>
                )}
                {result.reverseImageLinks && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>Reverse Image Search Links:</strong>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {result.reverseImageLinks.map((link: string) => (
                        <li key={link}>
                          <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: '#ffcc33', textDecoration: 'underline' }}>{link}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.factCheckResults && result.factCheckResults.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>Google Fact Check Results:</strong>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {result.factCheckResults.map((item: any, i: number) => (
                        <li key={i} style={{ marginBottom: 8 }}>
                          <div style={{ color: '#ffb347', fontWeight: 600 }}>{item.text || item.claimReview?.[0]?.title}</div>
                          {item.claimReview && item.claimReview.length > 0 && (
                            <ul style={{ margin: 0, paddingLeft: 16 }}>
                              {item.claimReview.map((review: any, j: number) => (
                                <li key={j}>
                                  <span style={{ color: '#ffcc33' }}>{review.publisher?.name}:</span> {review.text} (<a href={review.url} target="_blank" rel="noopener noreferrer" style={{ color: '#ffcc33', textDecoration: 'underline' }}>{review.title}</a>)
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.semanticMatches && result.semanticMatches.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>Top Semantic News Matches:</strong>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {result.semanticMatches.map((match: any, i: number) => (
                        <li key={i}>
                          <span style={{ color: '#ffcc33' }}>{(match.similarity * 100).toFixed(1)}%</span> match: {match.headline}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {result && !feedbackSubmitted && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <span style={{ marginRight: 12, color: '#ccc' }}>Was this answer correct?</span>
                <button
                  style={{
                    background: '#4caf50', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', marginRight: 8, fontWeight: 600, cursor: 'pointer', fontSize: 15
                  }}
                  onClick={async () => {
                    setFeedback('correct');
                    setFeedbackSubmitted(true);
                    await fetch('/api/agents/feedback', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({                        claim: claim,
                        result,
                        feedback: 'correct',
                        timestamp: new Date().toISOString(),
                      }),
                    });
                  }}
                >
                  Yes
                </button>
                <button
                  style={{
                    background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 15
                  }}
                  onClick={async () => {
                    setFeedback('incorrect');
                    setFeedbackSubmitted(true);
                    await fetch('/api/agents/feedback', {                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        claim,
                        result,
                        feedback: 'incorrect',
                        timestamp: new Date().toISOString(),
                      }),
                    });
                  }}
                >
                  No
                </button>
              </div>
            )}
            {feedbackSubmitted && (
              <div style={{ textAlign: 'center', marginTop: 18, color: '#ffb347', fontWeight: 600 }}>
                Thank you for your feedback!
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
