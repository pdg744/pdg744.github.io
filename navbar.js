// Navigation structure
const navItems = [
    { href: 'about.html', text: 'About' },
    { href: 'math-circles.html', text: 'Math Circles' },
    { href: 'consulting.html', text: 'Consulting' },
    { href: 'resources.html', text: 'Resources' },
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
    
    // Update footer navigation
    const footerNav = document.querySelector('.footer-links');
    if (footerNav) {
        footerNav.innerHTML = createNavHTML(currentPage);
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