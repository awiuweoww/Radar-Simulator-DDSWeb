document.addEventListener('DOMContentLoaded', () => {
    const contentContainer = document.querySelector('.content');
    const navLinks = document.querySelectorAll('.nav-link, .nav-group-title');

    /**
     * Fungsi utama untuk memuat halaman secara dinamis
     */
    async function loadPage(url, pushState = true) {
        try {
            // 1. Efek transisi keluar
            contentContainer.style.opacity = '0.4';
            contentContainer.style.filter = 'blur(2px)';

            const response = await fetch(url);
            if (!response.ok) throw new Error('Halaman tidak ditemukan');
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newContent = doc.querySelector('.content').innerHTML;

            // 2. Update Konten & Judul
            contentContainer.innerHTML = newContent;
            document.title = doc.title;

            // 3. Update URL browser
            if (pushState) {
                history.pushState({ url }, '', url);
            }

            // 4. Reset Scroll ke atas (Hanya jika tidak ada hash di URL)
            if (!url.includes('#')) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            // 5. Re-inisialisasi library pihak ketiga (seperti Mermaid)
            if (window.mermaid) {
                window.mermaid.contentLoaded();
                // Untuk versi terbaru gunakan: window.mermaid.init();
            }

            // 6. Efek transisi masuk
            contentContainer.style.opacity = '1';
            contentContainer.style.filter = 'none';

            // 7. Update status 'active' di sidebar & Buka dropdown-nya
            updateActiveLink(url);
            expandActiveGroup();
            wrapTables();

        } catch (error) {
            console.error('Gagal memuat halaman:', error);
            window.location.href = url; // Fallback ke reload biasa jika gagal
        }
    }

    /**
     * Menandai link yang aktif di sidebar
     */
    function updateActiveLink(url) {
        const fullPath = url.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            // Cek kecocokan persis (termasuk hash jika ada)
            if (href === fullPath) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * Intercept semua klik pada link navigasi
     */
    document.addEventListener('click', (e) => {
        // Handle klik Dropdown/Accordion pada Judul Bab
        const groupTitle = e.target.closest('.nav-group-title');
        if (groupTitle) {
            e.preventDefault();
            const group = groupTitle.parentElement;
            
            // Tutup group lain yang terbuka (Optional: jika ingin mode accordion murni)
            document.querySelectorAll('.nav-group.expanded').forEach(g => {
                if (g !== group) g.classList.remove('expanded');
            });

            group.classList.toggle('expanded');
            
            // Jika judul bab memiliki link sendiri, muat halamannya
            const href = groupTitle.getAttribute('href');
            if (href && href !== '#' && !href.includes('#')) {
                loadPage(href);
            }
            return;
        }

        const link = e.target.closest('.nav-link');
        if (!link) return;

        const href = link.getAttribute('href');
        
        // Lewati jika external link atau hash link di halaman yang sama
        if (href.startsWith('http') || href.startsWith('mailto:')) return;
        
        if (href.includes('#')) {
            const [page, id] = href.split('#');
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            
            // Jika pindah halaman tapi ada hash
            if (page !== '' && page !== currentPage) {
                e.preventDefault();
                loadPage(page).then(() => {
                    setTimeout(() => {
                        const target = document.getElementById(id);
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                    }, 100); // Beri jeda sedikit agar konten ter-render
                });
                return;
            }
            
            // Jika hash di halaman yang sama, lakukan smooth scroll
            e.preventDefault();
            const target = document.getElementById(id);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                history.pushState(null, null, href);
                updateActiveLink(href);
            }
            return;
        }

        // Handle navigasi antar file .html
        if (href.endsWith('.html') || href === '/') {
            e.preventDefault();
            loadPage(href);
        }
    });

    /**
     * Handle tombol Back/Forward browser
     */
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.url) {
            loadPage(e.state.url, false);
        } else {
            loadPage(window.location.pathname, false);
        }
    });

    /**
     * Otomatis membuka folder bab yang di dalamnya ada link aktif
     */
    function expandActiveGroup() {
        const activeLink = document.querySelector('.nav-link.active');
        if (activeLink) {
            const group = activeLink.closest('.nav-group');
            if (group) group.classList.add('expanded');
        }
    }

    /**
     * Membungkus tabel dengan container scroll agar tidak terpotong
     */
    function wrapTables() {
        document.querySelectorAll('.simple-table').forEach(table => {
            if (table.parentElement.classList.contains('table-container')) return;
            const wrapper = document.createElement('div');
            wrapper.className = 'table-container';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });
    }

    // Inisialisasi awal
    updateActiveLink(window.location.pathname);
    expandActiveGroup();
    wrapTables();
    
    // Tambahkan transisi CSS via JS
    contentContainer.style.transition = 'opacity 0.3s ease, filter 0.3s ease';
});
