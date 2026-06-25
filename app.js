const productGrid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#product-search");
const filterButtons = [...document.querySelectorAll(".filter-button")];
const resultCount = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
const clearFiltersButton = document.querySelector("#clear-filters");
const modal = document.querySelector("#product-modal");
const modalContent = document.querySelector("#modal-content");
const modalClose = document.querySelector(".modal-close");
const themeToggle = document.querySelector(".theme-toggle");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

let products = [];
let activeCategory = "Todos";
let lastFocusedElement = null;

function applyTheme(theme, persist = true) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Activar modo claro" : "Activar modo oscuro",
  );
  themeColorMeta.setAttribute("content", isDark ? "#11110f" : "#171716");

  if (persist) {
    try {
      localStorage.setItem("do-theme", isDark ? "dark" : "light");
    } catch {
      // El tema funciona aunque el navegador bloquee el almacenamiento local.
    }
  }
}

applyTheme(document.documentElement.dataset.theme || "light", false);

themeToggle.addEventListener("click", () => {
  const nextTheme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
});

const currency = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const normalizeText = (value) =>
  value
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const stockClass = (stock) => {
  const classes = {
    Disponible: "stock-disponible",
    "Sin stock": "stock-sin-stock",
    "Disponible a pedido": "stock-a-pedido",
  };
  return classes[stock] || "stock-a-pedido";
};

const productCard = (product, index) => `
  <article class="product-card" style="animation-delay:${Math.min(index * 45, 270)}ms">
    <div class="product-image-wrap">
      <img
        class="product-image"
        src="${product.imagen}"
        alt="${product.nombre}"
        width="360"
        height="240"
        loading="lazy"
      />
      <span class="product-category">${product.categoria}</span>
    </div>
    <div class="product-body">
      <span class="product-code">CÓD. ${product.codigo}</span>
      <h3 class="product-name">${product.nombre}</h3>
      <div class="product-meta">
        <div class="price-block">
          <small>Precio con IVA</small>
          <strong>${currency.format(product.precioIva)}</strong>
        </div>
        <span class="stock-badge ${stockClass(product.stock)}">${product.stock}</span>
      </div>
      <button class="detail-button" type="button" data-product-id="${product.id}">
        Ver detalle
      </button>
    </div>
  </article>
`;

function renderProducts() {
  const query = normalizeText(searchInput.value.trim());
  const filtered = products.filter((product) => {
    const matchesCategory =
      activeCategory === "Todos" || product.categoria === activeCategory;
    const searchable = normalizeText(
      `${product.nombre} ${product.codigo} ${product.descripcion}`,
    );
    return matchesCategory && searchable.includes(query);
  });

  productGrid.innerHTML = filtered.map(productCard).join("");
  productGrid.hidden = filtered.length === 0;
  emptyState.hidden = filtered.length !== 0;
  resultCount.textContent = `${filtered.length} ${
    filtered.length === 1 ? "producto" : "productos"
  }`;
}

function setActiveCategory(category) {
  activeCategory = category;
  filterButtons.forEach((button) => {
    const isActive = button.dataset.category === category;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderProducts();
}

function openModal(product) {
  lastFocusedElement = document.activeElement;
  modalContent.innerHTML = `
    <div class="modal-product-head">
      <div class="modal-image">
        <img src="${product.imagen}" alt="${product.nombre}" width="420" height="300" />
      </div>
      <div class="modal-summary">
        <span class="product-code">CÓD. ${product.codigo} · ${product.categoria}</span>
        <h2 id="modal-title">${product.nombre}</h2>
        <p>${product.descripcion}</p>
        <p style="margin-top:16px">
          <span class="stock-badge ${stockClass(product.stock)}">${product.stock}</span>
        </p>
      </div>
    </div>
    <section class="spec-sheet" aria-label="Ficha técnica">
      <div class="spec-heading">
        <strong>FICHA TÉCNICA</strong>
        <span>DO / ${product.codigo}</span>
      </div>
      <dl class="spec-list">
        <div class="spec-row">
          <dt>Código</dt>
          <dd>${product.codigo}</dd>
        </div>
        <div class="spec-row">
          <dt>Cantidad por embalaje</dt>
          <dd>${product.embalaje}</dd>
        </div>
        <div class="spec-row is-price">
          <dt>Precio neto</dt>
          <dd>${currency.format(product.precioNeto)}</dd>
        </div>
        <div class="spec-row is-total">
          <dt>Precio con IVA</dt>
          <dd>${currency.format(product.precioIva)}</dd>
        </div>
      </dl>
    </section>
    <section class="list-action" aria-label="Agregar producto a tu lista">
      <div class="quantity-field">
        <span class="quantity-label">Cantidad</span>
        <div class="quantity-control">
          <button type="button" data-quantity-action="decrease" aria-label="Disminuir cantidad">
            −
          </button>
          <input
            id="product-quantity"
            type="number"
            min="1"
            max="999"
            value="1"
            inputmode="numeric"
            aria-label="Cantidad del producto"
          />
          <button type="button" data-quantity-action="increase" aria-label="Aumentar cantidad">
            +
          </button>
        </div>
      </div>
      <button class="add-list-button" type="button" data-add-to-list>
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5 6h14M5 12h9M5 18h7M18 15v6M15 18h6" />
        </svg>
        <span>Agregar a tu lista</span>
      </button>
    </section>
  `;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  modalClose.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  lastFocusedElement?.focus();
}

async function loadProducts() {
  if (Array.isArray(window.PRODUCTOS)) {
    products = window.PRODUCTOS;
    renderProducts();
    return;
  }

  try {
    const response = await fetch("productos.json");
    if (!response.ok) throw new Error("No se pudo cargar el catálogo.");
    products = await response.json();
    renderProducts();
  } catch (error) {
    resultCount.textContent = "Catálogo no disponible";
    productGrid.innerHTML = `
      <div class="empty-state" style="display:block;grid-column:1/-1">
        <h3>No pudimos cargar los productos</h3>
        <p>Abre el proyecto mediante un servidor local para permitir la lectura de productos.json.</p>
      </div>
    `;
    console.error(error);
  }
}

searchInput.addEventListener("input", renderProducts);

filterButtons.forEach((button) => {
  button.setAttribute(
    "aria-pressed",
    String(button.dataset.category === activeCategory),
  );
  button.addEventListener("click", () => setActiveCategory(button.dataset.category));
});

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-product-id]");
  if (!button) return;
  const product = products.find(({ id }) => id === Number(button.dataset.productId));
  if (product) openModal(product);
});

modalContent.addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-quantity-action]");
  const quantityInput = modalContent.querySelector("#product-quantity");

  if (quantityButton && quantityInput) {
    const direction = quantityButton.dataset.quantityAction;
    const currentValue = Number(quantityInput.value) || 1;
    quantityInput.value = String(
      direction === "increase"
        ? Math.min(currentValue + 1, 999)
        : Math.max(currentValue - 1, 1),
    );
  }

  const addButton = event.target.closest("[data-add-to-list]");
  if (addButton && quantityInput) {
    const label = addButton.querySelector("span");
    label.textContent = "Producto agregado";
    addButton.classList.add("is-added");

    window.setTimeout(() => {
      label.textContent = "Agregar a tu lista";
      addButton.classList.remove("is-added");
    }, 1800);
  }
});

modalContent.addEventListener("change", (event) => {
  if (event.target.id !== "product-quantity") return;
  const value = Number(event.target.value) || 1;
  event.target.value = String(Math.min(Math.max(value, 1), 999));
});

clearFiltersButton.addEventListener("click", () => {
  searchInput.value = "";
  setActiveCategory("Todos");
  searchInput.focus();
});

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape" && !modal.hidden) closeModal();
  if (event.key === "Tab" && !modal.hidden) {
    const focusable = [...modal.querySelectorAll("button, [href], input")];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

loadProducts();
