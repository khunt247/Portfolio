/* ═══════════════════════════════════════════════════════════════
   Case Studies — Shared Animation Controller
   Scroll reveals · Stagger · Card tilt · Progress indicator
═══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ── 1. Signal JS is active so CSS reveal states apply ───── */
    document.documentElement.classList.add('cs-js');
    document.body.classList.add('cs-js');

    /* ── 2. IntersectionObserver — scroll reveals ─────────────── */
    const REVEAL_SELECTORS = [
        '.cs-section',
        '.cs-overline',
        '.cs-h2',
        '.cs-deliverable-card',
        '.cs-process-step',
        '.cs-gallery-item',
        '.cs-tier',
        '.cs-compare-card',
        '.cs-img-wrap',
        '.cs-details',
    ].join(', ');

    const STAGGER_PARENTS = [
        '.cs-deliverables',
        '.cs-process',
        '.cs-gallery',
        '.cs-system-tiers',
        '.cs-compare',
    ].join(', ');

    function setupReveal() {
        /* Mark stagger containers */
        document.querySelectorAll(STAGGER_PARENTS).forEach(function (el) {
            el.classList.add('cs-stagger');
        });

        /* Add reveal class to all target elements */
        document.querySelectorAll(REVEAL_SELECTORS).forEach(function (el) {
            el.classList.add('cs-reveal');
        });

        const observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('cs-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.08,
                rootMargin: '0px 0px -40px 0px',
            }
        );

        document.querySelectorAll('.cs-reveal').forEach(function (el) {
            observer.observe(el);
        });
    }

    /* ── 3. Reading-progress bar ──────────────────────────────── */
    function setupProgressBar() {
        const bar = document.createElement('div');
        bar.id = 'cs-progress-bar';
        Object.assign(bar.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '0%',
            height: '2px',
            background: 'linear-gradient(90deg, #00d4ff, #7b2ff7)',
            zIndex: '9999',
            transition: 'width 0.1s linear',
            pointerEvents: 'none',
        });
        document.body.appendChild(bar);

        function updateBar() {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const docHeight =
                document.documentElement.scrollHeight -
                document.documentElement.clientHeight;
            const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            bar.style.width = pct + '%';
        }

        window.addEventListener('scroll', updateBar, { passive: true });
        updateBar();
    }

    /* ── 4. Subtle 3-D tilt on deliverable cards ─────────────── */
    function setupCardTilt() {
        // Keep smaller/touch layouts steady and readable.
        if (
            window.matchMedia('(max-width: 1024px)').matches ||
            window.matchMedia('(pointer: coarse)').matches
        ) {
            return;
        }

        const cards = document.querySelectorAll('.cs-deliverable-card');
        const STRENGTH = 6; /* max degrees */

        cards.forEach(function (card) {
            card.addEventListener('mousemove', function (e) {
                const rect = card.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = (e.clientX - cx) / (rect.width / 2);
                const dy = (e.clientY - cy) / (rect.height / 2);
                card.style.transform =
                    'translateY(-4px) rotateY(' +
                    (dx * STRENGTH) +
                    'deg) rotateX(' +
                    (-dy * STRENGTH) +
                    'deg)';
                card.style.transition = 'transform 0.1s ease';
            });

            card.addEventListener('mouseleave', function () {
                card.style.transform = '';
                card.style.transition =
                    'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease';
            });
        });
    }

    /* ── 5. Active section nav highlight (optional) ──────────── */
    function setupActiveSection() {
        const sections = document.querySelectorAll('.cs-section[id]');
        if (!sections.length) return;

        const navLinks = document.querySelectorAll('.nav-links a[href*="#"]');

        const sectionObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        navLinks.forEach(function (link) {
                            link.classList.toggle(
                                'active',
                                link.getAttribute('href').endsWith('#' + entry.target.id)
                            );
                        });
                    }
                });
            },
            { threshold: 0.4 }
        );

        sections.forEach(function (s) {
            sectionObserver.observe(s);
        });
    }

    /* ── 6. Overline underline trigger ───────────────────────── */
    function setupOverlines() {
        const overlines = document.querySelectorAll('.cs-overline');

        const obs = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('cs-visible');
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );

        overlines.forEach(function (el) {
            obs.observe(el);
        });
    }

    /* ── 7. Hero image — parallax-lite on scroll ─────────────── */
    function setupHeroParallax() {
        const heroImg = document.querySelector(
            '.cs-container--wide:first-of-type .cs-img'
        );
        if (!heroImg) return;

        let ticking = false;
        window.addEventListener(
            'scroll',
            function () {
                if (!ticking) {
                    window.requestAnimationFrame(function () {
                        const scrollY = window.scrollY;
                        const offset = scrollY * 0.06;
                        heroImg.style.transform = 'translateY(' + offset + 'px)';
                        ticking = false;
                    });
                    ticking = true;
                }
            },
            { passive: true }
        );
    }

    /* ── 8. Keyboard focus — skip unnecessary hover states ────── */
    function setupFocusStyles() {
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Tab') {
                document.body.classList.add('cs-keyboard-nav');
            }
        });
        document.addEventListener('mousedown', function () {
            document.body.classList.remove('cs-keyboard-nav');
        });
    }

    /* ── 9. Cursor-following spotlight ───────────────────────── */
    function setupSpotlight() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (window.innerWidth < 768) return;

        var spot = document.createElement('div');
        spot.id = 'cs-spotlight';
        document.body.appendChild(spot);

        var mx = 0, my = 0, sx = 0, sy = 0;
        var running = true;

        document.addEventListener('mousemove', function (e) {
            mx = e.clientX;
            my = e.clientY;
        }, { passive: true });

        (function lerp() {
            if (!running) return;
            sx += (mx - sx) * 0.08;
            sy += (my - sy) * 0.08;
            spot.style.left = sx + 'px';
            spot.style.top = sy + 'px';
            requestAnimationFrame(lerp);
        })();

        document.addEventListener('mouseleave', function () { spot.style.opacity = '0'; });
        document.addEventListener('mouseenter', function () { spot.style.opacity = '1'; });
    }

    /* ── 10. Terminal chapter breaks ─────────────────────────── */
    function setupChapterBreaks() {
        var sections = document.querySelectorAll('.cs-section');
        var labels = [
            'deliverables', 'process', 'architecture', 'research',
            'design-system', 'screens', 'outcome', 'appendix',
            'mini-case-study', 'constraints', 'gallery', 'stack'
        ];

        sections.forEach(function (sec, i) {
            var overline = sec.querySelector('.cs-overline');
            var slug = overline
                ? overline.textContent.trim().toLowerCase().replace(/\s+/g, '-')
                : (labels[i] || 'section-' + (i + 1));

            var brk = document.createElement('div');
            brk.className = 'cs-chapter-break';
            brk.innerHTML =
                '<span class="cs-chapter-label">~/case-study/' +
                slug +
                '.md</span><span class="cs-chapter-status">OK</span>';

            var container = sec.querySelector('.cs-container') || sec.querySelector('.cs-container--wide');
            if (container) {
                container.insertBefore(brk, container.firstChild);
            }
        });

        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('cs-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        document.querySelectorAll('.cs-chapter-break').forEach(function (el) {
            obs.observe(el);
        });
    }

    /* ── 11. Magnetic CTA links ─────────────────────────────── */
    function setupMagnetic() {
        var targets = document.querySelectorAll('.cs-link-btn, .cs-back');
        var PULL = 6;

        targets.forEach(function (el) {
            el.classList.add('cs-magnetic');

            el.addEventListener('mousemove', function (e) {
                var rect = el.getBoundingClientRect();
                var cx = rect.left + rect.width / 2;
                var cy = rect.top + rect.height / 2;
                var dx = (e.clientX - cx) * (PULL / rect.width);
                var dy = (e.clientY - cy) * (PULL / rect.height);
                el.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
            });

            el.addEventListener('mouseleave', function () {
                el.style.transform = '';
            });
        });
    }

    /* ── 12. Hero image reveal mask ─────────────────────────── */
    function setupImageMask() {
        var heroImg = document.querySelector('.cs-container--wide:first-of-type .cs-img');
        if (!heroImg) return;

        heroImg.classList.add('cs-img-masked');

        var wrap = heroImg.parentElement;
        if (wrap) {
            wrap.classList.add('cs-img-mask-overlay');
        }
    }

    /* ── 13. Hero title word-split stagger ───────────────────── */
    function setupTitleSplit() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        var title = document.querySelector('.cs-title');
        if (!title) return;

        var original = title.textContent;
        var words = original.split(/\s+/);
        title.innerHTML = '';
        title.style.animation = 'none';
        title.style.opacity = '1';
        title.style.transform = 'none';
        title.style.filter = 'none';
        title.style.backgroundClip = 'unset';
        title.style.webkitBackgroundClip = 'unset';
        title.style.webkitTextFillColor = 'unset';
        title.style.background = 'none';

        words.forEach(function (word, i) {
            var span = document.createElement('span');
            span.className = 'cs-word';
            span.textContent = word;
            span.style.animationDelay = (0.25 + i * 0.045) + 's';
            title.appendChild(span);
            if (i < words.length - 1) {
                title.appendChild(document.createTextNode(' '));
            }
        });
    }

    /* ── 14. Ambient grid drift (injected element) ──────────── */
    function setupHeroGrid() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        var hero = document.querySelector('.cs-hero');
        if (!hero) return;

        var grid = document.createElement('div');
        grid.className = 'cs-hero-grid';
        hero.insertBefore(grid, hero.firstChild);
    }

    /* ── 15. Scroll-linked hue shift on accents ─────────────── */
    function setupHueShift() {
        var page = document.querySelector('.cs-page');
        if (!page) return;

        var ticking = false;
        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(function () {
                    var scrollTop = window.scrollY || document.documentElement.scrollTop;
                    var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                    var pct = docHeight > 0 ? scrollTop / docHeight : 0;
                    var hue = Math.round(pct * 25);
                    page.style.setProperty('--cs-hue-shift', hue + 'deg');
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    /* ── 16. Typed hero subtitle ───────────────────────────────── */
    function setupTypedSubtitle() {
        var hero = document.querySelector('.cs-hero .cs-container');
        if (!hero) return;
        var meta = hero.querySelector('.cs-meta');
        if (!meta) return;

        var phrases = [
            'designing systems that outlast their sprint',
            'building interfaces users never want to leave',
            'crafting every pixel with purpose and precision',
            'engineering experiences that feel like magic',
            'turning complex problems into elegant solutions'
        ];
        var phrase = phrases[Math.floor(Math.random() * phrases.length)];

        var line = document.createElement('div');
        line.className = 'cs-typed-line';
        line.innerHTML =
            '<span class="cs-typed-prompt">&gt;</span>' +
            '<span class="cs-typed-text">' + phrase + '</span>';
        meta.parentNode.insertBefore(line, meta);

        var textEl = line.querySelector('.cs-typed-text');
        var charCount = phrase.length;
        var stepsMs = Math.max(1800, charCount * 45);
        textEl.style.animationDuration = stepsMs + 'ms, 0.6s';
        textEl.style.animationTimingFunction = 'steps(' + charCount + ', end), step-end';

        setTimeout(function () {
            textEl.classList.add('cs-typed-done');
        }, 1800 + stepsMs + 1800);
    }

    /* ── 17. Film grain / noise overlay ─────────────────────── */
    function setupNoise() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        var wrap = document.createElement('div');
        wrap.className = 'cs-noise';
        var canvas = document.createElement('canvas');
        wrap.appendChild(canvas);
        document.body.appendChild(wrap);

        var ctx = canvas.getContext('2d');
        var w, h;

        function resize() {
            w = canvas.width = window.innerWidth / 2;
            h = canvas.height = window.innerHeight / 2;
        }
        resize();
        window.addEventListener('resize', resize);

        function renderGrain() {
            var imageData = ctx.createImageData(w, h);
            var data = imageData.data;
            for (var i = 0; i < data.length; i += 4) {
                var v = Math.random() * 255;
                data[i] = v;
                data[i + 1] = v;
                data[i + 2] = v;
                data[i + 3] = 18;
            }
            ctx.putImageData(imageData, 0, 0);
        }

        var interval;
        function start() { interval = setInterval(renderGrain, 80); }
        function stop() { clearInterval(interval); }

        start();
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) { stop(); } else { start(); }
        });
    }

    /* ── 18. Section scroll-counter ─────────────────────────── */
    function setupScrollCounter() {
        var sections = document.querySelectorAll('.cs-section');
        if (sections.length < 2) return;

        var total = sections.length;
        var el = document.createElement('div');
        el.id = 'cs-scroll-counter';
        el.innerHTML =
            '<span class="cs-counter-current">01</span>' +
            '<span class="cs-counter-sep">/</span>' +
            '<span class="cs-counter-total">' + String(total).padStart(2, '0') + '</span>';
        document.body.appendChild(el);

        var currentEl = el.querySelector('.cs-counter-current');
        var lastIdx = -1;

        var obs = new IntersectionObserver(function (entries) {
            var topSection = null;
            var topY = Infinity;

            entries.forEach(function (entry) {
                if (entry.isIntersecting && entry.boundingClientRect.top < topY) {
                    topY = entry.boundingClientRect.top;
                    topSection = entry.target;
                }
            });

            if (topSection) {
                var idx = Array.prototype.indexOf.call(sections, topSection);
                if (idx !== lastIdx && idx >= 0) {
                    lastIdx = idx;
                    currentEl.style.opacity = '0';
                    setTimeout(function () {
                        currentEl.textContent = String(idx + 1).padStart(2, '0');
                        currentEl.style.opacity = '1';
                    }, 120);
                }
            }
        }, { threshold: 0.15 });

        sections.forEach(function (s) { obs.observe(s); });

        var showTimer;
        window.addEventListener('scroll', function () {
            el.classList.add('cs-counter-visible');
            clearTimeout(showTimer);
            showTimer = setTimeout(function () {
                el.classList.remove('cs-counter-visible');
            }, 2500);
        }, { passive: true });
    }

    /* ── 19. Magnetic gallery cursor (VIEW) ─────────────────── */
    function setupGalleryCursor() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (window.innerWidth < 768) return;

        var items = document.querySelectorAll('.cs-gallery-item');
        if (!items.length) return;

        var cursor = document.createElement('div');
        cursor.id = 'cs-gallery-cursor';
        cursor.innerHTML = '<span>VIEW</span>';
        document.body.appendChild(cursor);

        var active = false;

        items.forEach(function (item) {
            item.addEventListener('mouseenter', function () {
                active = true;
                item.classList.add('cs-cursor-hide');
                cursor.classList.add('cs-cursor-active');
            });

            item.addEventListener('mouseleave', function () {
                active = false;
                item.classList.remove('cs-cursor-hide');
                cursor.classList.remove('cs-cursor-active');
            });

            item.addEventListener('mousemove', function (e) {
                if (!active) return;
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            });
        });
    }

    /* ── 20. Time-to-read indicator ─────────────────────────── */
    function setupReadTime() {
        var page = document.querySelector('.cs-page');
        if (!page) return;

        var text = page.innerText || page.textContent || '';
        var words = text.trim().split(/\s+/).length;
        var minutes = Math.max(1, Math.round(words / 220));

        var meta = document.querySelector('.cs-meta');
        if (!meta) return;

        var badge = document.createElement('div');
        badge.className = 'cs-meta-item';
        badge.innerHTML =
            '<span class="cs-meta-label">Read Time</span>' +
            '<span class="cs-meta-value">' +
            '<span class="cs-read-time">' +
            '<span class="cs-read-time-icon"></span>' +
            '~' + minutes + ' min' +
            '</span></span>';
        meta.appendChild(badge);
    }

    /* ── Init ─────────────────────────────────────────────────── */
    function init() {
        setupTitleSplit();
        setupHeroGrid();
        setupImageMask();
        setupReveal();
        setupProgressBar();
        setupCardTilt();
        setupActiveSection();
        setupOverlines();
        setupHeroParallax();
        setupFocusStyles();
        setupSpotlight();
        setupChapterBreaks();
        setupMagnetic();
        setupHueShift();
        setupTypedSubtitle();
        setupNoise();
        setupScrollCounter();
        setupGalleryCursor();
        setupReadTime();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
