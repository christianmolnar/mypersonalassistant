// I'll handle feedback for fact-checker answers here
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

const FEEDBACK_FILE = path.join(process.cwd(), 'agents', 'fact_checker_feedback.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const { claim, result, feedback, timestamp } = req.body;
  if (!claim || !result || !feedback) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  let feedbacks: Array<{ claim: any; result: any; feedback: any; timestamp: any; }> = [];
  try {
    const data = await fs.readFile(FEEDBACK_FILE, 'utf-8');
    feedbacks = JSON.parse(data);
  } catch {
    feedbacks = [];
  }
  feedbacks.push({ claim, result, feedback, timestamp });
  await fs.writeFile(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2), 'utf-8');
  return res.status(200).json({ success: true });
}
