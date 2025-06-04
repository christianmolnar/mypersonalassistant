import { Agent } from './Agent';
import { CommunicationsAgent } from './CommunicationsAgent';
import { ResearcherAgent } from './ResearcherAgent';

// Registry for all available agents
export class AgentRegistry {
  private agents: Map<string, Agent> = new Map();

  constructor() {
    // Register core agents here
    this.register(new CommunicationsAgent());
    this.register(new ResearcherAgent());
    // I'll add more agents as I implement them
  }

  register(agent: Agent) {
    this.agents.set(agent.id, agent);
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
}
