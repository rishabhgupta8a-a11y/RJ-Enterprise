/*
  =====================================================
  CATALOG LOGIC (NO BACKEND, VANILLA JS)
  =====================================================

  This script reads ALL content from data.js (window.FURNITURE_DATA)
  and renders it into the HTML placeholders.

  IMPORTANT SEARCH RULES (as required):
  Search matches:
  - Product name
  - Product description
  - Category
  - Hidden tags (hiddenTags)

  hiddenTags are NEVER displayed in the UI.
*/

(function () {
  const DATA = window.FURNITURE_DATA;
  if (!DATA) {
    return;
  }

  const els = {
    brandText: document.getElementById("brandText"),
    brandLink: document.getElementById("brandLink"),
    searchInput: document.getElementById("searchInput"),

    navToggle: document.getElementById("navToggle"),
    navMenu: document.getElementById("navMenu"),

    categoryMenuButton: document.getElementById("categoryMenuButton"),
    categoryMenu: document.getElementById("categoryMenu"),

    heroTitle: document.getElementById("heroTitle"),
    heroDescription: document.getElementById("heroDescription"),
    heroMeta: document.getElementById("heroMeta"),
    heroImage: document.getElementById("heroImage"),
    heroPrev: document.getElementById("heroPrev"),
    heroNext: document.getElementById("heroNext"),
    heroDots: document.getElementById("heroDots"),
    heroSection: document.getElementById("hero"),

    categoryBar: document.getElementById("categoryBar"),

    resultsLabel: document.getElementById("resultsLabel"),
    activeFilters: document.getElementById("activeFilters"),
    productGrid: document.getElementById("productGrid"),

    pagePrev: document.getElementById("pagePrev"),
    pageNext: document.getElementById("pageNext"),
    pageNumbers: document.getElementById("pageNumbers"),

    locationSection: document.getElementById("locationSection"),
    priceSection: document.getElementById("priceSection"),
    aboutSection: document.getElementById("aboutSection"),
    footerText: document.getElementById("footerText"),
  };

  const state = {
    selectedCategory: "All",
    searchQuery: "",
    page: 1,
    heroIndex: 0,
    heroTimer: null,
    categoryMoreOpen: false,
  };

  function applyInitialStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const search = params.get("search");

    if (category) {
      state.selectedCategory = category;
    }

    if (typeof search === "string") {
      state.searchQuery = search;
      els.searchInput.value = search;
    }
  }

  function escapeText(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalize(str) {
    return String(str || "").toLowerCase().trim();
  }

  function setDropdownOpen(isOpen) {
    const li = els.categoryMenuButton.closest(".nav-dropdown");
    if (!li) return;
    li.classList.toggle("open", isOpen);
    els.categoryMenuButton.setAttribute("aria-expanded", String(isOpen));

      }

  function setMobileNavOpen(isOpen) {
    els.navMenu.classList.toggle("open", isOpen);
    els.navToggle.setAttribute("aria-expanded", String(isOpen));
  }

  function renderStaticContent() {
    els.brandText.textContent = DATA.brand?.name || "Furniture";

    els.heroTitle.textContent = DATA.hero?.title || "";
    els.heroDescription.textContent = DATA.hero?.description || "";

    els.heroMeta.innerHTML = "";
    (DATA.hero?.pills || []).forEach((pill) => {
      const span = document.createElement("span");
      span.className = "pill";
      span.textContent = pill;
      els.heroMeta.appendChild(span);
    });

    els.locationSection.innerHTML =
      "<h2>" +
      escapeText(DATA.pages?.location?.title || "Location") +
      "</h2><p>" +
      escapeText(DATA.pages?.location?.text || "") +
      "</p>" +
      (DATA.pages?.location?.mapLink ? 
        '<p><a href="' + escapeText(DATA.pages.location.mapLink) + '" target="_blank" style="color: var(--accent); text-decoration: underline;">View on Google Maps</a></p>' : 
        ''
      );

    els.priceSection.innerHTML =
      "<h2>" +
      escapeText(DATA.pages?.price?.title || "Price List") +
      "</h2><p>" +
      escapeText(DATA.pages?.price?.text || "") +
      "</p>";

    els.aboutSection.innerHTML =
      "<h2>" +
      escapeText(DATA.pages?.about?.title || "About") +
      "</h2><p>" +
      escapeText(DATA.pages?.about?.text || "") +
      "</p>";

    els.footerText.textContent = DATA.pages?.footer || "";
  }

  function renderCategoryBar() {
    els.categoryBar.innerHTML = "";

    const allChip = document.createElement("button");
    allChip.className = "category-chip";
    allChip.textContent = "All";
    allChip.addEventListener("click", () => {
      applyCategory("All");
    });
    els.categoryBar.appendChild(allChip);

    const allCategories = Array.from(new Set((DATA.products || []).map((p) => p.category))).filter(Boolean).sort();
    const visibleCount = 3;

    let visible = allCategories.slice(0, visibleCount);
    let more = allCategories.slice(visibleCount);

    if (state.selectedCategory !== "All" && more.includes(state.selectedCategory)) {
      const swap = visible[visible.length - 1];
      visible[visible.length - 1] = state.selectedCategory;
      more = more.filter((c) => c !== state.selectedCategory);
      if (swap) more.unshift(swap);
    }

    visible.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "category-chip";
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        applyCategory(cat);
        state.categoryMoreOpen = false;
        renderCategoryBar();
      });
      els.categoryBar.appendChild(btn);
    });

    if (more.length) {
      const wrap = document.createElement("div");
      wrap.className = "category-more";

      const btn = document.createElement("button");
      btn.className = "category-chip more-chip";
      btn.type = "button";
      btn.textContent = "More";
      btn.setAttribute("aria-expanded", String(state.categoryMoreOpen));

      const menu = document.createElement("div");
      menu.className = "category-more-menu";
      menu.hidden = !state.categoryMoreOpen;

      more.forEach((cat) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "category-more-item";
        item.textContent = cat;
        item.addEventListener("click", () => {
          applyCategory(cat);
          state.categoryMoreOpen = false;
          renderCategoryBar();
        });
        menu.appendChild(item);
      });

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        state.categoryMoreOpen = !state.categoryMoreOpen;
        
        // Position dropdown dynamically
        if (state.categoryMoreOpen) {
          const rect = btn.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const dropdownWidth = 200;
          const margin = 16;
          
          // Check whether the button is on the right or left side of the screen
          const isRightSide = rect.left > (viewportWidth / 2);
          
          let leftPos;
          if (isRightSide) {
            // If button is on the right → align dropdown to the button's right edge
            leftPos = rect.right - dropdownWidth;
          } else {
            // If button is on the left → align dropdown to the button's left edge
            leftPos = rect.left;
          }
          
          // Safety check (so dropdown does not go outside the screen)
          leftPos = Math.max(
            margin,
            Math.min(leftPos, viewportWidth - dropdownWidth - margin)
          );
          
          // Apply styles to the actual dropdown menu
          setTimeout(() => {
            menu.style.position = 'fixed';
            menu.style.left = `${leftPos}px`;
            menu.style.top = `${rect.bottom + 4}px`;
            menu.style.width = `${dropdownWidth}px`;
            menu.style.maxWidth = 'calc(100vw - 32px)';
            menu.style.zIndex = '1000';
          }, 0);
        } else {
          // Reset styles when closed
          menu.style.position = '';
          menu.style.left = '';
          menu.style.top = '';
          menu.style.width = '';
          menu.style.maxWidth = '';
          menu.style.zIndex = '';
        }
        
        renderCategoryBar();
      });

      wrap.appendChild(btn);
      wrap.appendChild(menu);
      els.categoryBar.appendChild(wrap);
    }

    syncCategoryActiveUI();
  }

  function renderCategoryDropdown() {
    els.categoryMenu.innerHTML = "";

    const categories = Array.from(new Set((DATA.products || []).map((p) => p.category))).sort();
    const allCategories = categories.length ? categories : (DATA.categories || []).filter((c) => c !== "More");

    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.textContent = "All Products";
    allBtn.addEventListener("click", () => {
      applyCategory("All");
      setDropdownOpen(false);
    });
    const allLi = document.createElement("li");
    allLi.appendChild(allBtn);
    els.categoryMenu.appendChild(allLi);

    allCategories.forEach((cat) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        applyCategory(cat);
        setDropdownOpen(false);
      });
      li.appendChild(btn);
      els.categoryMenu.appendChild(li);
    });
  }

  function applyCategory(category) {
    state.selectedCategory = category;
    state.page = 1;
    render();
  }

  function applySearch(query) {
    state.searchQuery = query;
    state.page = 1;
    render();
  }

  function setHeroVisible(isVisible) {
    if (!els.heroSection) return;

    els.heroSection.hidden = !isVisible;

    if (!isVisible) {
      if (state.heroTimer) {
        window.clearInterval(state.heroTimer);
        state.heroTimer = null;
      }
      return;
    }

    renderHero();
    restartHeroAutoplay();
  }

  function syncCategoryActiveUI() {
    const chips = els.categoryBar.querySelectorAll(".category-chip");
    chips.forEach((chip) => {
      const val = chip.textContent;
      const isActive = val === state.selectedCategory;
      chip.classList.toggle("active", isActive);
    });
  }

  function productMatchesSearch(product, query) {
    if (!query) return true;

    const haystack = [
      product.name,
      product.description,
      product.category,
      ...(Array.isArray(product.hiddenTags) ? product.hiddenTags : []),
    ]
      .map(normalize)
      .join(" ");

    return haystack.includes(query);
  }

  function getFilteredProducts() {
    const q = normalize(state.searchQuery);

    return (DATA.products || []).filter((p) => {
      const byCategory = state.selectedCategory === "All" || p.category === state.selectedCategory;
      const bySearch = productMatchesSearch(p, q);
      return byCategory && bySearch;
    });
  }

  function renderProducts() {
    const filtered = getFilteredProducts();
    const perPage = Math.max(1, Number(DATA.ui?.productsPerPage || 8));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    state.page = Math.min(state.page, totalPages);

    const start = (state.page - 1) * perPage;
    const items = filtered.slice(start, start + perPage);

    els.resultsLabel.textContent =
      total === 0 ? "No products found." : "Showing " + items.length + " of " + total + " products";

    els.activeFilters.innerHTML = "";
    if (state.selectedCategory !== "All") {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = "Category: " + state.selectedCategory;
      els.activeFilters.appendChild(pill);
    }
    if (normalize(state.searchQuery)) {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = "Search: \"" + state.searchQuery + "\"";
      els.activeFilters.appendChild(pill);
    }

    els.productGrid.innerHTML = "";
    items.forEach((p) => {
      const card = document.createElement("article");
      card.className = "card";
      card.tabIndex = 0;
      card.setAttribute("role", "link");
      card.setAttribute("aria-label", "Open details for " + p.name);
      card.addEventListener("click", () => {
        window.location.href = "product.html?id=" + encodeURIComponent(String(p.id));
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.location.href = "product.html?id=" + encodeURIComponent(String(p.id));
        }
      });

      const imgWrap = document.createElement("div");
      imgWrap.className = "card-media";

      const img = document.createElement("img");
      img.src = (Array.isArray(p.images) && p.images.length ? p.images[0] : p.image) || "";
      img.alt = p.name;
      img.loading = "lazy";

      imgWrap.appendChild(img);

      const body = document.createElement("div");
      body.className = "card-body";

      const title = document.createElement("h3");
      title.className = "card-title";
      title.textContent = p.name;

      const desc = document.createElement("p");
      desc.className = "card-desc";
      desc.textContent = p.description;

      const badge = document.createElement("div");
      badge.className = "badge";
      badge.textContent = "Category: " + p.category;

      body.appendChild(title);
      body.appendChild(desc);
      body.appendChild(badge);

      card.appendChild(imgWrap);
      card.appendChild(body);

      els.productGrid.appendChild(card);
    });

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    els.pagePrev.disabled = state.page <= 1;
    els.pageNext.disabled = state.page >= totalPages;

    els.pageNumbers.innerHTML = "";

    const maxButtons = 3;
    const start = 1;
    const end = Math.min(totalPages, maxButtons);

    for (let p = start; p <= end; p += 1) {
      const btn = document.createElement("button");
      btn.className = "page-btn page-number";
      btn.textContent = String(p);
      btn.classList.toggle("active", p === state.page);
      btn.addEventListener("click", () => {
        state.page = p;
        render();
      });
      els.pageNumbers.appendChild(btn);
    }
  }

  function renderHeroDots() {
    const slides = DATA.hero?.slides || [];
    els.heroDots.innerHTML = "";

    slides.forEach((_, idx) => {
      const dot = document.createElement("button");
      dot.className = "dot";
      dot.type = "button";
      dot.setAttribute("aria-label", "Go to slide " + (idx + 1));
      dot.classList.toggle("active", idx === state.heroIndex);
      dot.addEventListener("click", () => {
        state.heroIndex = idx;
        renderHero();
        restartHeroAutoplay();
      });
      els.heroDots.appendChild(dot);
    });
  }

  function renderHero() {
    const slides = DATA.hero?.slides || [];
    if (!slides.length) return;

    const idx = ((state.heroIndex % slides.length) + slides.length) % slides.length;
    state.heroIndex = idx;

    els.heroImage.src = slides[idx].image;
    els.heroImage.alt = slides[idx].alt || "Hero slide";

    renderHeroDots();
  }

  function restartHeroAutoplay() {
    if (state.heroTimer) {
      window.clearInterval(state.heroTimer);
      state.heroTimer = null;
    }

    const ms = Number(DATA.hero?.autoplayMs || 0);
    if (!ms || ms < 1000) return;

    state.heroTimer = window.setInterval(() => {
      state.heroIndex += 1;
      renderHero();
    }, ms);
  }

  function bindEvents() {
    if (els.navToggle && els.navMenu) {
      els.navToggle.addEventListener("click", () => {
        const isOpen = els.navMenu.classList.contains("open");
        setMobileNavOpen(!isOpen);
      });
    }

    if (els.categoryMenuButton) {
      els.categoryMenuButton.addEventListener("click", () => {
        const li = els.categoryMenuButton.closest(".nav-dropdown");
        const isOpen = li?.classList.contains("open");
        setDropdownOpen(!isOpen);
      });
    }

    document.addEventListener("click", (e) => {
      const isInsideCategoryMore = e.target.closest(".category-more");
      if (!isInsideCategoryMore && state.categoryMoreOpen) {
        state.categoryMoreOpen = false;
        renderCategoryBar();
      }

      const isInsideDropdown = e.target.closest(".nav-dropdown");
      if (!isInsideDropdown) {
        setDropdownOpen(false);
      }

      const isInsideNav = e.target.closest(".header-nav");
      if (!isInsideNav) {
        setMobileNavOpen(false);
      }
    });

    els.searchInput.addEventListener("input", (e) => {
      applySearch(e.target.value);
    });

    els.pagePrev.addEventListener("click", () => {
      if (state.page > 1) {
        state.page -= 1;
        render();
      }
    });

    els.pageNext.addEventListener("click", () => {
      state.page += 1;
      render();
    });

    els.heroPrev.addEventListener("click", () => {
      state.heroIndex -= 1;
      renderHero();
      restartHeroAutoplay();
    });

    els.heroNext.addEventListener("click", () => {
      state.heroIndex += 1;
      renderHero();
      restartHeroAutoplay();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (state.categoryMoreOpen) {
          state.categoryMoreOpen = false;
          renderCategoryBar();
        }
        setDropdownOpen(false);
        setMobileNavOpen(false);
      }
    });
  }

  function render() {
    const hasSearch = Boolean(normalize(state.searchQuery));
    setHeroVisible(!hasSearch);
    renderCategoryDropdown();
    renderCategoryBar();
    syncCategoryActiveUI();
    renderProducts();
  }

  function init() {
    renderStaticContent();
    bindEvents();

    applyInitialStateFromUrl();

    render();
  }

  init();
})();

