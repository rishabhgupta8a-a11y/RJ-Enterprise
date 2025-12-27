/*
  =====================================================
  PRODUCT DETAIL PAGE (Option A)
  =====================================================

  URL format:
    product.html?id=12

  Data source:
    data.js (window.FURNITURE_DATA)

  IMPORTANT:
  - hiddenTags are used for searching ONLY.
  - hiddenTags are NEVER displayed on the UI.
*/

(function () {
  const DATA = window.FURNITURE_DATA;
  if (!DATA) return;

  const els = {
    brandText: document.getElementById("brandText"),
    footerText: document.getElementById("footerText"),
    productDetail: document.getElementById("productDetail"),
    searchInput: document.getElementById("searchInput"),

    navToggle: document.getElementById("navToggle"),
    navMenu: document.getElementById("navMenu"),
    categoryMenuButton: document.getElementById("categoryMenuButton"),
    categoryMenu: document.getElementById("categoryMenu"),
  };

  function escapeText(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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

  function renderHeader() {
    els.brandText.textContent = DATA.brand?.name || "Furniture";
    els.footerText.textContent = DATA.pages?.footer || "";
  }

  function renderCategoryDropdown() {
    if (!els.categoryMenu) return;
    els.categoryMenu.innerHTML = "";

    const categories = Array.from(new Set((DATA.products || []).map((p) => p.category))).sort();
    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.textContent = "All Products";
    allBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
    const allLi = document.createElement("li");
    allLi.appendChild(allBtn);
    els.categoryMenu.appendChild(allLi);

    categories.forEach((cat) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        window.location.href = "index.html?category=" + encodeURIComponent(cat);
      });
      li.appendChild(btn);
      els.categoryMenu.appendChild(li);
    });
  }

  function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("id");
    const id = Number(raw);
    return Number.isFinite(id) ? id : null;
  }

  function findProductById(id) {
    return (DATA.products || []).find((p) => Number(p.id) === Number(id)) || null;
  }

  function renderNotFound(message) {
    document.title = "Product Not Found";
    els.productDetail.innerHTML =
      "<div class=\"product-not-found\">" +
      "<h1>Product not found</h1>" +
      "<p>" +
      escapeText(message) +
      "</p>" +
      "<a class=\"page-btn\" href=\"index.html\">Back to Catalog</a>" +
      "</div>";
  }

  function normalizeImages(product) {
    const preferred = Array.isArray(product.images) ? product.images.filter(Boolean) : [];

    const legacy = Array.isArray(product.image)
      ? product.image.filter(Boolean)
      : product.image
        ? [product.image]
        : [];

    const resolved = preferred.length ? preferred : legacy;
    return resolved.map((x) => String(x));
  }

  function createZoomOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "zoom-overlay";
    overlay.hidden = true;
    overlay.innerHTML =
      "<button class=\"zoom-close\" type=\"button\" aria-label=\"Close\">×</button>" +
      "<div class=\"zoom-stage\" role=\"dialog\" aria-modal=\"true\">" +
      "  <img class=\"zoom-image\" alt=\"\" />" +
      "</div>";

    const closeBtn = overlay.querySelector(".zoom-close");
    const stage = overlay.querySelector(".zoom-stage");
    const img = overlay.querySelector(".zoom-image");

    function close() {
      overlay.hidden = true;
      img.src = "";
      img.alt = "";
    }

    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    stage.addEventListener("click", close);
    window.addEventListener("keydown", (e) => {
      if (!overlay.hidden && e.key === "Escape") close();
    });

    function setPanFromEvent(e) {
      if (overlay.hidden) return;
      const rect = stage.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const ox = Math.max(0, Math.min(100, x * 100));
      const oy = Math.max(0, Math.min(100, y * 100));
      img.style.transformOrigin = ox + "% " + oy + "%";
    }

    stage.addEventListener("mousemove", setPanFromEvent);
    stage.addEventListener("touchmove", (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      setPanFromEvent(t);
    });

    function open(src, alt) {
      overlay.hidden = false;
      img.src = src;
      img.alt = alt;
      img.style.transformOrigin = "50% 50%";
    }

    return { overlay, open, close };
  }

  function renderProduct(product) {
    document.title = product.name + " | " + (DATA.brand?.name || "Catalog");

    const images = normalizeImages(product);
    const activeSrc = images[0] || "";

    els.productDetail.innerHTML =
      "<div class=\"product-detail-grid\">" +
      "  <div class=\"product-media\">" +
      "    <div class=\"product-gallery\">" +
      "      <img class=\"product-main-image\" id=\"productMainImage\" src=\"" +
      escapeText(activeSrc) +
      "\" alt=\"" +
      escapeText(product.name) +
      "\" loading=\"eager\" />" +
      "      <div class=\"product-thumbs\" id=\"productThumbs\" aria-label=\"Product images\"></div>" +
      "    </div>" +
      "  </div>" +
      "  <div class=\"product-info\">" +
      "    <h1 class=\"product-title\">" +
      escapeText(product.name) +
      "</h1>" +
      "    <div class=\"product-badges\">" +
      "      <span class=\"pill\">Category: " +
      escapeText(product.category) +
      "</span>" +
      "    </div>" +
      "    <p class=\"product-description\">" +
      escapeText(product.description) +
      "</p>" +
      "    <div class=\"product-note\">" +
      "      <span class=\"badge\">This is a catalog listing. Contact/visit for availability and final pricing.</span>" +
      "    </div>" +
      "  </div>" +
      "</div>";

    const mainImage = document.getElementById("productMainImage");
    const thumbsWrap = document.getElementById("productThumbs");
    if (!mainImage || !thumbsWrap) return;

    const zoom = createZoomOverlay();
    document.body.appendChild(zoom.overlay);

    function setActive(src) {
      mainImage.src = src;
      const btns = thumbsWrap.querySelectorAll(".thumb");
      btns.forEach((b) => b.classList.toggle("active", b.getAttribute("data-src") === src));
    }

    mainImage.addEventListener("click", () => {
      if (!mainImage.src) return;
      zoom.open(mainImage.src, product.name);
    });

    thumbsWrap.innerHTML = "";
    images.forEach((src, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "thumb";
      btn.setAttribute("data-src", src);
      btn.setAttribute("aria-label", "View image " + (idx + 1));

      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.loading = "lazy";

      btn.appendChild(img);
      btn.addEventListener("click", () => setActive(src));
      thumbsWrap.appendChild(btn);
    });

    setActive(activeSrc);
  }

  function bindEvents() {
    els.navToggle?.addEventListener("click", () => {
      const isOpen = els.navMenu.classList.contains("open");
      setMobileNavOpen(!isOpen);
    });

    els.categoryMenuButton?.addEventListener("click", () => {
      const li = els.categoryMenuButton.closest(".nav-dropdown");
      const isOpen = li?.classList.contains("open");
      setDropdownOpen(!isOpen);
    });

    document.addEventListener("click", (e) => {
      const isInsideDropdown = e.target.closest(".nav-dropdown");
      if (!isInsideDropdown) {
        setDropdownOpen(false);
      }

      const isInsideNav = e.target.closest(".header-nav");
      if (!isInsideNav) {
        setMobileNavOpen(false);
      }
    });

    els.searchInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const q = String(els.searchInput.value || "").trim();
        if (!q) {
          window.location.href = "index.html";
          return;
        }
        window.location.href = "index.html?search=" + encodeURIComponent(q);
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        setMobileNavOpen(false);
      }
    });
  }

  function init() {
    renderHeader();
    renderCategoryDropdown();
    bindEvents();

    const id = getProductIdFromUrl();
    if (id === null) {
      renderNotFound("Missing or invalid product id in URL.");
      return;
    }

    const product = findProductById(id);
    if (!product) {
      renderNotFound("No product exists with id = " + id + ".");
      return;
    }

    renderProduct(product);
  }

  init();
})();
