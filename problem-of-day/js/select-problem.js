const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // For image processing

// Load previously published problems
let publishedProblems = [];
try {
  publishedProblems = JSON.parse(fs.readFileSync('problem-of-day/published-problems.json', 'utf8'));
} catch (e) {
  console.log('No existing problems file, creating new one');
}

// Get all available problems
const problemSources = ['DanShuster-180-days', 'open-middle'];
const availableProblems = [];

problemSources.forEach(source => {
  const sourceDir = path.join('problem-of-day/problems', source);
  let metadata = {};
  try {
    metadata = JSON.parse(fs.readFileSync(path.join(sourceDir, 'metadata.json'), 'utf8'));
  } catch (e) {
    console.error(`Missing or invalid metadata.json in ${sourceDir}`);
    return; // Skip this source
  }
  
  // Get all image files in the directory
  const files = fs.readdirSync(sourceDir)
    .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
    .map(file => ({
      id: `${source}-${path.basename(file, path.extname(file))}`,
      source: metadata.name,
      copyright: metadata.copyright,
      sourceUrl: metadata.url,
      path: path.join(source, file)
    }));
    
  availableProblems.push(...files);
});

// Filter out already published problems
const publishedIds = publishedProblems.map(p => p.id);
const unpublishedProblems = availableProblems.filter(p => !publishedIds.includes(p.id));

if (unpublishedProblems.length === 0) {
  console.log('No unpublished problems available');
  process.exit(0);
}

// Select random problem
const todaysProblem = unpublishedProblems[Math.floor(Math.random() * unpublishedProblems.length)];

// Get date from command line argument or use current date
let targetDate;
if (process.argv.length > 2) {
  // Validate the date format: YYYY-MM-DD
  const dateArg = process.argv[2];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
    targetDate = dateArg;
  } else {
    console.error('Invalid date format. Please use YYYY-MM-DD');
    process.exit(1);
  }
} else {
  // Use current date if no argument is provided
  targetDate = new Date().toISOString().split('T')[0];
}

console.log(`Using date: ${targetDate}`);

// Check if a problem already exists for this date
const existingProblemIndex = publishedProblems.findIndex(p => p.date === targetDate);
if (existingProblemIndex !== -1) {
  console.log(`Warning: A problem already exists for ${targetDate}. Overwriting...`);
  publishedProblems.splice(existingProblemIndex, 1);
}

// Prepare problem entry
const problemEntry = {
  id: todaysProblem.id,
  date: targetDate,
  path: path.basename(todaysProblem.path),
  source: todaysProblem.source,
  copyright: todaysProblem.copyright,
  sourceUrl: todaysProblem.sourceUrl
};

// Create assets directory if it doesn't exist
const assetsDir = 'problem-of-day/assets';
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Copy and optimize image
const sourcePath = path.join('problem-of-day/problems', todaysProblem.path);
const destPath = path.join(assetsDir, `${targetDate}-problem${path.extname(todaysProblem.path)}`);

// Process image with sharp (resize/optimize)
sharp(sourcePath)
  .resize(800, null, { fit: 'inside', withoutEnlargement: true })
  .toFile(destPath)
  .then(() => {
    // Add to published problems
    publishedProblems.push(problemEntry);
    
    // Save updated problem list
    fs.writeFileSync(
      'problem-of-day/published-problems.json', 
      JSON.stringify(publishedProblems, null, 2)
    );
    
    console.log(`Published problem for ${targetDate}: ${todaysProblem.id}`);
  })
  .catch(err => {
    console.error('Error processing image:', err);
    process.exit(1);
  });