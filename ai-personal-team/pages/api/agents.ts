import { NextApiRequest, NextApiResponse } from 'next';
import { AgentRegistry } from '../../agents/AgentRegistry';

const registry = new AgentRegistry();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // I'll list all agents
    return res.status(200).json({ agents: registry.getAllAgents() });
  }
  if (req.method === 'POST') {
    // I'll route a task to an agent
    const { agentId, task } = req.body;
    const agent = registry.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    const result = await agent.handleTask(task);
    return res.status(200).json(result);
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
