/**
* Template Name: HeroBiz
* Template URL: https://bootstrapmade.com/herobiz-bootstrap-business-template/
* Updated: Aug 07 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader) return;
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    if (mobileNavToggleBtn) {
      mobileNavToggleBtn.classList.toggle('bi-list');
      mobileNavToggleBtn.classList.toggle('bi-x');
    }
  }
  if (mobileNavToggleBtn) mobileNavToggleBtn.addEventListener('click', mobileNavToogle);

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  // Guarded, because toggleScrollTop above already treats this element as
  // optional. Binding without a guard would throw on any page that omits it.
  if (scrollTop) {
    scrollTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  window.addEventListener('load', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    if (typeof AOS === 'undefined') return;
    AOS.init({
      duration: 450,
      easing: 'ease-out-cubic',
      offset: 40,
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  if (typeof GLightbox !== 'undefined') {
    GLightbox({ selector: '.glightbox' });
  }

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    if (typeof Swiper === 'undefined') return;
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Frequently Asked Questions Toggle
   */
  document.querySelectorAll('.faq-item h3, .faq-item .faq-toggle').forEach((faqItem) => {
    faqItem.addEventListener('click', () => {
      faqItem.parentNode.classList.toggle('faq-active');
    });
  });

  /**
   * Init isotope layout and filters
   */
  document.querySelectorAll('.isotope-layout').forEach(function(isotopeItem) {
    let layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
    let filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
    let sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';

    if (typeof imagesLoaded === 'undefined' || typeof Isotope === 'undefined') return;
    let initIsotope;
    imagesLoaded(isotopeItem.querySelector('.isotope-container'), function() {
      initIsotope = new Isotope(isotopeItem.querySelector('.isotope-container'), {
        itemSelector: '.isotope-item',
        layoutMode: layout,
        filter: filter,
        sortBy: sort
      });
    });

    isotopeItem.querySelectorAll('.isotope-filters li').forEach(function(filters) {
      filters.addEventListener('click', function() {
        isotopeItem.querySelector('.isotope-filters .filter-active').classList.remove('filter-active');
        this.classList.add('filter-active');
        initIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        if (typeof aosInit === 'function') {
          aosInit();
        }
      }, false);
    });

  });

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  window.addEventListener('load', function(e) {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a');

  // Resolve each link to its section once, instead of running a
  // document.querySelector per link on every scroll event.
  const spyTargets = [];
  navmenulinks.forEach(link => {
    if (!link.hash || link.hash === '#') return;
    let section = null;
    try { section = document.querySelector(link.hash); } catch (e) { return; }
    if (section) spyTargets.push({ link: link, section: section });
  });

  function navmenuScrollspy() {
    const position = window.scrollY + 200;
    let current = null;

    // Read first, write second. Interleaving offsetTop reads with class
    // changes forces the browser to re-run layout between each one.
    for (const t of spyTargets) {
      const top = t.section.offsetTop;
      if (position >= top && position <= top + t.section.offsetHeight) current = t.link;
    }

    for (const t of spyTargets) {
      t.link.classList.toggle('active', t.link === current);
    }
  }
  window.addEventListener('load', navmenuScrollspy);

  /**
   * One passive, rAF-throttled scroll listener for all three handlers.
   *
   * These used to be three separate non-passive listeners, each running on
   * every scroll event. A non-passive listener forces the browser to wait
   * and see whether the handler calls preventDefault before it may scroll,
   * and navmenuScrollspy reads offsetTop/offsetHeight, which forces a
   * synchronous layout. Doing that on every event is the standard cause of
   * scroll jank.
   *
   * Now the work is coalesced into a single animation frame, so it runs at
   * most once per painted frame no matter how fast the events arrive, and
   * { passive: true } tells the browser it can scroll immediately.
   */
  let scrollQueued = false;
  function onScrollFrame() {
    scrollQueued = false;
    toggleScrolled();
    toggleScrollTop();
    navmenuScrollspy();
  }
  document.addEventListener('scroll', function () {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(onScrollFrame);
  }, { passive: true });

  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if ((this.website && this.website.value) || !this.checkValidity()) return;
      const body = [
        'Name: ' + this.name.value.trim(),
        'Company: ' + this.subject.value.trim(),
        'Email: ' + this.email.value.trim(),
        'Phone: ' + (this.phone.value.trim() || '—'),
        '',
        this.message.value.trim()
      ].join('\n');
      window.location.href = 'mailto:info@basmat-almawared.com?subject=' +
        encodeURIComponent('Manpower request — ' + this.subject.value.trim()) +
        '&body=' + encodeURIComponent(body);
      const sent = this.querySelector('.sent-message');
      if (sent) sent.classList.add('d-block');
    });
  }

})();
