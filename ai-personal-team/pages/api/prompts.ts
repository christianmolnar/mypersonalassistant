import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Simple file-based storage for prompts (for local development)
const PROMPTS_FILE = path.join(process.cwd(), 'data', 'prompts.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(PROMPTS_FILE))) {
  fs.mkdirSync(path.dirname(PROMPTS_FILE), { recursive: true });
}

interface Prompt {
  id: number;
  text: string;
  createdAt: string;
  updatedAt: string;
}

function readPrompts(): Prompt[] {
  try {
    if (fs.existsSync(PROMPTS_FILE)) {
      const data = fs.readFileSync(PROMPTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading prompts file:', error);
  }
  return [];
}

function writePrompts(prompts: Prompt[]) {
  try {
    fs.writeFileSync(PROMPTS_FILE, JSON.stringify(prompts, null, 2));
  } catch (error) {
    console.error('Error writing prompts file:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Fetch all prompts
    const prompts = readPrompts().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.status(200).json(prompts);
  } else if (req.method === 'POST') {
    // Save a new prompt
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Prompt text is required.' });
    }
    
    const prompts = readPrompts();
    const newPrompt: Prompt = {
      id: prompts.length > 0 ? Math.max(...prompts.map(p => p.id)) + 1 : 1,
      text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    prompts.push(newPrompt);
    writePrompts(prompts);
    
    res.status(201).json(newPrompt);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
