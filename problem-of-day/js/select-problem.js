const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // For image processing

// Set up base paths
const baseDir = path.resolve(__dirname, '..');
const problemsDir = path.join(baseDir, 'problems');
const assetsDir = path.join(baseDir, 'assets');
const publishedProblemsPath = path.join(baseDir, 'published-problems.json');

// Load previously published problems
let publishedProblems = [];
try {
  publishedProblems = JSON.parse(fs.readFileSync(publishedProblemsPath, 'utf8'));
  console.log(`Loaded ${publishedProblems.length} published problems`);
} catch (e) {
  console.log('No existing problems file, creating new one');
}

// Get all available problems
const problemSources = ['DanShuster-180-days', 'open-middle'];
const availableProblems = [];

problemSources.forEach(source => {
  const sourceDir = path.join(problemsDir, source);
  
  // Check if directory exists
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory not found: ${sourceDir}`);
    return;
  }
  
  let metadata = {};
  try {
    metadata = JSON.parse(fs.readFileSync(path.join(sourceDir, 'metadata.json'), 'utf8'));
  } catch (e) {
    console.error(`Missing or invalid metadata.json in ${sourceDir}: ${e.message}`);
    return; // Skip this source
  }
  
  console.log(`Processing source: ${source}`);
  
  // Get all image files in the directory
  let files;
  try {
    files = fs.readdirSync(sourceDir)
      .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
      .map(file => {
        // Extract just the number part for the ID to avoid duplication
        const basename = path.basename(file, path.extname(file));
        // Fix the ID generation to prevent duplication
        const fileId = basename.replace(`${source}-`, '');
        return {
          id: `${source}-${fileId}`,
          source: metadata.name,
          copyright: metadata.copyright,
          sourceUrl: metadata.url,
          path: path.join(source, file)
        };
      });
      
    console.log(`Found ${files.length} problems in ${source}`);
    availableProblems.push(...files);
  } catch (e) {
    console.error(`Error reading directory ${sourceDir}: ${e.message}`);
  }
});

// Filter out already published problems
const publishedIds = publishedProblems.map(p => p.id);
const unpublishedProblems = availableProblems.filter(p => !publishedIds.includes(p.id));

console.log(`Found ${unpublishedProblems.length} unpublished problems`);

if (unpublishedProblems.length === 0) {
  console.log('No unpublished problems available');
  process.exit(0);
}

// Select random problem
const todaysProblem = unpublishedProblems[Math.floor(Math.random() * unpublishedProblems.length)];
console.log(`Selected problem: ${todaysProblem.id}`);

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
if (!fs.existsSync(assetsDir)) {
  console.log(`Creating assets directory: ${assetsDir}`);
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Copy and optimize image
const sourcePath = path.join(problemsDir, todaysProblem.path);
const destPath = path.join(assetsDir, `${targetDate}-problem${path.extname(todaysProblem.path)}`);

// Verify source file exists
if (!fs.existsSync(sourcePath)) {
  console.error(`Error: Source file not found: ${sourcePath}`);
  process.exit(1);
}

console.log(`Processing image: ${sourcePath} -> ${destPath}`);

// Process image with sharp (resize/optimize)
sharp(sourcePath)
  .resize(800, null, { fit: 'inside', withoutEnlargement: true })
  .toFile(destPath)
  .then(() => {
    // Add to published problems
    publishedProblems.push(problemEntry);
    
    // Save updated problem list
    fs.writeFileSync(
      publishedProblemsPath,
      JSON.stringify(publishedProblems, null, 2)
    );
    
    console.log(`Published problem for ${targetDate}: ${todaysProblem.id}`);
  })
  .catch(err => {
    console.error('Error processing image:', err);
    process.exit(1);
  });