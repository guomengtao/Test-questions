// Dynamic Navigation Inclusion
document.addEventListener('DOMContentLoaded', function() {
    // Fetch the navigation HTML
    fetch('src/navigation.html')
        .then(response => response.text())
        .then(html => {
            // Create a temporary div to parse the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // Insert top navbar before the first child of the body
            const navbarElement = tempDiv.querySelector('.navbar');
            if (navbarElement && document.body.firstChild) {
                document.body.insertBefore(navbarElement, document.body.firstChild);
            }

            // Insert sidebar after the navbar
            const sidebarElement = tempDiv.querySelector('#sidebar');
            if (sidebarElement) {
                const mainContainer = document.querySelector('.container') || document.querySelector('.container-fluid');
                if (mainContainer) {
                    mainContainer.insertAdjacentElement('afterbegin', sidebarElement);
                }
            }

            // Insert footer at the end of the body
            const footerElement = tempDiv.querySelector('footer');
            if (footerElement) {
                document.body.appendChild(footerElement);
            }

            // Inject additional styles and scripts
            const styleElement = tempDiv.querySelector('style');
            if (styleElement) {
                document.head.appendChild(styleElement.cloneNode(true));
            }

            // Ensure Bootstrap and Bootstrap Icons are loaded
            if (!document.querySelector('link[href*="bootstrap.min.css"]')) {
                const bootstrapCSS = document.createElement('link');
                bootstrapCSS.rel = 'stylesheet';
                bootstrapCSS.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
                document.head.appendChild(bootstrapCSS);
            }

            if (!document.querySelector('link[href*="bootstrap-icons"]')) {
                const bootstrapIcons = document.createElement('link');
                bootstrapIcons.rel = 'stylesheet';
                bootstrapIcons.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css';
                document.head.appendChild(bootstrapIcons);
            }

            // Load Bootstrap JS if not already loaded
            if (!window.bootstrap) {
                const bootstrapJS = document.createElement('script');
                bootstrapJS.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js';
                document.body.appendChild(bootstrapJS);
            }
        })
        .catch(error => {
            console.error('Navigation inclusion failed:', error);
        });
});
