document.addEventListener('DOMContentLoaded', function() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const requestedDate = urlParams.get('date');
    
    // Share button functionality
    const shareButton = document.getElementById('share-button');
    if (shareButton) {
      shareButton.addEventListener('click', function() {
        const url = window.location.href;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url)
            .then(() => {
              const originalTitle = shareButton.title;
              shareButton.title = 'Copied!';
              setTimeout(() => {
                shareButton.title = originalTitle;
              }, 2000);
            })
            .catch(() => fallbackCopy(url));
        } else {
          fallbackCopy(url);
        }
      });
    }
    
    // Load problem data
    loadProblem(requestedDate);
  });
  
  async function loadProblem(requestedDate) {
    const problemContent = document.getElementById('problem-content');
    
    try {
      // Fetch the published problems
      const response = await fetch('./published-problems.json');
      if (!response.ok) {
        throw new Error(`Failed to load problems: ${response.status}`);
      }
      
      const problems = await response.json();
      if (!problems || problems.length === 0) {
        problemContent.innerHTML = `
          <div class="error-message">
            <p>No problems have been published yet. Check back soon!</p>
          </div>
        `;
        return;
      }
      
      // Sort by date (newest first)
      problems.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Find requested problem or default to today's date in user's timezone
      let problem;
      let problemIndex;
      
      if (requestedDate) {
        // User requested a specific date
        // If multiple problems share the same date, get the first one
        problemIndex = problems.findIndex(p => p.date === requestedDate);
        if (problemIndex !== -1) {
          problem = problems[problemIndex];
        } else {
          // If date not found, show error
          problemContent.innerHTML = `
            <div class="error-message">
              <p>No problem found for the requested date (${requestedDate}).</p>
              <p><a href="./">View today's problem instead</a></p>
            </div>
          `;
          return;
        }
      } else {
        // Find the problem for today in the user's local timezone
        // Get today's date in YYYY-MM-DD format in user's local timezone
        const now = new Date();
        const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        console.log(`User's local date: ${localDateStr}`);
        
        // Try to find a problem with today's local date
        problemIndex = problems.findIndex(p => p.date === localDateStr);
        
        // If no problem for today's local date, find the most recent one
        if (problemIndex === -1) {
          // Find the closest date that's earlier than or equal to today
          for (let i = 0; i < problems.length; i++) {
            if (problems[i].date <= localDateStr) {
              problemIndex = i;
              break;
            }
          }
          
          // If still no match, use the most recent problem
          if (problemIndex === -1) {
            problemIndex = 0;
          }
        }
        
        problem = problems[problemIndex];
      }
      
      // Format date for display - parse it based on YYYY-MM-DD format explicitly
      const [year, month, day] = problem.date.split('-').map(Number);
      const problemDate = new Date(year, month - 1, day); // Month is 0-indexed in JavaScript Date
      
      const formattedDate = problemDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Set up navigation links
      // Find previous problem with a different date
      let prevIndex = problemIndex + 1;
      while (prevIndex < problems.length && problems[prevIndex].date === problem.date) {
        prevIndex++;
      }

      // Find next problem with a different date
      let nextIndex = problemIndex - 1;
      while (nextIndex >= 0 && problems[nextIndex].date === problem.date) {
        nextIndex--;
      }

      const prevProblem = prevIndex < problems.length ? 
        `<a href="?date=${problems[prevIndex].date}" class="date-nav-button">
          <i class="fas fa-chevron-left"></i> Previous
        </a>` : 
        `<div class="date-nav-placeholder"></div>`;
        
      const nextProblem = nextIndex >= 0 ? 
        `<a href="?date=${problems[nextIndex].date}" class="date-nav-button">
          Next <i class="fas fa-chevron-right"></i>
        </a>` : 
        `<div class="date-nav-placeholder"></div>`;
      
      // Construct the problem content
      problemContent.innerHTML = `
        <div class="problem-badge">Problem of the Day</div>
        
        <img src="./assets/${problem.date}-problem${getFileExtension(problem.path || '')}" 
             alt="Math problem for ${formattedDate}" 
             class="problem-image"
             onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\\'error-message\\'><p>Unable to load problem image. Please try again later.</p></div>';">
        
        <div class="problem-metadata">
          <div class="metadata-row">
            <div class="date-navigation">
              ${prevProblem}
              <div class="problem-date">${formattedDate}</div>
              ${nextProblem}
            </div>
            <div class="copyright-container">
              <i class="fas fa-copyright copyright-icon"></i>
              <span class="copyright-tooltip">${problem.copyright || 'Copyright information unavailable'}</span>
            </div>
          </div>
          <p class="problem-source">Source: <a href="${problem.sourceUrl || '#'}" target="_blank">${problem.source || 'Unknown'}</a></p>
        </div>
      `;
    } catch (error) {
      console.error('Error loading problem:', error);
      problemContent.innerHTML = `
        <div class="error-message">
          <p>An error occurred while loading the problem. Please try again later.</p>
        </div>
      `;
    }
  }
  
  function fallbackCopy(text) {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }

  // Helper function to get file extension
  function getFileExtension(filename) {
    if (!filename) return '.png';
    return filename.substring(filename.lastIndexOf('.'));
  }