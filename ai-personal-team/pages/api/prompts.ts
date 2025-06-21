import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Fetch all prompts
    const prompts = await prisma.prompt.findMany({ orderBy: { updatedAt: 'desc' } });
    res.status(200).json(prompts);
  } else if (req.method === 'POST') {
    // Save a new prompt
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Prompt text is required.' });
    }
    const prompt = await prisma.prompt.create({ data: { text } });
    res.status(201).json(prompt);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
