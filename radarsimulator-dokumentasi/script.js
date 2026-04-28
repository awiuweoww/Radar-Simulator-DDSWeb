document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    // Event Listener untuk Klik (Hanya Smooth Scroll)
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.includes('#')) {
                const [page, id] = href.split('#');
                if (page === '' || page === currentPath) {
                    const targetSection = document.getElementById(id);
                    if (targetSection) {
                        e.preventDefault();
                        
                        const headerOffset = 60;
                        const elementPosition = targetSection.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                        
                        history.pushState(null, null, `#${id}`);
                    }
                }
            }
        });
    });
});
