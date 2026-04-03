/**
 * BIRCH SAP - refreshed frontend logic
 */

gsap.registerPlugin(ScrollTrigger);

const preloader = document.getElementById('preloader');
const mainNav = document.getElementById('mainNav');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const progressIndicator = document.getElementById('progressIndicator');
const progressDots = document.querySelectorAll('.progress-dot');
const navLinks = document.querySelectorAll('.nav-link');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const horizontalContainer = document.getElementById('horizontalContainer');
let sections = horizontalContainer
    ? Array.from(horizontalContainer.querySelectorAll(':scope > section.section'))
    : [];
if (!sections.length) {
    sections = Array.from(document.querySelectorAll('.section'));
}

let galleryMainSwiper = null;
let galleryThumbsSwiper = null;

let centerProjectsActiveCard = () => { };

let currentSection = 0;
let activeObservers = [];
let lastKnownScrollY = 0;

function setViewportSizeVars() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--app-height', `${vh}px`);
    document.documentElement.style.setProperty('--app-width', `${window.innerWidth}px`);
}

function applyStableLayout() {
    document.body.classList.add('vertical-layout');

    if (horizontalContainer) {
        horizontalContainer.style.transform = 'none';
        horizontalContainer.style.width = '100%';
        horizontalContainer.style.flexDirection = 'column';
    }

    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
}

function runPreloader() {
    if (!preloader) {
        initApp();
        return;
    }

    const progressBar = document.querySelector('.progress-bar');
    let progress = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 28;
        if (progressBar) {
            progressBar.style.width = `${Math.min(progress, 100)}%`;
        }

        if (progress >= 100) {
            clearInterval(interval);
            preloader.classList.add('hidden');
            document.body.style.overflow = '';
            const sapOverlay = document.querySelector('.hero-sap-overlay');
            if (sapOverlay) {
                setTimeout(() => sapOverlay.classList.add('visible'), 300);
            }
            initApp();
        }
    }, 180);
}

function initCursor() {
    if (!cursor || !cursorFollower) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.1,
            ease: 'power2.out'
        });

        gsap.to(cursorFollower, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.25,
            ease: 'power2.out'
        });
    });

    document.querySelectorAll('a, button, .gallery-item, .video-card, .grid-item').forEach((el) => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
            cursorFollower.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
            cursorFollower.classList.remove('hover');
        });
    });
}

function closeMobileMenu() {
    if (!mobileMenuBtn || !mobileMenu) return;
    mobileMenuBtn.classList.remove('active');
    mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
}

function scrollToSection(index) {
    const target = sections[index];
    if (!target) return;

    closeMobileMenu();

    const navHeight = mainNav ? mainNav.offsetHeight : 0;
    const targetTop = window.scrollY + target.getBoundingClientRect().top - navHeight - 12;

    window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth'
    });
}

function setActiveSection(index) {
    currentSection = index;

    progressDots.forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === index);
    });

    navLinks.forEach((link) => {
        const target = Number.parseInt(link.dataset.section, 10);
        link.classList.toggle('active', !Number.isNaN(target) && target === index);
    });

    mobileNavLinks.forEach((link) => {
        const target = Number.parseInt(link.dataset.section, 10);
        link.classList.toggle('active', !Number.isNaN(target) && target === index);
    });

    sections.forEach((section, sectionIndex) => {
        section.classList.toggle('active-section', sectionIndex === index);
    });
}

function detectActiveSection() {
    const navHeight = mainNav ? mainNav.offsetHeight : 0;
    const probeLine = navHeight + window.innerHeight * 0.35;

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - probeLine);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
        }
    });

    setActiveSection(closestIndex);
}

function initSectionTracking() {
    activeObservers.forEach(observer => observer.disconnect());
    activeObservers = [];

    const observer = new IntersectionObserver((entries) => {
        let changed = false;

        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const index = sections.indexOf(entry.target);
            if (index !== -1) {
                setActiveSection(index);
                changed = true;
            }
        });

        if (!changed) {
            detectActiveSection();
        }
    }, {
        threshold: [0.35, 0.55, 0.75],
        rootMargin: '-15% 0px -35% 0px'
    });

    sections.forEach(section => observer.observe(section));
    activeObservers.push(observer);
    detectActiveSection();
}

function initNavigation() {
    window.addEventListener('scroll', () => {
        lastKnownScrollY = window.scrollY;

        if (mainNav) {
            mainNav.classList.toggle('scrolled', window.scrollY > 24);
        }

        detectActiveSection();
    }, { passive: true });

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            const open = !mobileMenu.classList.contains('active');
            mobileMenuBtn.classList.toggle('active', open);
            mobileMenu.classList.toggle('active', open);
            mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
            mobileMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
            mobileMenuBtn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
            document.body.style.overflow = open ? 'hidden' : '';
        });
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.setAttribute('aria-controls', 'mobileMenu');
    }

    mobileNavLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionIndex = Number.parseInt(link.dataset.section, 10);
            if (!Number.isNaN(sectionIndex)) {
                scrollToSection(sectionIndex);
            }
            if (mobileMenuBtn && mobileMenu) {
                mobileMenuBtn.classList.remove('active');
                mobileMenu.classList.remove('active');
                mobileMenu.setAttribute('aria-hidden', 'true');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                mobileMenuBtn.setAttribute('aria-label', 'Открыть меню');
                document.body.style.overflow = '';
            }
        });
    });

    navLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionIndex = Number.parseInt(link.dataset.section, 10);
            if (!Number.isNaN(sectionIndex)) {
                scrollToSection(sectionIndex);
            }
        });
    });

    progressDots.forEach((dot, index) => {
        dot.addEventListener('click', () => scrollToSection(index));
    });
}

function initHeroAnimations() {
    const heroTimeline = gsap.timeline({ delay: 0.2 });

    heroTimeline
        .from('.hero-badge', { y: 24, opacity: 0, duration: 0.5, ease: 'power3.out' })
        .from('.hero-title .title-line', {
            y: 42,
            opacity: 0,
            duration: 0.65,
            stagger: 0.1,
            ease: 'power3.out'
        }, '-=0.2')
        .from('.hero-buttons .btn', { y: 20, opacity: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' }, '-=0.35')
        .from('.stat-item', { y: 18, opacity: 0, duration: 0.35, stagger: 0.08, ease: 'power3.out' }, '-=0.2')
        .from('.bottle-container', { scale: 0.88, opacity: 0, duration: 0.8, ease: 'back.out(1.4)' }, '-=0.8')
        .from('.floating-drop, .floating-leaf', { scale: 0, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'back.out(1.5)' }, '-=0.35');
}

function animateCounters() {
    const counters = document.querySelectorAll('.hero-stats .stat-number');

    counters.forEach((counter) => {
        const target = Number.parseInt(counter.dataset.count, 10);
        if (Number.isNaN(target)) return;

        const startAnimation = () => {
            const duration = 1800;
            const startTime = performance.now();

            function updateCounter(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                counter.textContent = Math.round(target * eased);

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                }
            }

            requestAnimationFrame(updateCounter);
        };

        const observer = new IntersectionObserver((entries, currentObserver) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                startAnimation();
                currentObserver.unobserve(entry.target);
            });
        }, { threshold: 0.5 });

        observer.observe(counter);
        activeObservers.push(observer);
    });
}

function initSectionAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const section = entry.target;

            const header = section.querySelector('.section-header');
            if (header) {
                gsap.from(header, {
                    y: 40,
                    opacity: 0,
                    duration: 0.7,
                    ease: 'power3.out'
                });
            }

            const animatedItems = section.querySelectorAll('.gallery-item, .grid-item, .video-card, .feature-item, .contact-item, .footer-column, .game-container, .report-lead-content, .prodazha-content, .prices-map-panel, .legal-warning-panel, .gunya-panel, .ground-panel, .begin-fresh-panel, .zasechki-panel, .firs-etap-content, .process-collect-photos, .process-collect-text-wrap');
            if (animatedItems.length) {
                gsap.from(animatedItems, {
                    y: 32,
                    duration: 0.55,
                    stagger: 0.08,
                    ease: 'power3.out'
                });
            }

            observer.unobserve(section);
        });
    }, { threshold: 0.1 });

    sections.forEach((section) => {
        if (section.id === 'hero') return;
        observer.observe(section);
    });
}

function initAboutAnimations() {
    const aboutSection = document.getElementById('about');
    if (!aboutSection) return;

    const aboutImages = aboutSection.querySelectorAll('.about-image');
    if (aboutImages.length) {
        gsap.from(aboutImages, {
            scale: 0.92,
            opacity: 0,
            duration: 0.75,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: aboutSection,
                start: 'top 70%',
                toggleActions: 'play none none none'
            }
        });
    }
}

function initBenefitsAnimations() {
    const chartBars = document.querySelectorAll('.chart-bar');
    const compositionChart = document.querySelector('.composition-chart');
    if (!chartBars.length || !compositionChart) return;

    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            chartBars.forEach((bar, index) => {
                const width = bar.dataset.width;
                const barFill = bar.querySelector('.bar-fill');

                if (!barFill || !width) return;

                setTimeout(() => {
                    barFill.style.setProperty('--bar-width', `${width}%`);
                    bar.classList.add('animate');
                }, index * 100);
            });

            currentObserver.unobserve(entry.target);
        });
    }, { threshold: 0.4 });

    observer.observe(compositionChart);
    activeObservers.push(observer);
}

function initTiltEffect() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    document.querySelectorAll('[data-tilt]').forEach((el) => {
        if (el.closest('#game')) return;

        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            gsap.to(el, {
                rotateX: (y - centerY) / 14,
                rotateY: (centerX - x) / 14,
                duration: 0.25,
                ease: 'power2.out',
                transformPerspective: 1000
            });
        });

        el.addEventListener('mouseleave', () => {
            gsap.to(el, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.4,
                ease: 'power2.out'
            });
        });
    });
}

function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    container.innerHTML = '';

    const particleCount = window.innerWidth > 768 ? 25 : 12;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.width = `${Math.random() * 8 + 4}px`;
        particle.style.height = particle.style.width;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        particle.style.animationDuration = `${Math.random() * 10 + 10}s`;
        container.appendChild(particle);
    }
}

function initSwiper() {
    if (!document.getElementById('gallerySlider') || !document.getElementById('galleryThumbs')) return;

    const trackpadHorizontalWheel = {
        forceToAxis: true,
        sensitivity: 1,
        releaseOnEdges: true,
        thresholdDelta: 8,
        thresholdTime: 400
    };

    galleryThumbsSwiper = new Swiper('#galleryThumbs', {
        spaceBetween: 10,
        slidesPerView: 4,
        freeMode: true,
        watchSlidesProgress: true,
        touchReleaseOnEdges: true,
        grabCursor: true,
        mousewheel: trackpadHorizontalWheel,
        breakpoints: {
            320: { slidesPerView: 3 },
            768: { slidesPerView: 4 },
            1200: { slidesPerView: 6 }
        }
    });

    galleryMainSwiper = new Swiper('#gallerySlider', {
        spaceBetween: 0,
        effect: 'fade',
        fadeEffect: { crossFade: true },
        touchReleaseOnEdges: true,
        grabCursor: true,
        mousewheel: trackpadHorizontalWheel,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
            dynamicBullets: true
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev'
        },
        thumbs: {
            swiper: galleryThumbsSwiper
        },
        autoplay: {
            delay: 5000,
            disableOnInteraction: false
        },
        keyboard: {
            enabled: true
        }
    });
}

function initProjectsHorizontalScroll() {
    const viewport = document.querySelector('.projects-viewport');
    if (!viewport) return;

    const mq = window.matchMedia('(max-width: 992px)');

    centerProjectsActiveCard = function centerActiveCard() {
        if (!mq.matches) return;
        const active = viewport.querySelector('.project-card.is-active');
        if (!active) return;
        active.scrollIntoView({
            inline: 'center',
            block: 'nearest',
            behavior: 'instant'
        });
    };

    mq.addEventListener('change', centerProjectsActiveCard);

    requestAnimationFrame(() => requestAnimationFrame(centerProjectsActiveCard));
}

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    if (!lightbox || !lightboxImage || !lightboxCaption || !lightboxClose || !lightboxPrev || !lightboxNext) return;

    const galleryItems = document.querySelectorAll('[data-lightbox]');
    let currentImageIndex = 0;
    const images = [];

    function getLightboxImgUrl(img) {
        if (!img) return '';
        return img.dataset.deferSrc || img.dataset.lazySrc || img.currentSrc || img.src || '';
    }

    galleryItems.forEach((item, index) => {
        const img = item.querySelector('img');
        if (!img) return;

        images.push({
            img,
            caption: item.querySelector('.gallery-caption h4')?.textContent || ''
        });

        item.addEventListener('click', () => {
            currentImageIndex = index;
            openLightbox(currentImageIndex);
        });
    });

    function openLightbox(index) {
        lightboxImage.src = getLightboxImgUrl(images[index].img);
        lightboxCaption.textContent = images[index].caption;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function updateLightboxImage() {
        gsap.to(lightboxImage, {
            opacity: 0,
            duration: 0.15,
            onComplete: () => {
                lightboxImage.src = getLightboxImgUrl(images[currentImageIndex].img);
                lightboxCaption.textContent = images[currentImageIndex].caption;
                gsap.to(lightboxImage, { opacity: 1, duration: 0.15 });
            }
        });
    }

    function showNextImage() {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        updateLightboxImage();
    }

    function showPrevImage() {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        updateLightboxImage();
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', showNextImage);
    lightboxPrev.addEventListener('click', showPrevImage);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNextImage();
        if (e.key === 'ArrowLeft') showPrevImage();
    });
}

function initVideoModal() {
    const videoModal = document.getElementById('videoModal');
    const videoFrame = document.getElementById('videoFrame');
    const videoModalClose = document.getElementById('videoModalClose');
    const videoCards = document.querySelectorAll('[data-video]');

    if (!videoModal || !videoFrame || !videoModalClose || !videoCards.length) return;

    const videoUrls = [
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
        'https://www.youtube.com/embed/dQw4w9WgXcQ'
    ];

    function closeVideoModal() {
        videoModal.classList.remove('active');
        videoFrame.src = '';
        document.body.style.overflow = '';
    }

    videoCards.forEach((card, index) => {
        card.addEventListener('click', () => {
            videoFrame.src = `${videoUrls[index]}?autoplay=1`;
            videoModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    videoModalClose.addEventListener('click', closeVideoModal);
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            closeVideoModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal.classList.contains('active')) {
            closeVideoModal();
        }
    });
}

function showNotification(message) {
    if (!notification || !notificationText) return;
    notificationText.textContent = message;
    notification.classList.add('active');

    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}

function handleSubscribe(e) {
    e.preventDefault();
    const input = e.target.querySelector('input');
    if (!input || !input.value.trim()) return;

    showNotification('Спасибо за подписку! Мы будем держать вас в курсе новостей.');
    input.value = '';
}

function initKeyboardNav() {
    document.addEventListener('keydown', (e) => {
        if (document.querySelector('.lightbox.active') || document.querySelector('.video-modal.active')) return;

        const gameSection = document.getElementById('game');
        if (gameSection && gameSection.classList.contains('active-section')) return;

        if (e.key === 'ArrowRight') {
            scrollToSection(Math.min(currentSection + 1, sections.length - 1));
        } else if (e.key === 'ArrowLeft') {
            scrollToSection(Math.max(currentSection - 1, 0));
        }
    });
}

function initTouchSupport() {
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    const minSwipeDistance = 60;
    const maxSwipeTime = 350;

    document.addEventListener('touchstart', (e) => {
        if (e.target.closest('#game')) return;
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        touchStartTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (e.target.closest('#game')) return;

        touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const timeDiff = Date.now() - touchStartTime;
        const yDiff = Math.abs(touchEndY - touchStartY);

        if (timeDiff > maxSwipeTime || yDiff > 100) return;

        const swipeDistance = touchEndX - touchStartX;
        if (Math.abs(swipeDistance) < minSwipeDistance) return;

        if (swipeDistance > 0) {
            scrollToSection(Math.max(currentSection - 1, 0));
        } else {
            scrollToSection(Math.min(currentSection + 1, sections.length - 1));
        }
    }, { passive: true });
}

function initBottleAnimation() {
    const bottleLiquid = document.getElementById('bottleLiquid');
    if (!bottleLiquid) return;

    gsap.to(bottleLiquid, {
        backgroundPosition: '0% 100%',
        duration: 3,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
    });
}

function initPerformanceOptimizations() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.removeAttribute('loading');
                observer.unobserve(img);
            });
        });

        lazyImages.forEach((img) => imageObserver.observe(img));
        activeObservers.push(imageObserver);
    }
}

function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    if (!backToTopBtn) return;

    const toggleBackToTop = () => {
        backToTopBtn.classList.toggle('visible', window.scrollY > 500);
    };

    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function checkReducedMotion() {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.globalTimeline.timeScale(0);
    document.querySelectorAll('.section').forEach((section) => {
        section.style.opacity = '1';
        section.style.transform = 'none';
    });
}

function formatVideoTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function initVerticalVideoPlayer() {
    const root = document.getElementById('verticalVideoPlayer');
    if (!root) return;
    const video = root.querySelector('video');
    if (!video) return;

    const bigPlay = root.querySelector('.custom-video__big-play');
    const toggleBtn = root.querySelector('.custom-video__toggle');
    const muteBtn = root.querySelector('.custom-video__mute');
    const fsBtn = root.querySelector('.custom-video__fullscreen');
    const track = root.querySelector('.custom-video__progress-track');
    const fill = root.querySelector('.custom-video__progress-fill');
    const timeCur = root.querySelector('.custom-video__time-current');
    const timeDur = root.querySelector('.custom-video__time-duration');

    function setPlaying(playing) {
        root.classList.toggle('is-playing', playing);
        toggleBtn.setAttribute('aria-label', playing ? 'Пауза' : 'Воспроизвести');
    }

    function setMuted(muted) {
        root.classList.toggle('is-muted', muted);
        muteBtn.setAttribute('aria-label', muted ? 'Включить звук' : 'Без звука');
    }

    function updateProgress() {
        const d = video.duration;
        const t = video.currentTime;
        const pct = d && Number.isFinite(d) ? (t / d) * 100 : 0;
        fill.style.width = `${pct}%`;
        timeCur.textContent = formatVideoTime(t);
        track.setAttribute('aria-valuenow', String(Math.round(pct)));
        track.setAttribute('aria-valuetext', `${formatVideoTime(t)} из ${formatVideoTime(d)}`);
    }

    function onLoadedMeta() {
        timeDur.textContent = formatVideoTime(video.duration);
    }

    function isFullscreen() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }

    function requestPlayerFullscreen() {
        const el = root;
        if (isFullscreen()) {
            document.exitFullscreen?.();
            document.webkitExitFullscreen?.();
            return;
        }
        if (el.requestFullscreen) {
            el.requestFullscreen().catch(() => { });
        } else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
        }
    }

    bigPlay.addEventListener('click', () => {
        video.play().catch(() => { });
    });
    toggleBtn.addEventListener('click', () => {
        if (video.paused) video.play().catch(() => { });
        else video.pause();
    });
    video.addEventListener('click', () => {
        if (video.paused) video.play().catch(() => { });
        else video.pause();
    });
    muteBtn.addEventListener('click', () => {
        video.muted = !video.muted;
    });
    fsBtn.addEventListener('click', requestPlayerFullscreen);

    video.addEventListener('play', () => setPlaying(true));
    video.addEventListener('pause', () => setPlaying(false));
    video.addEventListener('ended', () => setPlaying(false));
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', onLoadedMeta);
    video.addEventListener('volumechange', () => setMuted(video.muted));

    setMuted(video.muted);
    setPlaying(!video.paused);

    function seekFromClientX(clientX) {
        const rect = track.getBoundingClientRect();
        if (rect.width <= 0) return;
        const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        if (video.duration && Number.isFinite(video.duration)) {
            video.currentTime = pct * video.duration;
        }
    }

    track.addEventListener('click', (e) => seekFromClientX(e.clientX));

    let dragging = false;
    track.addEventListener('mousedown', (e) => {
        dragging = true;
        seekFromClientX(e.clientX);
    });
    document.addEventListener('mousemove', (e) => {
        if (dragging) seekFromClientX(e.clientX);
    });
    document.addEventListener('mouseup', () => {
        dragging = false;
    });

    track.addEventListener('touchstart', (e) => {
        if (e.touches.length) seekFromClientX(e.touches[0].clientX);
    }, { passive: true });
    track.addEventListener('touchmove', (e) => {
        if (e.touches.length) seekFromClientX(e.touches[0].clientX);
    }, { passive: true });

    track.addEventListener('keydown', (e) => {
        if (!video.duration || !Number.isFinite(video.duration)) return;
        const step = video.duration * 0.05;
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            video.currentTime = Math.min(video.duration, video.currentTime + step);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            video.currentTime = Math.max(0, video.currentTime - step);
        }
    });

    root.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            if (video.paused) video.play().catch(() => { });
            else video.pause();
        }
    });

    const videoSection = document.getElementById('video');
    if (videoSection) {
        const sectionVisibilityIo = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const visibleEnough = entry.isIntersecting && entry.intersectionRatio >= 0.22;
            if (!visibleEnough && !isFullscreen()) {
                video.pause();
            }
        }, {
            threshold: [0, 0.1, 0.22, 0.45, 0.75, 1],
            root: null,
            rootMargin: '0px'
        });
        sectionVisibilityIo.observe(videoSection);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) video.pause();
    });

    onLoadedMeta();
    updateProgress();
}

function initLazyAssets() {
    document.querySelectorAll('[data-bg]').forEach((el) => {
        el.style.backgroundImage = `url('${el.dataset.bg}')`;
    });
}

const SAP_PRICES_LOCATIONS = [
    { lat: 53.90937, lng: 27.63828, title: 'ул. Багратиона, 70' },
    { lat: 53.95835, lng: 27.63362, title: 'Логойский тракт, 52' },
    { lat: 53.93664, lng: 27.45307, title: 'ул. Тимирязева, 118' },
    { lat: 53.86647, lng: 27.52975, title: 'ул. Леонида Левина, 8' },
    { lat: 53.86191, lng: 27.48036, title: 'пр. Дзержинского, 104' },
];

let leafletLoadPromise = null;
let sapPricesMapBundle = null;

function ensureLeafletLoaded() {
    if (typeof window.L !== 'undefined') return Promise.resolve();
    if (leafletLoadPromise) return leafletLoadPromise;

    leafletLoadPromise = new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'vendor/leaflet/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'vendor/leaflet/leaflet.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Leaflet failed to load'));
        document.body.appendChild(script);
    });

    return leafletLoadPromise;
}

function initSapPricesMapSection(section) {
    if (!section || section.id !== 'sap-prices' || section.dataset.sapMapInit === 'true') return;

    const mapEl = document.getElementById('sapPricesMap');
    if (!mapEl) return;

    ensureLeafletLoaded()
        .then(() => {
            if (section.dataset.sapMapInit === 'true') return;
            section.dataset.sapMapInit = 'true';

            const { L } = window;
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'vendor/leaflet/images/marker-icon-2x.png',
                iconUrl: 'vendor/leaflet/images/marker-icon.png',
                shadowUrl: 'vendor/leaflet/images/marker-shadow.png',
            });

            const map = L.map(mapEl, {
                scrollWheelZoom: false,
                attributionControl: false,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(map);

            const priceLine = '0,55&nbsp;руб./л';
            const markers = SAP_PRICES_LOCATIONS.map((pt) => {
                const marker = L.marker([pt.lat, pt.lng]).addTo(map);
                marker.bindPopup(`<strong>${pt.title}</strong><br>${priceLine}`);
                return marker;
            });

            const group = L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.14));

            const spots = section.querySelectorAll('.sap-price-spot');

            function setActiveMarker(index) {
                spots.forEach((btn) => {
                    const i = Number.parseInt(btn.dataset.marker, 10);
                    const on = i === index;
                    btn.classList.toggle('is-active', on);
                    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
                });
                const m = markers[index];
                if (m) {
                    map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.55 });
                    m.openPopup();
                }
            }

            spots.forEach((btn) => {
                btn.addEventListener('click', () => {
                    const idx = Number.parseInt(btn.dataset.marker, 10);
                    if (!Number.isNaN(idx)) setActiveMarker(idx);
                });
            });

            markers.forEach((m, i) => {
                m.on('click', () => setActiveMarker(i));
            });

            setActiveMarker(0);

            sapPricesMapBundle = { map, markers };

            requestAnimationFrame(() => {
                map.invalidateSize();
                setTimeout(() => map.invalidateSize(), 320);
            });
        })
        .catch(() => {
            section.dataset.sapMapInit = '';
            mapEl.innerHTML =
                '<p class="sap-prices-map-fallback">Карта не загрузилась. Проверьте подключение к интернету.</p>';
        });
}

function hydrateSectionMedia(section) {
    if (!section || section.id === 'hero' || section.dataset.mediaHydrated === 'true') return;
    section.dataset.mediaHydrated = 'true';

    if (section.id === 'sap-prices') {
        initSapPricesMapSection(section);
    }

    section.querySelectorAll('img[data-defer-src]').forEach((img) => {
        const url = img.dataset.deferSrc;
        if (!url) return;
        img.src = url;
        img.removeAttribute('data-defer-src');
    });

    section.querySelectorAll('img[data-lazy-src]').forEach((img) => {
        const url = img.dataset.lazySrc;
        if (!url) return;
        img.src = url;
        img.removeAttribute('data-lazy-src');
    });

    if (section.id === 'report-lead') {
        section.classList.add('section-media-loaded');
    }
    if (section.id === 'about') {
        section.classList.add('section-media-loaded');
    }
    if (section.id === 'game') {
        section.classList.add('section-media-loaded');
    }
    if (section.id === 'projects') {
        section.querySelector('.projects-section__overlay')?.classList.add('section-media-loaded');
    }

    section.querySelectorAll('video').forEach((video) => {
        const posterUrl = video.dataset.deferPoster;
        if (posterUrl) {
            video.poster = posterUrl;
            video.removeAttribute('data-defer-poster');
        }
        const source = video.querySelector('source[data-defer-src]');
        if (source) {
            const vurl = source.dataset.deferSrc;
            if (vurl) {
                source.src = vurl;
                source.removeAttribute('data-defer-src');
            }
            video.preload = 'metadata';
            try {
                video.load();
            } catch (e) {
                /* ignore */
            }
        }
    });

    if (section.id === 'gallery') {
        requestAnimationFrame(() => {
            galleryThumbsSwiper?.update?.();
            galleryMainSwiper?.update?.();
        });
    }
}

function isSectionApproximatelyVisible(el) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    if (r.bottom <= 4 || r.top >= vh - 4 || r.right <= 4 || r.left >= vw - 4) return false;
    const visibleH = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    const visibleW = Math.min(r.right, vw) - Math.max(r.left, 0);
    if (visibleH <= 0 || visibleW <= 0) return false;
    const visibleArea = visibleH * visibleW;
    const sectionArea = Math.max(1, r.width * r.height);
    return visibleArea / sectionArea >= 0.1;
}

function initSectionMediaLoader() {
    const container = document.getElementById('horizontalContainer');
    if (!container) return;

    const sectionEls = Array.from(container.querySelectorAll(':scope > section.section'));

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        sectionEls.forEach((s) => {
            if (s.id !== 'hero') hydrateSectionMedia(s);
        });
        return;
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.06) {
                hydrateSectionMedia(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px -4% 0px',
        threshold: [0, 0.06, 0.12, 0.2, 0.35]
    });

    sectionEls.forEach((section) => {
        if (section.id === 'hero') return;
        io.observe(section);
        if (isSectionApproximatelyVisible(section)) {
            hydrateSectionMedia(section);
        }
    });
}

function initApp() {
    setViewportSizeVars();
    applyStableLayout();
    checkReducedMotion();
    initCursor();
    initNavigation();
    initSectionTracking();
    initSectionMediaLoader();
    initHeroAnimations();
    animateCounters();
    initSectionAnimations();
    initAboutAnimations();
    initBenefitsAnimations();
    initTiltEffect();
    initParticles();
    initSwiper();
    initProjectsHorizontalScroll();
    initLightbox();
    initVideoModal();
    initVerticalVideoPlayer();
    initKeyboardNav();
    initTouchSupport();
    initBottleAnimation();
    initPerformanceOptimizations();
    initBackToTop();
    initLazyAssets();

    requestAnimationFrame(() => {
        window.scrollTo({ top: lastKnownScrollY, behavior: 'auto' });
        ScrollTrigger.refresh();
        detectActiveSection();
    });
}

window.addEventListener('load', runPreloader);

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        setViewportSizeVars();
        applyStableLayout();
        ScrollTrigger.refresh();
        detectActiveSection();
        sapPricesMapBundle?.map?.invalidateSize();
        centerProjectsActiveCard();
    }, 120);
}, { passive: true });

window.showNotification = showNotification;
window.handleSubscribe = handleSubscribe;
