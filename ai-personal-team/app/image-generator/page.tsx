"use client";

import React, { useState, useEffect } from 'react';
import styles from '../image-generator.module.css';
import Link from 'next/link';

// Define the available agent tools for Communications Agent
const agentTools = [
  {
    id: 'image-generator',
    name: 'Image Generator',
    icon: '🖼️'
  },
  {
    id: 'email-writer',
    name: 'Email Writer',
    icon: '✉️',
    disabled: true
  },
  {
    id: 'meeting-prep',
    name: 'Meeting Prep',
    icon: '📅',
    disabled: true
  }
];

interface Prompt {
  id: number;
  text: string;
}

export default function ImageGeneratorPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [strength, setStrength] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedPrompts, setSelectedPrompts] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [activeToolId, setActiveToolId] = useState('image-generator');
  const [showPromptManager, setShowPromptManager] = useState(false);

  // Load prompts from the database on mount
  useEffect(() => {
    fetch('/api/prompts')
      .then(res => res.json())
      .then(data => setPrompts(data))
      .catch(() => setPrompts([]));
  }, []);

  // When a prompt is selected, set it as the editable prompt in the textarea
  const handlePromptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setSelectedPrompt(selectedId);
    
    // Find the selected prompt and set its text in the textarea
    const prompt = prompts.find(p => p.id.toString() === selectedId);
    if (prompt) {
      setCustomPrompt(prompt.text);
    }
  };
  
  // Handle checkbox selection for multiple prompts
  const handleCheckboxChange = (id: number) => {
    setSelectedPrompts(prevSelected => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(promptId => promptId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  const handleCustomPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomPrompt(e.target.value);
    setSelectedPrompt(''); // Clear dropdown selection if user edits
  };

  const handleReferenceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReferenceImage(e.target.value);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingFile(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }
      
      // Extract just the filename from the URL
      const filename = data.url.split('/').pop();
      setReferenceImage(filename);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };
  
  const handleStrengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStrength(parseFloat(e.target.value));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setImageUrl('');
    try {
      const prompt = customPrompt || selectedPrompt;
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'communications',
          task: {
            type: 'Generate Image',            payload: {
              prompt,
              referenceImagePath: referenceImage,
              aspectRatio: '16:9',
              resolution: '1792x1024',
              strength: strength,
            },
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setImageUrl(data.result);
      } else {
        setError(data.error || 'Image generation failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Save the current custom prompt to the database
  const handleSavePrompt = async () => {
    if (!customPrompt.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: customPrompt }),
      });
      if (res.ok) {
        const newPrompt = await res.json();
        setPrompts([newPrompt, ...prompts]);
        setSelectedPrompt(newPrompt.id.toString());
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to save prompt.');
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  };
  
  // Delete selected prompts
  const handleDeletePrompts = async () => {
    if (selectedPrompts.length === 0) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch('/api/prompts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedPrompts }),
      });
      if (res.ok) {
        // Remove deleted prompts from the list
        setPrompts(prompts.filter(p => !selectedPrompts.includes(p.id)));
        setSelectedPrompts([]);
        // If the currently selected prompt was deleted, clear it
        if (selectedPrompt && selectedPrompts.includes(parseInt(selectedPrompt))) {
          setSelectedPrompt('');
          setCustomPrompt('');
        }
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to delete prompts.');
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setDeleting(false);
    }
  };
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.pageTitle}>Communications Agent</h1>
        
        <div className={styles.agentHeader}>
          <h2 className={styles.pageSubtitle}>AI Advisor Team</h2>
        </div>
        
        <div className={styles.agentButtons}>
          {agentTools.map(tool => (
            <button 
              key={tool.id}
              className={`${styles.agentButton} ${activeToolId === tool.id ? styles.active : ''}`}
              onClick={() => !tool.disabled && setActiveToolId(tool.id)}
              disabled={tool.disabled}
              style={tool.disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
              <span className={styles.icon}>{tool.icon}</span>
              <span>{tool.name}</span>
            </button>
          ))}
        </div>
        
        <div className={styles.dividerContainer}>
          <div className={styles.divider}></div>
          <span className={styles.dividerText}>{activeToolId === 'image-generator' ? 'Image Generation' : (activeToolId === 'email-writer' ? 'Email Writer' : 'Meeting Prep')}</span>
        </div>
        
        {activeToolId === 'image-generator' && (
          <div className={styles.container}>
            {showPromptManager ? (
              <div className={styles.promptManagement}>
                <h2 className={styles.pageSubtitle}>Prompt Management</h2>
                <p style={{ marginBottom: '15px' }}>Select prompts to delete or click on a prompt to edit it.</p>
                <div className={styles.promptsTable}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}></th>
                        <th>Prompt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prompts.map((prompt) => (
                        <tr key={prompt.id} className={selectedPrompt === prompt.id.toString() ? styles.selectedRow : ''}>
                          <td>
                            <input 
                              type="checkbox" 
                              checked={selectedPrompts.includes(prompt.id)}
                              onChange={() => handleCheckboxChange(prompt.id)}
                            />
                          </td>
                          <td onClick={() => {
                            setSelectedPrompt(prompt.id.toString());
                            setCustomPrompt(prompt.text);
                          }}>
                            {prompt.text.length > 80 ? `${prompt.text.slice(0, 80)}...` : prompt.text}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className={styles.promptActions}>
                  <button
                    className={styles.button}
                    onClick={handleDeletePrompts}
                    disabled={deleting || selectedPrompts.length === 0}
                  >
                    {deleting ? 'Deleting...' : `Delete Selected (${selectedPrompts.length})`}
                  </button>
                  <button
                    className={styles.button}
                    onClick={() => setShowPromptManager(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles["prompt-section"]}>
                <h3 className={styles.sectionHeading}>Create or Choose a Prompt</h3>
                <label htmlFor="prompt-select">Choose a saved prompt:</label>
                <select 
                  id="prompt-select" 
                  value={selectedPrompt} 
                  onChange={handlePromptChange}
                  className={styles.formControl}
                >
                  <option value="">-- Select a prompt --</option>
                  {prompts.map((p) => (
                    <option key={p.id} value={p.id.toString()}>
                      {p.text.length > 60 ? `${p.text.slice(0, 60)}...` : p.text}
                    </option>
                  ))}
                </select>
                
                <div>or edit the prompt below:</div>
                <textarea
                  rows={12}
                  value={customPrompt}
                  onChange={handleCustomPromptChange}
                  placeholder="Paste or write your own prompt here..."
                  className={styles.formControl}
                />
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <button
                    className={styles.button}
                    onClick={handleSavePrompt}
                    disabled={saving || !customPrompt.trim()}
                  >
                    {saving ? 'Saving...' : 'Save Prompt'}
                  </button>
                  
                  <button
                    className={styles.button}
                    onClick={() => setShowPromptManager(true)}
                  >
                    Manage Prompts
                  </button>
                </div>                <div>
                  <label htmlFor="reference-image-upload">Choose Reference Image:</label>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    <input
                      type="file"
                      id="reference-image-upload"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className={styles.fileInput}
                      disabled={uploadingFile}
                    />
                    {uploadingFile && <span>Uploading...</span>}
                  </div>
                  {referenceImage && (
                    <div className={styles.selectedFile}>
                      <span>Selected file: {referenceImage}</span>
                      <button 
                        className={styles.clearFileButton}
                        onClick={() => setReferenceImage('')}
                        title="Clear selection"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>                <div className={styles.strengthContainer}>
                  <label htmlFor="strength-slider">
                    Image Strength: {strength}
                  </label>                  <div className={styles.sliderContainer}>
                    <input
                      id="strength-slider"
                      type="range"                      min="1"
                      max="10"
                      step="1"
                      value={strength}
                      onChange={handleStrengthChange}
                      className={styles.slider}
                    />                    <div className={styles.tickContainer}>
                      {/* Generate 10 tick marks for values from 1 to 10 */}
                      {Array.from({ length: 10 }, (_, i) => (
                        <div 
                          key={i} 
                          className={styles.majorTick}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  className={styles.button}
                  onClick={handleGenerate}
                  disabled={loading || !(customPrompt || selectedPrompt)}
                >
                  {loading ? 'Generating...' : 'Generate Image'}
                </button>
                {error && <div className={styles.error}>{error}</div>}
                {imageUrl && (
                  <div className={styles.result}>
                    <h2>Generated Image</h2>
                    <img src={imageUrl} alt="Generated" style={{ maxWidth: '100%' }} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeToolId !== 'image-generator' && (
          <div className={styles.container}>
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <h3 className={styles.sectionHeading}>Coming Soon</h3>
              <p>This tool is still under development.</p>
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link href="/" className={styles.button} style={{ textDecoration: 'none' }}>
            Back to Mission Control
          </Link>
        </div>
      </main>
    </div>
  );
}
