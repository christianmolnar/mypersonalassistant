const fs = require('fs');
const path = require('path');

// This script manually generates a cover letter for the Google position

// Define paths
const jobDescriptionPath = path.resolve(__dirname, '../../personal/InterviewPrep/Google/Position1.md');
const outputPath = path.resolve(__dirname, '../../personal/InterviewPrep/Google/Google_Core_Hybrid_Platforms_Cover_Letter.md');

// Read job description
const jobDescription = fs.readFileSync(jobDescriptionPath, 'utf8');

// Current date
const today = new Date();
const formattedDate = today.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// Extract job title
function extractJobTitle(jobDescription) {
  const titleMatch = jobDescription.match(/position:?\s*([^#\n]+)/i) || 
                   jobDescription.match(/job title:?\s*([^#\n]+)/i) ||
                   jobDescription.match(/# Position:?\s*([^#\n]+)/i);
  return titleMatch ? titleMatch[1].trim() : 'the open position';
}

// Generate cover letter
const jobTitle = extractJobTitle(jobDescription);
const coverLetter = `${formattedDate}

Google Hiring Team
Google

Re: Application for ${jobTitle} Position

Dear Google Hiring Team,

I am writing to express my enthusiasm for the ${jobTitle} position at Google. With over 15 years of engineering leadership experience driving innovation and transformation in complex technical environments, I'm excited about the opportunity to lead your Core Hybrid Platforms team and advance the mission of removing barriers to organic adoption of GCP across Alphabet.

Throughout my career at Microsoft, I've built and led high-performing, geo-distributed teams delivering highly reliable systems for Fortune 500 enterprises. My experience as a hands-on engineering leader with strategic vision aligns perfectly with your needs for someone who can develop and execute platform strategies while collaborating across organizational boundaries. I've demonstrated success in regulated, high-visibility domains and have extensive experience influencing stakeholders through diplomacy and persuasion – skills that will be essential for driving adoption of platforms that enable Alphabet's product areas to build hybrid and cloud-native systems with appropriate security and privacy controls.

At Microsoft, I've led several initiatives that demonstrate my readiness for this role. I built the Modern Release Orchestration Experiences (MROUI), which sped up Microsoft Office release cadence to monthly, contributing to 2x Office seat growth in just two years. I've also led the development of https://status.cloud.microsoft with 99.99% uptime – a cross-cloud status solution for all of Microsoft. Most relevantly, I've recently hardened our applications and infrastructure security posture via a new de-coupled Azure/AWS architecture using Managed Identities, Azure Virtual Network Rules, Service Tags, and safer ring-based rollouts – experience that directly translates to the hybrid and cloud-native systems focus of this role.

What excites me most about this opportunity is the chance to collaborate across Google to address complex software engineering, security, and privacy challenges, and to expand Alphabet's ability to rapidly innovate. The big question now is how to make Alphabet the most sophisticated user of GCP while ensuring these capabilities are available safely to engineering teams. I'm particularly drawn to the Core team's mandate and unique opportunity to impact important technical decisions across the company.

I believe my experience leading cloud infrastructure and security initiatives at Microsoft—particularly my work with hybrid architectures and cross-functional teams—has prepared me well for this role. I've worked extensively with Azure but am familiar with GCP through personal projects and understand the importance of platform adoption strategies that prioritize security, efficiency, and developer experience.

I appreciate your consideration and would welcome the opportunity to discuss how my experience aligns with your needs. I'm confident that my technical leadership, strategic vision, and collaborative approach would make a significant contribution to your team.

Best regards,

Christian Molnar
chrismolhome@hotmail.com
425-432-8474
`;

// Write cover letter to file
fs.writeFileSync(outputPath, coverLetter);
console.log(`Cover letter successfully generated and saved to: ${outputPath}`);
console.log('\n--- PREVIEW ---\n');
console.log(coverLetter.slice(0, 500) + '...');
console.log('\n--- END PREVIEW ---');
