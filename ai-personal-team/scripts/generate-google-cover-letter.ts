import { CommunicationsAgent } from '../agents/CommunicationsAgent.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current file path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateGoogleCoverLetter() {
  try {
    // Initialize Communications Agent
    const agent = new CommunicationsAgent();
    
    // Define paths
    const jobDescriptionPath = path.resolve(__dirname, '../../personal/InterviewPrep/Google/Position1.md');
    const resumePath = path.resolve(__dirname, '../../personal/Projects_and_Materials/MyResume/Christian_Molnar_Resume.md');
    const outputPath = path.resolve(__dirname, '../../personal/InterviewPrep/Google/Google_Core_Hybrid_Platforms_Cover_Letter.md');
    
    // Add any custom notes you want to include
    const customNotes = `I believe my experience leading cloud infrastructure and security initiatives at Microsoft—particularly my work with hybrid architectures and cross-functional teams—has prepared me well for this role. I've worked extensively with Azure but am familiar with GCP through personal projects and understand the importance of platform adoption strategies that prioritize security, efficiency, and developer experience.`;
    
    // Create the task
    const task = {
      type: 'Write Cover Letter',
      payload: {
        jobDescriptionPath,
        resumePath,
        recipientName: 'Google Hiring Team',
        recipientCompany: 'Google',
        customNotes
      }
    };
    
    // Generate the cover letter
    console.log('Generating cover letter for Google Engineering Director position...');
    const result = await agent.handleTask(task);
    
    if (result.success && result.result) {
      // Write the cover letter to file
      fs.writeFileSync(outputPath, result.result);
      console.log(`Cover letter successfully generated and saved to: ${outputPath}`);
    } else {
      console.error('Failed to generate cover letter:', result.error);
    }
  } catch (error) {
    console.error('Error generating cover letter:', error);
  }
}

// Run the function
generateGoogleCoverLetter().catch(console.error);
