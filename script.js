// Menu mobile et navigation
        document.addEventListener('DOMContentLoaded', function() {
            const menuToggle = document.getElementById('menuToggle');
            const navLinks = document.getElementById('navLinks');
            const closeMenu = document.getElementById('closeMenu');
            const navItems = document.querySelectorAll('.nav-link');
            
            // Fonction pour fermer le menu
            function closeMobileMenu() {
                navLinks.classList.remove('active');
            }
            
            // Ouvrir le menu
            if (menuToggle && navLinks) {
                menuToggle.addEventListener('click', function() {
                    navLinks.classList.add('active');
                });
            }
            
            // Fermer le menu avec la croix
            if (closeMenu) {
                closeMenu.addEventListener('click', closeMobileMenu);
            }
            
            // Navigation vers les sections
            navItems.forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Fermer le menu mobile après avoir cliqué sur un lien
                    closeMobileMenu();
                    
                    const targetId = this.getAttribute('href');
                    if (targetId && targetId !== '#') {
                        const targetSection = document.querySelector(targetId);
                        if (targetSection) {
                            window.scrollTo({
                                top: targetSection.offsetTop - 80, // Ajuster selon la hauteur de votre navbar
                                behavior: 'smooth'
                            });
                        }
                    }
                });
            });
            
            // Gestion du bouton back to top
            const backToTopButton = document.getElementById('backToTop');
            if (backToTopButton) {
                backToTopButton.addEventListener('click', () => {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                });
                
                // Afficher ou masquer le bouton selon la position de défilement
                window.addEventListener('scroll', () => {
                    if (window.pageYOffset > 300) {
                        backToTopButton.style.display = 'block';
                    } else {
                        backToTopButton.style.display = 'none';
                    }
                });
            }
        });