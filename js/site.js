/**
 * TSJ — front-end renderer + interactions
 * All content comes from data/site.json (managed in /admin).
 */
(function () {
    'use strict';

    var CONFIG_URL = 'data/site.json';
    var SITE = null;
    var LEAD_BUSY = false;

    /* Minimal fallback so the page is never blank if the JSON cannot load */
    var FALLBACK = {
        meta: { title: 'TSJ — Factory-Direct Custom Cabinetry', description: '' },
        brand: { mark: 'T', name: 'TSJ', tagline: 'Custom cabinetry, factory direct' },
        contact: { email: 'lsjxiaocao@163.com', phone: '+86 178 1467 4328', whatsapp: '8617814674328' },
        leadSettings: { recipientEmail: 'lsjxiaocao@163.com', provider: 'formsubmit' },
        hero: {
            slides: [{
                eyebrow: 'Factory direct since 2010',
                title: 'Better boards. Precision craft.',
                titleAccent: 'Factory prices.',
                desc: 'Custom cabinetry built in our own factory and shipped straight to your door.',
                image: 'assets/img/hero-living.jpg',
                primaryText: 'Get a free quote', primaryHref: '#contact',
                secondaryText: 'See materials & craft', secondaryHref: '#materials'
            }]
        },
        stats: [],
        materials: { cards: [], specs: [], badges: [] },
        craft: { points: [], details: [] },
        pricing: { rows: [], bullets: [] },
        collections: { cards: [] },
        categories: { items: [] },
        portfolio: { items: [] },
        why: { items: [] },
        process: { steps: [] },
        cta: {},
        contactSection: {},
        footer: {},
        popup: { enabled: false }
    };

    /* ---------------- helpers ---------------- */
    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function $(sel, root) { return (root || document).querySelector(sel); }
    function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
    function setText(sel, value) {
        var node = $(sel);
        if (node && value != null) node.textContent = value;
    }
    function get(obj, path, fallback) {
        var cur = obj;
        for (var i = 0; i < path.length; i++) {
            if (cur == null) return fallback;
            cur = cur[path[i]];
        }
        return cur == null ? fallback : cur;
    }
    function digits(str) { return String(str || '').replace(/\D/g, ''); }

    function waLink(text) {
        var num = digits(get(SITE, ['contact', 'whatsapp'], '8617814674328'));
        return 'https://wa.me/' + num + (text ? '?text=' + encodeURIComponent(text) : '');
    }
    function mailLink(subject) {
        var email = get(SITE, ['contact', 'email'], '');
        return 'mailto:' + email + (subject ? '?subject=' + encodeURIComponent(subject) : '');
    }

    function toast(message, type) {
        var wrap = $('#toastWrap');
        if (!wrap) return;
        var el = document.createElement('div');
        el.className = 'toast' + (type ? ' toast--' + type : '');
        el.textContent = message;
        wrap.appendChild(el);
        setTimeout(function () {
            el.style.opacity = '0';
            el.style.transition = 'opacity .3s ease';
            setTimeout(function () { el.remove(); }, 320);
        }, 3600);
    }

    function sectionHead(target, data, light) {
        var node = $(target);
        if (!node || !data) return;
        node.innerHTML =
            (data.eyebrow ? '<span class="section-eyebrow">' + esc(data.eyebrow) + '</span>' : '') +
            '<h2 class="section-title">' + esc(data.title || '') +
            (data.titleAccent ? ' <em>' + esc(data.titleAccent) + '</em>' : '') + '</h2>' +
            (data.desc ? '<p class="section-desc">' + esc(data.desc) + '</p>' : '');
        if (light) node.classList.add('section-head--light');
    }

    function revealize(root) {
        if (!('IntersectionObserver' in window)) return;
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        $$('.reveal', root || document).forEach(function (el) { observer.observe(el); });
    }

    /* ---------------- render ---------------- */
    function renderMeta() {
        if (get(SITE, ['meta', 'title'])) document.title = SITE.meta.title;
        var desc = get(SITE, ['meta', 'description']);
        if (desc) {
            var meta = $('meta[name="description"]');
            if (meta) meta.setAttribute('content', desc);
        }
    }

    function renderBrand() {
        var brand = SITE.brand || {};
        setText('#brandMark', brand.mark || 'T');
        setText('#footerMark', brand.mark || 'T');
        setText('#brandName', brand.name || 'TSJ');
        setText('#footerName', brand.name || 'TSJ');
        setText('#brandTagline', brand.tagline || '');
    }

    function renderContact() {
        var c = SITE.contact || {};
        var phoneHref = 'tel:' + (c.phone || '').replace(/\s+/g, '');

        var headerPhone = $('#headerPhone');
        if (headerPhone) {
            headerPhone.href = phoneHref;
            var span = $('span', headerPhone);
            if (span) span.textContent = c.phone || '';
        }
        var mobileCall = $('#mobileCall');
        if (mobileCall) mobileCall.href = phoneHref;

        var wa = waLink('Hello TSJ, I would like a quote for custom cabinetry.');
        ['#mobileWhatsapp', '#navMobileWhatsapp', '#leadSuccessWhatsapp'].forEach(function (sel) {
            var node = $(sel);
            if (node) node.href = wa;
        });
        var navEmail = $('#navMobileEmail');
        if (navEmail) navEmail.href = mailLink('Custom cabinetry enquiry');

        var footerContact = $('#footerContact');
        if (footerContact) {
            footerContact.innerHTML =
                '<li><i class="fa-regular fa-envelope"></i><a href="' + esc(mailLink()) + '">' + esc(c.email || '') + '</a></li>' +
                '<li><i class="fa-brands fa-whatsapp"></i><a href="' + esc(wa) + '" target="_blank" rel="noopener">' + esc(c.phone || '') + '</a></li>' +
                (c.address ? '<li><i class="fa-solid fa-location-dot"></i><span>' + esc(c.address) + '</span></li>' : '') +
                (c.hours ? '<li><i class="fa-regular fa-clock"></i><span>' + esc(c.hours) + '</span></li>' : '');
        }
    }

    function renderHero() {
        var slides = get(SITE, ['hero', 'slides'], []);
        var wrap = $('#heroSlides');
        var dots = $('#heroDots');
        var arrows = [$('#heroPrev'), $('#heroNext')];
        if (!wrap || !slides.length) return;

        wrap.innerHTML = slides.map(function (s, i) {
            return '' +
                '<div class="hero-slide' + (i === 0 ? ' is-active' : '') + '" data-index="' + i + '">' +
                '<div class="hero-slide-bg" style="background-image:url(\'' + esc(s.image) + '\')"></div>' +
                '<div class="hero-content">' +
                (s.eyebrow ? '<span class="hero-eyebrow">' + esc(s.eyebrow) + '</span>' : '') +
                '<h1 class="hero-title">' + esc(s.title || '') +
                (s.titleAccent ? '<em>' + esc(s.titleAccent) + '</em>' : '') + '</h1>' +
                (s.desc ? '<p class="hero-desc">' + esc(s.desc) + '</p>' : '') +
                '<div class="hero-actions">' +
                (s.primaryText ? '<a class="btn btn-primary btn-lg" href="' + esc(s.primaryHref || '#contact') + '">' + esc(s.primaryText) + '</a>' : '') +
                (s.secondaryText ? '<a class="btn btn-ghost btn-lg" href="' + esc(s.secondaryHref || '#materials') + '">' + esc(s.secondaryText) + '</a>' : '') +
                '</div></div></div>';
        }).join('');

        if (dots) {
            dots.innerHTML = slides.map(function (s, i) {
                return '<button class="hero-dot' + (i === 0 ? ' is-active' : '') + '" data-index="' + i +
                    '" aria-label="Slide ' + (i + 1) + '"></button>';
            }).join('');
        }
        arrows.forEach(function (a) { if (a) a.hidden = slides.length < 2; });
    }

    function renderStats() {
        var items = SITE.stats || [];
        var row = $('#statsRow');
        if (!row || !items.length) {
            var bar = $('.stat-bar');
            if (bar && !items.length) bar.style.display = 'none';
            return;
        }
        row.innerHTML = items.map(function (s) {
            return '<div class="stat-item"><span class="stat-value">' + esc(s.value) + '</span>' +
                '<span class="stat-label">' + esc(s.label) + '</span></div>';
        }).join('');
    }

    function renderMaterials() {
        var m = SITE.materials || {};
        sectionHead('#materialsHead', m);

        var body = $('#materialsBody');
        if (!body) return;

        var cards = (m.cards || []).map(function (c) {
            return '<article class="material-card reveal">' +
                '<div class="material-icon"><i class="' + esc(c.icon || 'fa-solid fa-check') + '"></i></div>' +
                '<h3>' + esc(c.title) + '</h3><p>' + esc(c.desc) + '</p></article>';
        }).join('');

        var specs = (m.specs || []).map(function (s) {
            return '<div class="spec-row"><dt>' + esc(s.label) + '</dt><dd>' + esc(s.value) + '</dd></div>';
        }).join('');

        var badges = (m.badges || []).map(function (b) {
            return '<span class="badge">' + esc(b) + '</span>';
        }).join('');

        body.innerHTML =
            '<div class="material-grid">' + cards + '</div>' +
            '<div class="spec-panel reveal">' +
            '<div class="spec-media"><img src="' + esc(m.image) + '" alt="Cabinet board detail" loading="lazy" decoding="async"></div>' +
            '<div class="spec-body">' +
            '<h3>Full specification</h3>' +
            '<p>Exactly what we manufacture — and what your quote is measured against.</p>' +
            '<dl class="spec-list">' + specs + '</dl>' +
            '<div class="badge-row">' + badges + '</div>' +
            '</div></div>';
    }

    function renderCraft() {
        var c = SITE.craft || {};
        var body = $('#craftBody');
        if (!body) return;

        var points = (c.points || []).map(function (p) {
            return '<div class="craft-point"><strong>' + esc(p.value) + '</strong><span>' + esc(p.label) + '</span></div>';
        }).join('');

        var details = (c.details || []).map(function (d, i) {
            return '<div class="craft-item"><span class="craft-item-num">0' + (i + 1) + '</span>' +
                '<div><h4>' + esc(d.title) + '</h4><p>' + esc(d.desc) + '</p></div></div>';
        }).join('');

        body.innerHTML =
            '<div class="craft-wrap">' +
            '<div class="craft-media reveal"><img src="' + esc(c.image) + '" alt="Craftsmanship detail" loading="lazy" decoding="async">' +
            '<div class="craft-points">' + points + '</div></div>' +
            '<div class="craft-copy">' +
            '<span class="section-eyebrow">' + esc(c.eyebrow || '') + '</span>' +
            '<h2 class="section-title">' + esc(c.title || '') + ' <em>' + esc(c.titleAccent || '') + '</em></h2>' +
            '<p class="section-desc">' + esc(c.desc || '') + '</p>' +
            '<div class="craft-list">' + details + '</div>' +
            '</div></div>';
    }

    function renderPricing() {
        var p = SITE.pricing || {};
        sectionHead('#pricingHead', p);

        var body = $('#pricingBody');
        if (!body) return;

        var rows = (p.rows || []).map(function (r) {
            return '<tr><td>' + esc(r.item) + '</td><td>' + esc(r.retail) + '</td><td>' + esc(r.tsj) + '</td>' +
                '<td><span class="save-pill">-' + esc(r.save) + '</span></td></tr>';
        }).join('');

        var bullets = (p.bullets || []).map(function (b) {
            return '<li><i class="fa-solid fa-check"></i><span>' + esc(b) + '</span></li>';
        }).join('');

        body.innerHTML =
            '<div class="pricing-wrap">' +
            '<div class="price-table-wrap reveal">' +
            '<table class="price-table"><thead><tr>' +
            '<th>Project</th><th>' + esc(p.columnA || 'Retail') + '</th><th>' + esc(p.columnB || 'TSJ') + '</th><th>Save</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table>' +
            (p.note ? '<p class="price-note">' + esc(p.note) + '</p>' : '') +
            '</div>' +
            '<p class="price-scroll-hint">Swipe the table sideways to compare all columns →</p>' +
            '<div class="price-side">' +
            '<div class="price-bullets reveal"><h3>Why the price is lower</h3><ul>' + bullets + '</ul></div>' +
            '<div class="price-cta reveal"><h4>Want your exact number?</h4>' +
            '<p>Send a floor plan or a few photos — you get an itemised quote in 3–5 business days.</p>' +
            '<button class="btn btn-block" data-open-lead>Get my quote</button></div>' +
            '</div></div>';
    }

    function renderCollections() {
        var c = SITE.collections || {};
        sectionHead('#collectionsHead', c);

        var body = $('#collectionsBody');
        if (!body) return;

        body.innerHTML = (c.cards || []).map(function (card) {
            return '<a class="collection-card reveal" href="' + esc(card.link || '#contact') + '">' +
                '<img src="' + esc(card.image) + '" alt="' + esc(card.title) + '" loading="lazy" decoding="async">' +
                '<div class="collection-copy">' +
                (card.tag ? '<span class="collection-tag">' + esc(card.tag) + '</span>' : '') +
                '<h3>' + esc(card.title) + '</h3>' +
                '<span class="link">Inquire <i class="fa-solid fa-arrow-right"></i></span>' +
                '</div></a>';
        }).join('');
    }

    function renderCategories() {
        var c = SITE.categories || {};
        sectionHead('#categoriesHead', c);

        var body = $('#categoriesBody');
        if (!body) return;

        var items = (c.items || []).map(function (item, i) {
            var num = (i + 1) < 10 ? '0' + (i + 1) : String(i + 1);
            return '<article class="category-card reveal">' +
                '<div class="category-image"><img src="' + esc(item.image) + '" alt="' + esc(item.title) + '" loading="lazy" decoding="async"></div>' +
                '<div class="category-body">' +
                '<span class="category-num">' + num + '</span>' +
                '<h3>' + esc(item.title) + '</h3><p>' + esc(item.desc) + '</p>' +
                '<a class="category-link" href="#contact">Learn more <i class="fa-solid fa-arrow-right"></i></a>' +
                '</div></article>';
        }).join('');

        var cta = c.ctaTitle ? '<article class="category-card category-cta reveal"><div>' +
            '<span class="category-num">0' + ((c.items || []).length + 1) + '</span>' +
            '<h3>' + esc(c.ctaTitle) + '</h3><p>' + esc(c.ctaDesc || '') + '</p>' +
            '<button class="btn" data-open-lead>' + esc(c.ctaButton || 'Start your project') + '</button>' +
            '</div></article>' : '';

        body.innerHTML = items + cta;
    }

    function renderPortfolio() {
        var p = SITE.portfolio || {};
        sectionHead('#portfolioHead', p, true);

        var body = $('#portfolioBody');
        if (!body) return;

        body.innerHTML = (p.items || []).map(function (item) {
            return '<article class="portfolio-card reveal">' +
                '<img src="' + esc(item.image) + '" alt="' + esc(item.title) + '" loading="lazy" decoding="async">' +
                '<div class="portfolio-info">' +
                '<span class="portfolio-location">' + esc(item.location) + '</span>' +
                '<h4>' + esc(item.title) + '</h4>' +
                '<span class="portfolio-units">' + esc(item.units) + '</span>' +
                '</div></article>';
        }).join('');
    }

    function renderWhy() {
        var w = SITE.why || {};
        sectionHead('#whyHead', w);

        var list = $('#whyList');
        if (list) {
            list.innerHTML = (w.items || []).map(function (item) {
                return '<article class="why-card reveal">' +
                    '<div class="why-icon"><i class="' + esc(item.icon) + '"></i></div>' +
                    '<div><h3>' + esc(item.title) + '</h3><p>' + esc(item.desc) + '</p></div>' +
                    '</article>';
            }).join('');
        }
        var img = $('#whyImage');
        if (img && w.image) img.src = w.image;
        setText('#whyBadgeValue', w.badgeValue || '');
        setText('#whyBadgeText', w.badgeText || '');
    }

    function renderProcess() {
        var p = SITE.process || {};
        sectionHead('#processHead', p);

        var body = $('#processBody');
        if (!body) return;

        body.innerHTML = (p.steps || []).map(function (step, i) {
            return '<article class="step reveal"><div class="step-num">0' + (i + 1) + '</div>' +
                '<h3>' + esc(step.title) + '</h3><p>' + esc(step.desc) + '</p></article>';
        }).join('');
    }

    function renderCta() {
        var c = SITE.cta || {};
        var body = $('#ctaBody');
        if (!body) return;
        body.innerHTML =
            '<h2>' + esc(c.title || '') + '</h2>' +
            '<p>' + esc(c.desc || '') + '</p>' +
            '<div class="cta-actions">' +
            '<button class="btn btn-primary btn-lg" data-open-lead>' + esc(c.button || 'Get your free quote') + '</button>' +
            '<a class="btn btn-ghost btn-lg" href="' + esc(mailLink('Custom cabinetry enquiry')) + '">' +
            '<i class="fa-regular fa-envelope"></i> ' + esc(c.emailButton || 'Email us directly') + '</a>' +
            '</div>';
    }

    function renderContactSection() {
        var c = SITE.contactSection || {};
        sectionHead('#contactHead', c);
        setText('#formTitle', c.formTitle || 'Request a quote');
        setText('#formDesc', c.formDesc || '');

        var methods = $('#contactMethods');
        if (!methods) return;
        var contact = SITE.contact || {};
        methods.innerHTML =
            '<a class="contact-method" href="' + esc(waLink('Hello TSJ, I would like a quote.')) + '" target="_blank" rel="noopener">' +
            '<i class="fa-brands fa-whatsapp"></i><div><span>WhatsApp</span><strong>' + esc(contact.phone || '') + '</strong></div></a>' +
            '<a class="contact-method" href="' + esc(mailLink()) + '">' +
            '<i class="fa-regular fa-envelope"></i><div><span>Email</span><strong>' + esc(contact.email || '') + '</strong></div></a>' +
            '<a class="contact-method" href="tel:' + esc((contact.phone || '').replace(/\s+/g, '')) + '">' +
            '<i class="fa-solid fa-phone"></i><div><span>Phone</span><strong>' + esc(contact.phone || '') + '</strong></div></a>';
    }

    function renderFooter() {
        setText('#footerAbout', get(SITE, ['footer', 'about'], ''));
        setText('#footerCopyright', get(SITE, ['footer', 'copyright'], ''));
    }

    function renderPopup() {
        var p = SITE.popup || {};
        setText('#leadModalTitle', p.title || '');
        setText('#leadModalDesc', p.desc || '');
        setText('#leadModalBadge', p.badge || '');
        setText('#leadModalNote', p.note || '');
        setText('#leadSubmit', p.submitText || 'Send my details');
        setText('#leadSuccessTitle', p.successTitle || '');
        setText('#leadSuccessDesc', p.successDesc || '');
        var img = $('#leadModalImage');
        if (img && p.image) img.src = p.image;
    }

    /* ---------------- countries ---------------- */
    function fillCountries() {
        var list = window.TSJ_COUNTRIES || [];
        var options = list.map(function (entry) {
            var parts = entry.split('|');
            return '<option value="' + esc(parts[0]) + '" data-dial="' + esc(parts[1] || '') + '">' + esc(parts[0]) + '</option>';
        }).join('');

        ['#lCountry', '#cCountry'].forEach(function (sel) {
            var node = $(sel);
            if (!node) return;
            node.innerHTML = '<option value="">Select your country</option>' + options;
            node.addEventListener('change', function () {
                var opt = node.options[node.selectedIndex];
                var dial = opt ? opt.getAttribute('data-dial') : '';
                var form = node.closest('form');
                var tel = form ? $('input[type="tel"]', form) : null;
                if (tel && dial && !tel.value) tel.placeholder = dial + ' 555 000 0000';
            });
        });
    }

    /* ---------------- slider ---------------- */
    function initSlider() {
        var slides = $$('.hero-slide');
        var dots = $$('.hero-dot');
        if (slides.length < 2) return;

        var index = 0;
        var timer = null;
        var locked = false;

        function go(next) {
            if (locked) return;
            locked = true;
            slides[index].classList.remove('is-active');
            if (dots[index]) dots[index].classList.remove('is-active');

            index = (next + slides.length) % slides.length;

            slides[index].classList.add('is-active');
            if (dots[index]) dots[index].classList.add('is-active');
            setTimeout(function () { locked = false; }, 700);
        }

        function start() {
            stop();
            timer = setInterval(function () { go(index + 1); }, 7000);
        }
        function stop() { if (timer) clearInterval(timer); timer = null; }

        var prev = $('#heroPrev');
        var next = $('#heroNext');
        if (prev) prev.addEventListener('click', function () { go(index - 1); start(); });
        if (next) next.addEventListener('click', function () { go(index + 1); start(); });

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                go(parseInt(dot.getAttribute('data-index'), 10));
                start();
            });
        });

        var hero = $('.hero');
        if (hero) {
            hero.addEventListener('mouseenter', stop);
            hero.addEventListener('mouseleave', start);

            var startX = 0;
            hero.addEventListener('touchstart', function (e) { startX = e.changedTouches[0].clientX; }, { passive: true });
            hero.addEventListener('touchend', function (e) {
                var diff = startX - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 50) { go(index + (diff > 0 ? 1 : -1)); start(); }
            }, { passive: true });
        }

        document.addEventListener('visibilitychange', function () {
            document.hidden ? stop() : start();
        });

        start();
    }

    /* ---------------- nav ---------------- */
    function initNav() {
        var header = $('#header');
        var toggle = $('#menuToggle');
        var nav = $('#nav');

        function closeNav() {
            if (!nav) return;
            nav.classList.remove('is-open');
            toggle && toggle.classList.remove('is-active');
            toggle && toggle.setAttribute('aria-expanded', 'false');
            header && header.classList.remove('is-open');
            document.body.style.overflow = '';
        }

        if (toggle && nav) {
            toggle.addEventListener('click', function () {
                var open = nav.classList.toggle('is-open');
                toggle.classList.toggle('is-active', open);
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
                header.classList.toggle('is-open', open);
                document.body.style.overflow = open ? 'hidden' : '';
            });
            $$('.nav-link, .nav-mobile-link', nav).forEach(function (link) {
                link.addEventListener('click', closeNav);
            });
            window.addEventListener('resize', function () {
                if (window.innerWidth > 900) closeNav();
            });
        }

        function onScroll() {
            if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        /* active section */
        var sections = $$('main section[id]');
        var links = $$('.nav-link');
        if (!sections.length || !('IntersectionObserver' in window)) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var id = entry.target.getAttribute('id');
                links.forEach(function (link) {
                    link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach(function (section) { observer.observe(section); });
    }

    /* ---------------- lead modal ---------------- */
    function popupAllowed() {
        var p = SITE.popup || {};
        if (!p.enabled) return false;
        if (localStorage.getItem('tsj_lead_submitted') === '1') return false;
        var freq = p.frequency || 'session';
        if (freq === 'always') return true;
        if (freq === 'session') return sessionStorage.getItem('tsj_popup_shown') !== '1';
        /* once per visit period (default 7 days) */
        var last = parseInt(localStorage.getItem('tsj_popup_shown_at') || '0', 10);
        return !last || (Date.now() - last) > 7 * 24 * 3600 * 1000;
    }

    function markPopupShown() {
        var p = SITE.popup || {};
        var freq = p.frequency || 'session';
        if (freq === 'session') sessionStorage.setItem('tsj_popup_shown', '1');
        if (freq === 'week') localStorage.setItem('tsj_popup_shown_at', String(Date.now()));
    }

    function openLeadModal() {
        var modal = $('#leadModal');
        if (!modal) return;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(function () {
            var first = $('#lName');
            if (first && !modal.querySelector('.lead-success:not([hidden])')) first.focus({ preventScroll: true });
        }, 220);
    }

    function closeLeadModal() {
        var modal = $('#leadModal');
        if (!modal) return;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function initLeadModal() {
        document.addEventListener('click', function (e) {
            var opener = e.target.closest('[data-open-lead]');
            if (opener) {
                e.preventDefault();
                openLeadModal();
                return;
            }
            if (e.target.closest('[data-close-lead]')) {
                e.preventDefault();
                closeLeadModal();
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeLeadModal();
        });

        var p = SITE.popup || {};
        if (!popupAllowed()) return;

        var delay = Math.max(1, parseInt(p.delaySeconds, 10) || 10);
        setTimeout(function () {
            if (document.hidden) return;
            var modal = $('#leadModal');
            if (modal && modal.classList.contains('is-open')) return;
            if (localStorage.getItem('tsj_lead_submitted') === '1') return;
            openLeadModal();
            markPopupShown();
        }, delay * 1000);
    }

    /* ---------------- submitting leads ---------------- */
    function leadPayload(source, form) {
        var data = {
            name: ($('#lName', form) || {}).value || '',
            phone: ($('#lPhone', form) || {}).value || '',
            country: ($('#lCountry', form) || {}).value || '',
            email: ($('#cEmail', form) || {}).value || '',
            region: ($('#cRegion', form) || {}).value || '',
            interest: ($('#cInterest', form) || {}).value || '',
            message: ($('#cMessage', form) || {}).value || ''
        };
        Object.keys(data).forEach(function (k) { data[k] = String(data[k]).trim(); });
        return {
            name: data.name,
            phone: data.phone,
            country: data.country,
            email: data.email,
            region: data.region,
            interest: data.interest,
            message: data.message,
            source: source,
            page: location.href,
            submittedAt: new Date().toLocaleString('en-GB', { hour12: false })
        };
    }

    function validate(payload) {
        var errors = [];
        if (!payload.name || payload.name.length < 2) errors.push('Please enter your name.');
        var phoneDigits = digits(payload.phone);
        if (phoneDigits.length < 6) errors.push('Please enter a valid phone number.');
        if (!payload.country) errors.push('Please select your country.');
        if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) {
            errors.push('Please enter a valid email address.');
        }
        return errors;
    }

    function formSubmitEndpoint(email) {
        return 'https://formsubmit.co/ajax/' + encodeURIComponent(email);
    }

    function postJSON(url, body, headers) {
        return fetch(url, {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json', 'Accept': 'application/json' }, headers || {}),
            body: JSON.stringify(body)
        }).then(function (res) {
            return res.text().then(function (text) {
                var json = null;
                try { json = JSON.parse(text); } catch (err) { /* plain text response */ }
                return { ok: res.ok, status: res.status, json: json, text: text };
            });
        });
    }

    function sendLead(payload) {
        var s = SITE.leadSettings || {};
        var provider = s.provider || 'formsubmit';
        var subject = 'New cabinetry enquiry — ' + payload.name + ' (' + payload.country + ')';

        if (provider === 'formsubmit') {
            var to = s.recipientEmail || get(SITE, ['contact', 'email']);
            if (!to) return Promise.reject(new Error('No recipient email configured'));
            return postJSON(formSubmitEndpoint(to), {
                _subject: subject,
                _template: 'table',
                _captcha: 'false',
                _replyto: payload.email || '',
                Name: payload.name,
                Phone: payload.phone,
                Country: payload.country,
                'City / State': payload.region || '-',
                Email: payload.email || '-',
                Interest: payload.interest || '-',
                Message: payload.message || '-',
                Source: payload.source,
                Page: payload.page,
                'Submitted at': payload.submittedAt
            }).then(function (res) {
                var flag = res.json && (res.json.success === true || res.json.success === 'true');
                if (!res.ok || (res.json && !flag && res.json.success !== undefined)) {
                    throw new Error((res.json && (res.json.message || res.json.error)) || 'Form service rejected the request');
                }
                return res;
            });
        }

        if (provider === 'emailjs') {
            if (!s.emailjsServiceId || !s.emailjsTemplateId || !s.emailjsPublicKey) {
                return Promise.reject(new Error('EmailJS is not configured'));
            }
            return postJSON('https://api.emailjs.com/api/v1.0/email/send', {
                service_id: s.emailjsServiceId,
                template_id: s.emailjsTemplateId,
                user_id: s.emailjsPublicKey,
                template_params: {
                    to_email: s.recipientEmail,
                    subject: subject,
                    name: payload.name,
                    phone: payload.phone,
                    country: payload.country,
                    region: payload.region,
                    email: payload.email,
                    interest: payload.interest,
                    message: payload.message,
                    source: payload.source,
                    page: payload.page,
                    time: payload.submittedAt
                }
            }).then(function (res) {
                if (!res.ok) throw new Error(res.text || 'EmailJS error');
                return res;
            });
        }

        if (provider === 'web3forms') {
            if (!s.web3formsKey) return Promise.reject(new Error('Web3Forms key missing'));
            return postJSON('https://api.web3forms.com/submit', {
                access_key: s.web3formsKey,
                subject: subject,
                from_name: payload.name,
                name: payload.name,
                phone: payload.phone,
                country: payload.country,
                email: payload.email || 'not-provided@example.com',
                message: [
                    'Phone: ' + payload.phone,
                    'Country: ' + payload.country,
                    'City/State: ' + (payload.region || '-'),
                    'Interest: ' + (payload.interest || '-'),
                    'Email: ' + (payload.email || '-'),
                    '',
                    payload.message || ''
                ].join('\n')
            }).then(function (res) {
                if (!res.ok || (res.json && res.json.success === false)) throw new Error(res.text || 'Web3Forms error');
                return res;
            });
        }

        if (provider === 'webhook') {
            if (!s.webhookUrl) return Promise.reject(new Error('Webhook URL missing'));
            return postJSON(s.webhookUrl, payload).then(function (res) {
                if (!res.ok) throw new Error('Webhook responded ' + res.status);
                return res;
            });
        }

        return Promise.reject(new Error('No delivery channel configured'));
    }

    function setBusy(btn, busy) {
        if (!btn) return;
        btn.classList.toggle('is-loading', busy);
        btn.disabled = busy;
    }

    function feedback(el, message, type) {
        if (!el) return;
        el.className = 'form-feedback is-visible ' + (type === 'success' ? 'is-success' : 'is-error');
        el.innerHTML = message;
    }

    function fallbackLinks(payload) {
        return ' <a href="' + esc(waLink('Hello TSJ, my name is ' + payload.name + ' from ' + payload.country + '. My phone: ' + payload.phone)) +
            '" target="_blank" rel="noopener" style="text-decoration:underline">WhatsApp</a> · ' +
            '<a href="' + esc(mailLink('Cabinetry enquiry — ' + payload.name)) + '" style="text-decoration:underline">Email</a>';
    }

    function initLeadForm() {
        var form = $('#leadForm');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (LEAD_BUSY) return;

            var payload = leadPayload('popup', form);
            var errors = validate(payload);
            var fb = $('#leadFeedback');

            if (errors.length) {
                feedback(fb, errors.join('<br>'), 'error');
                return;
            }
            if (fb) { fb.className = 'form-feedback'; fb.innerHTML = ''; }

            var btn = $('#leadSubmit');
            LEAD_BUSY = true;
            setBusy(btn, true);

            sendLead(payload).then(function () {
                localStorage.setItem('tsj_lead_submitted', '1');
                form.hidden = true;
                var body = $('.lead-modal-body');
                if (body) body.classList.add('is-done');
                var ok = $('#leadSuccess');
                if (ok) ok.hidden = false;
                var wa = $('#leadSuccessWhatsapp');
                if (wa) wa.href = waLink('Hello TSJ, my name is ' + payload.name + ' from ' + payload.country + '. My phone: ' + payload.phone);
                toast('Details sent — thank you!', 'success');
            }).catch(function (err) {
                var msg = (SITE.leadSettings && SITE.leadSettings.errorMessage) || 'We could not send automatically.';
                feedback(fb, esc(msg) + fallbackLinks(payload), 'error');
                console.warn('[TSJ] lead delivery failed:', err && err.message);
            }).then(function () {
                LEAD_BUSY = false;
                setBusy(btn, false);
            });
        });
    }

    function initContactForm() {
        var form = $('#contactForm');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (LEAD_BUSY) return;

            var payload = leadPayload('contact-form', form);
            var errors = validate(payload);
            var fb = $('#contactFeedback');

            if (errors.length) {
                feedback(fb, errors.join('<br>'), 'error');
                return;
            }

            var btn = $('#contactSubmit');
            LEAD_BUSY = true;
            setBusy(btn, true);

            sendLead(payload).then(function () {
                localStorage.setItem('tsj_lead_submitted', '1');
                feedback(fb, esc((SITE.leadSettings && SITE.leadSettings.successMessage) || 'Thank you — we will reply within 24 hours.'), 'success');
                form.reset();
                toast('Enquiry sent — thank you!', 'success');
            }).catch(function (err) {
                var msg = (SITE.leadSettings && SITE.leadSettings.errorMessage) || 'We could not send automatically.';
                feedback(fb, esc(msg) + fallbackLinks(payload), 'error');
                console.warn('[TSJ] lead delivery failed:', err && err.message);
            }).then(function () {
                LEAD_BUSY = false;
                setBusy(btn, false);
            });
        });
    }

    /* ---------------- boot ---------------- */
    function render() {
        renderMeta();
        renderBrand();
        renderContact();
        renderHero();
        renderStats();
        renderMaterials();
        renderCraft();
        renderPricing();
        renderCollections();
        renderCategories();
        renderPortfolio();
        renderWhy();
        renderProcess();
        renderCta();
        renderContactSection();
        renderFooter();
        renderPopup();
        fillCountries();
        initSlider();
        initLeadModal();
        initLeadForm();
        initContactForm();
        revealize();
    }

    function load() {
        fetch(CONFIG_URL + '?v=' + Date.now(), { cache: 'no-store' })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (json) {
                SITE = Object.assign({}, FALLBACK, json);
                window.TSJ_SITE = SITE;
                render();
            })
            .catch(function (err) {
                console.warn('[TSJ] falling back to built-in content:', err && err.message);
                SITE = FALLBACK;
                window.TSJ_SITE = SITE;
                render();
            });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initNav();
        load();
    });
})();
