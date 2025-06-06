// Netflix Cover Letter Generator
// IMPORTANT: This script only works with ACTUAL job positions that exist
// Never create or use fabricated job listings or requisition IDs
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Function to read file contents
function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading file: ${err}`);
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}

// Function to prompt user for input
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Function to generate a cover letter
async function generateCoverLetter() {
  console.log('===========================================================');
  console.log('NETFLIX COVER LETTER GENERATOR');
  console.log('This tool only works with verified actual job positions.');
  console.log('Never create or use fabricated job listings.');
  console.log('===========================================================\n');

  // Set the base paths relative to this script
  const baseDir = path.resolve(__dirname, '..', '..');
  const netflixDir = path.join(baseDir, 'personal', 'InterviewPrep', 'Netflix');
  
  // Check if the Netflix directory exists
  if (!fs.existsSync(netflixDir)) {
    console.error(`Netflix directory not found at ${netflixDir}`);
    return;
  }
  
  // Load the template
  const templatePath = path.join(netflixDir, 'cover_letter_template.md');
  let template;
  try {
    template = await readFile(templatePath);
  } catch (error) {
    console.error('Failed to load cover letter template:', error);
    return;
  }
  
  // List available position files
  console.log('Available Netflix position files:');
  const positionFiles = fs.readdirSync(netflixDir)
    .filter(file => file.includes('position.md') && !file.includes('summary'));
  
  positionFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });
  
  // Get user selection for position
  const positionChoice = parseInt(await askQuestion('Select position file number: '));
  if (isNaN(positionChoice) || positionChoice < 1 || positionChoice > positionFiles.length) {
    console.error('Invalid selection');
    return;
  }
  
  const selectedPositionFile = positionFiles[positionChoice - 1];
  const positionPath = path.join(netflixDir, selectedPositionFile);
  
  // Read the position file
  let positionContent;
  try {
    positionContent = await readFile(positionPath);
  } catch (error) {
    console.error('Failed to load position file:', error);
    return;
  }
  
  // Extract position title
  const titleMatch = positionContent.match(/# Position: (.+)/);
  const positionTitle = titleMatch ? titleMatch[1] : 'the position';
  
  // Get specific reasons from user
  console.log('\nPlease provide the following information:');
  const specificReason = await askQuestion('Specific reason for interest in Netflix: ');
  const specificContribution = await askQuestion('Specific contribution you want to make at Netflix: ');
  const specificChallenge = await askQuestion('Specific challenge in the role you want to address: ');
  
  // Generate the cover letter
  let coverLetter = template;
  coverLetter = coverLetter.replace('[POSITION_TITLE]', positionTitle);
  coverLetter = coverLetter.replace('[SPECIFIC_REASON_FOR_NETFLIX]', specificReason);
  coverLetter = coverLetter.replace('[SPECIFIC_CONTRIBUTION_TO_NETFLIX]', specificContribution);
  coverLetter = coverLetter.replace('[SPECIFIC_CHALLENGE_IN_ROLE]', specificChallenge);
  
  // Create output filename based on position
  const outputFilename = `netflix_${positionTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_cover_letter.md`;
  const outputPath = path.join(netflixDir, outputFilename);
  
  // Write the cover letter to file
  fs.writeFileSync(outputPath, coverLetter);
  console.log(`\nCover letter created at: ${outputPath}`);
}

// Run the main function
generateCoverLetter().catch(err => {
  console.error('Error generating cover letter:', err);
});
