// Navigation structure
const navItems = [
    { href: 'about.html', text: 'About' },
    { href: 'math-circles.html', text: 'Math Circles' },
    { href: 'problem-of-day', text: 'Problem of the Day' },
    { href: 'resources.html', text: 'Resources' },
    { href: 'donate.html', text: 'Support Us' },
    { href: 'contact.html', text: 'Contact' }
];

// Function to create navigation HTML
function createNavHTML(currentPage) {
    return navItems.map(item => {
        const isCurrent = item.href === currentPage;
        return `<li><a href="${item.href}"${isCurrent ? ' aria-current="page"' : ''}>${item.text}</a></li>`;
    }).join('\n                ');
}

// Function to initialize navigation
function initNavigation() {
    // Get current page filename
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Update main navigation
    const mainNav = document.querySelector('.nav-links');
    if (mainNav) {
        mainNav.innerHTML = createNavHTML(currentPage);
    }
    
    // Update footer with logo and whitepaper button
    const footerContent = document.querySelector('.footer-content');
    if (footerContent) {
        footerContent.innerHTML = `
            <img src="math-explorers-logo.png" alt="Math Explorers Logo" class="logo">
            <a href="whitepaper.html" class="footer-outline-button">Read the Whitepaper</a>
        `;
    }

    // Initialize mobile menu
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuButton && navLinks) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenuButton.classList.toggle('active');
            navLinks.classList.toggle('active');
            mobileMenuButton.setAttribute('aria-expanded', 
                mobileMenuButton.classList.contains('active'));
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initNavigation); 