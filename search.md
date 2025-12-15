---
layout: page
title: Wyszukiwarka i kategorie
headline: <i class="bi bi-search"></i> Szukaj
permalink: /search/
search: true
---

<div class="search-container">
  <!-- Search box -->
  <div class="search-box">
    <input
      type="text"
      id="search-input"
      class="form-control"
      placeholder="Wpisz słowo kluczowe..."
      aria-label="Wyszukaj na blogu"
      autocomplete="off"
    >
    <button type="button" id="search-clear" class="btn btn-sm" aria-label="Wyczyść wyszukiwanie">
      <i class="bi bi-x-circle"></i>
    </button>
  </div>

  <!-- Category filters -->
  <div class="category-filters">
    <h3 class="filter-title">Filtruj po kategorii:</h3>
    <ul class="list-inline tag-list" id="category-buttons">
      <li>
        <button
          type="button"
          class="btn btn-default btn-category active"
          data-category="all"
          aria-pressed="true"
        >
          Wszystkie <span class="badge" id="all-count"></span>
        </button>
      </li>
      <!-- Categories will be loaded dynamically -->
    </ul>
  </div>

  <!-- Stats and results -->
  <div id="search-stats" class="search-stats" aria-live="polite"></div>

  <div id="search-results" class="search-results"></div>

  <div id="search-loading" class="search-loading" style="display: none;">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Ładowanie...</span>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js" crossorigin="anonymous"></script>
<script src="{{ '/js/search.js' | prepend: site.baseurl }}"></script>
