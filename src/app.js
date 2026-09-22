import { toolsData, categories } from './data/tools.js';

// Application State
const state = {
  searchQuery: '',
  selectedCategory: 'All',
  selectedPricing: 'All',
  sortBy: 'recommended'
};

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchClearBtn = document.getElementById('searchClearBtn');
const categoryChipsContainer = document.getElementById('categoryChips');
const pricingFilterSelect = document.getElementById('pricingFilter');
const sortSelect = document.getElementById('sortSelect');
const toolGrid = document.getElementById('toolGrid');
const resultsCountEl = document.getElementById('resultsCount');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const emptyStateEl = document.getElementById('emptyState');
const emptyResetBtn = document.getElementById('emptyResetBtn');

// Mobile Navigation
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const siteNav = document.getElementById('siteNav');

// Modal Elements
const suggestToolBtn = document.getElementById('suggestToolBtn');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const suggestForm = document.getElementById('suggestForm');
const formSuccessMsg = document.getElementById('formSuccessMsg');

/**
 * Initialize Application
 */
function init() {
  renderCategoryChips();
  bindEvents();
  render();
}

/**
 * Render Category Filter Chips
 */
function renderCategoryChips() {
  categoryChipsContainer.innerHTML = categories.map(cat => {
    const isActive = cat === state.selectedCategory;
    return `
      <button
        type="button"
        class="chip ${isActive ? 'active' : ''}"
        data-category="${escapeHtml(cat)}"
        role="tab"
        aria-selected="${isActive}"
      >
        ${escapeHtml(cat)}
      </button>
    `;
  }).join('');
}

/**
 * Bind Event Listeners
 */
function bindEvents() {
  // Search Input
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    searchClearBtn.hidden = !state.searchQuery;
    render();
  });

  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    searchClearBtn.hidden = true;
    searchInput.focus();
    render();
  });

  // Category Filter Chips Click
  categoryChipsContainer.addEventListener('click', (e) => {
    const chipBtn = e.target.closest('.chip');
    if (!chipBtn) return;

    const category = chipBtn.dataset.category;
    if (category) {
      state.selectedCategory = category;
      renderCategoryChips();
      render();
    }
  });

  // Pricing Filter Select
  pricingFilterSelect.addEventListener('change', (e) => {
    state.selectedPricing = e.target.value;
    render();
  });

  // Sort Select
  sortSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    render();
  });

  // Reset Filters Buttons
  resetFiltersBtn.addEventListener('click', resetAllFilters);
  emptyResetBtn.addEventListener('click', resetAllFilters);

  // Mobile Menu Toggle
  mobileMenuToggle.addEventListener('click', () => {
    const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
    mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
    siteNav.classList.toggle('open');
  });

  // Modal Dialog Handlers
  suggestToolBtn.addEventListener('click', openModal);
  modalCloseBtn.addEventListener('click', closeModal);
  modalCancelBtn.addEventListener('click', closeModal);

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalBackdrop.hidden) {
      closeModal();
    }
  });

  suggestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    formSuccessMsg.hidden = false;
    suggestForm.reset();
    setTimeout(() => {
      formSuccessMsg.hidden = true;
      closeModal();
    }, 2500);
  });
}

/**
 * Reset All Filters & Search
 */
function resetAllFilters() {
  state.searchQuery = '';
  state.selectedCategory = 'All';
  state.selectedPricing = 'All';
  state.sortBy = 'recommended';

  searchInput.value = '';
  searchClearBtn.hidden = true;
  pricingFilterSelect.value = 'All';
  sortSelect.value = 'recommended';

  renderCategoryChips();
  render();
}

/**
 * Filter and Sort Tools Data
 */
function getFilteredTools() {
  return toolsData.filter(tool => {
    // 1. Category Filter
    if (state.selectedCategory !== 'All' && tool.category !== state.selectedCategory) {
      return false;
    }

    // 2. Pricing Filter
    if (state.selectedPricing !== 'All') {
      if (state.selectedPricing === 'Free' && tool.pricingLabel !== 'Free') return false;
      if (state.selectedPricing === 'Freemium' && tool.pricingLabel !== 'Freemium') return false;
      if (state.selectedPricing === 'Free Trial' && tool.pricingLabel !== 'Free Trial') return false;
      if (state.selectedPricing === 'Paid' && tool.pricingLabel !== 'Paid') return false;
    }

    // 3. Search Query Matching (Name, Description, Use Cases, Category, Tags)
    if (state.searchQuery) {
      const q = state.searchQuery;
      const nameMatch = tool.name.toLowerCase().includes(q);
      const descMatch = tool.shortDescription.toLowerCase().includes(q);
      const categoryMatch = tool.category.toLowerCase().includes(q);
      const tagMatch = tool.tags.some(tag => tag.toLowerCase().includes(q));
      const useCaseMatch = tool.useCases.some(uc => uc.toLowerCase().includes(q));

      return nameMatch || descMatch || categoryMatch || tagMatch || useCaseMatch;
    }

    return true;
  }).sort((a, b) => {
    if (state.sortBy === 'alphabetical') {
      return a.name.localeCompare(b.name);
    }
    // Default Recommended Order - Preserves curated priority list
    return 0;
  });
}

/**
 * Main Render Function
 */
function render() {
  const filteredTools = getFilteredTools();

  // Update Results Count & Reset Button Visibility
  resultsCountEl.textContent = `Showing ${filteredTools.length} ${filteredTools.length === 1 ? 'tool' : 'tools'}`;

  const isFilterActive = state.searchQuery || state.selectedCategory !== 'All' || state.selectedPricing !== 'All' || state.sortBy !== 'recommended';
  resetFiltersBtn.hidden = !isFilterActive;

  // Handle Empty State
  if (filteredTools.length === 0) {
    toolGrid.innerHTML = '';
    emptyStateEl.hidden = false;
    return;
  }

  emptyStateEl.hidden = true;

  // Render Tool Cards
  toolGrid.innerHTML = filteredTools.map(tool => createToolCardHtml(tool)).join('');
}

/**
 * Create Tool Card Markup
 */
function createToolCardHtml(tool) {
  const badgeClass = getPricingBadgeClass(tool.pricingLabel);

  return `
    <article class="tool-card" data-id="${tool.id}">
      <div class="card-header">
        <div class="card-icon" aria-hidden="true">${tool.icon || '⚡'}</div>
        <div class="card-title-group">
          <h2 class="card-title">${escapeHtml(tool.name)}</h2>
          <span class="card-category-badge">${escapeHtml(tool.category)}</span>
        </div>
      </div>

      <p class="card-description">${escapeHtml(tool.shortDescription)}</p>

      <div class="card-usecases">
        <div class="usecases-title">Key Use Cases</div>
        <div class="usecases-tags">
          ${tool.useCases.slice(0, 3).map(uc => `<span class="usecase-tag">${escapeHtml(uc)}</span>`).join('')}
        </div>
      </div>

      <div class="card-footer">
        <span class="pricing-badge ${badgeClass}" title="${escapeHtml(tool.pricingSummary)}">
          ${escapeHtml(tool.pricingLabel)}
        </span>
        <a
          href="${escapeHtml(tool.officialUrl)}"
          target="_blank"
          rel="noopener noreferrer"
          class="visit-link"
          aria-label="Visit official website for ${escapeHtml(tool.name)} (opens in new tab)"
        >
          <span>Visit Website</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  `;
}

/**
 * Helper to Get CSS Badge Class for Pricing
 */
function getPricingBadgeClass(pricingLabel) {
  switch (pricingLabel) {
    case 'Free': return 'pricing-free';
    case 'Freemium': return 'pricing-freemium';
    case 'Free Trial': return 'pricing-free-trial';
    case 'Paid': return 'pricing-paid';
    default: return 'pricing-freemium';
  }
}

/**
 * Utility: Escape HTML String
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Modal Control Helpers
 */
function openModal() {
  modalBackdrop.hidden = false;
  document.getElementById('suggestName').focus();
}

function closeModal() {
  modalBackdrop.hidden = true;
  formSuccessMsg.hidden = true;
}

// Start Application on DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
