"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  const [claim, setClaim] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleFactCheckText(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: "researcher",
        task: { type: "fact_check_text", payload: { claim } }
      })
    });
    const data = await res.json();
    setResult(data.result || data.error);
    setLoading(false);
  }

  async function handleFactCheckImage(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    let payload: any = {};
    if (imageFile) {
      // Upload image to /api/upload
      const formData = new FormData();
      formData.append('file', imageFile);
      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.url) {
          setResult('Image upload failed: ' + (uploadData.error || 'Unknown error'));
          setLoading(false);
          return;
        }
        payload.imageUrl = uploadData.url;
      } catch (err) {
        setResult('Image upload failed.');
        setLoading(false);
        return;
      }
    } else if (imageUrl) {
      payload.imageUrl = imageUrl;
    } else {
      setResult("Please provide an image URL or upload a file.");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: "researcher",
        task: { type: "fact_check_image", payload }
      })
    });
    const data = await res.json();
    setResult(data.result || data.error);
    setLoading(false);
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>AI Personal Team</h1>
        <p>Welcome! Your multi-agent productivity system is ready for development.</p>
        <section style={{ marginTop: 32, marginBottom: 32 }}>
          <h2>Fact-Check a Text Claim</h2>
          <form onSubmit={handleFactCheckText} style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Paste a news claim or quote here"
              value={claim}
              onChange={e => setClaim(e.target.value)}
              style={{ width: 400, marginRight: 8 }}
            />
            <button type="submit" disabled={loading || !claim}>Check Claim</button>
          </form>
          <h2>Fact-Check an Image</h2>
          <form onSubmit={handleFactCheckImage}>
            <input
              type="text"
              placeholder="Paste image URL here"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              style={{ width: 400, marginRight: 8 }}
            />
            <span style={{ margin: '0 8px' }}>or</span>
            <input
              type="file"
              accept="image/*"
              onChange={e => setImageFile(e.target.files?.[0] || null)}
            />
            <button type="submit" disabled={loading || (!imageUrl && !imageFile)}>
              Check Image
            </button>
          </form>
          {imageFile && (
            <div style={{ marginTop: 8 }}>
              <strong>Selected file:</strong> {imageFile.name}
            </div>
          )}
        </section>
        {loading && <div>Checking...</div>}
        {result && (
          <div style={{ marginTop: 16 }}>
            <strong>Result:</strong>
            {typeof result === 'string' ? (
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{result}</pre>
            ) : (
              <div className={styles.resultBox}>
                {result.summary && <h3>{result.summary}</h3>}
                {result.decision && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>Decision:</strong> <span style={{ color: result.decision === 'Likely false' ? 'red' : 'black' }}>{result.decision}</span>
                  </div>
                )}
                {result.reasons && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>Top Reasons:</strong>
                    <ul>
                      {result.reasons.map((reason: string, i: number) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.guidance && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>Guidance:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f8f8f8', padding: 8 }}>{result.guidance}</pre>
                  </div>
                )}
                {result.sources && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>Sources:</strong>
                    <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                      {result.sources.map((src: any, i: number) => (
                        <li key={src.url} style={{ marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                          <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold', fontSize: 16 }}>{src.headline || src.url}</a>
                          {src.image && (
                            <div style={{ marginTop: 4 }}>
                              <img src={src.image} alt="source preview" style={{ maxWidth: 200, maxHeight: 100, border: '1px solid #ccc' }} />
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.googleSearch && (
                  <div style={{ marginBottom: 8 }}>
                    <a href={result.googleSearch} target="_blank" rel="noopener noreferrer">Google Search for Claim</a>
                  </div>
                )}
                {result.cheatSheet && (
                  <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>{result.cheatSheet}</div>
                )}
                {result.reverseImageLinks && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>Reverse Image Search Links:</strong>
                    <ul>
                      {result.reverseImageLinks.map((link: string) => (
                        <li key={link}>
                          <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
