(function() {
  'use strict';

  // DOM elements
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const searchStats = document.getElementById('search-stats');
  const searchLoading = document.getElementById('search-loading');
  const searchClear = document.getElementById('search-clear');

  let fuse = null;
  let searchData = [];

  // Fuse.js configuration
  const fuseOptions = {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'description', weight: 0.3 },
      { name: 'quote', weight: 0.2 },
      { name: 'tags', weight: 0.05 },
      { name: 'categories', weight: 0.05 }
    ],
    threshold: 0.4,
    distance: 100,
    minMatchCharLength: 2,
    includeScore: true,
    includeMatches: true,
    ignoreLocation: true
  };

  // Load search data
  function loadSearchData() {
    searchLoading.style.display = 'block';

    fetch('/search.json')
      .then(response => response.json())
      .then(data => {
        searchData = data;
        fuse = new Fuse(searchData, fuseOptions);
        searchLoading.style.display = 'none';

        // Trigger search if there's already text in input
        if (searchInput.value.trim()) {
          performSearch(searchInput.value.trim());
        }
      })
      .catch(error => {
        console.error('Error loading search data:', error);
        searchLoading.style.display = 'none';
        searchStats.innerHTML = '<p class="text-danger">Błąd ładowania danych wyszukiwania.</p>';
      });
  }

  // Perform search
  function performSearch(query) {
    if (!fuse || query.length < 2) {
      searchResults.innerHTML = '';
      searchStats.innerHTML = '';
      return;
    }

    const results = fuse.search(query);
    displayResults(results, query);
  }

  // Display search results
  function displayResults(results, query) {
    // Update stats
    if (results.length > 0) {
      searchStats.innerHTML = `Znaleziono <strong>${results.length}</strong> ${getPolishPlural(results.length, 'wynik', 'wyniki', 'wyników')} dla "<strong>${escapeHtml(query)}</strong>"`;
    } else {
      searchStats.innerHTML = `Nie znaleziono wyników dla "<strong>${escapeHtml(query)}</strong>"`;
    }

    // Display results
    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="no-results">
          <p>Spróbuj:</p>
          <ul>
            <li>Użyć innych słów kluczowych</li>
            <li>Sprawdzić pisownię</li>
            <li>Użyć bardziej ogólnych terminów</li>
          </ul>
        </div>
      `;
      return;
    }

    // Build results HTML
    const resultsHtml = results.map(result => {
      const item = result.item;
      const date = new Date(item.date);
      const formattedDate = date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Get highlighted text
      let description = item.description || item.quote || item.content || '';
      if (description.length > 200) {
        description = description.substring(0, 200) + '...';
      }

      return `
        <article class="search-result">
          <h3 class="result-title">
            <a href="${item.url}">${escapeHtml(item.title)}</a>
          </h3>
          <div class="result-meta">
            <time datetime="${item.date}">${formattedDate}</time>
            ${item.categories && item.categories.length > 0 ?
              `<span class="result-categories">${item.categories.map(cat =>
                `<span class="badge">${escapeHtml(cat)}</span>`
              ).join(' ')}</span>` : ''}
          </div>
          ${description ? `<p class="result-description">${escapeHtml(description)}</p>` : ''}
        </article>
      `;
    }).join('');

    searchResults.innerHTML = resultsHtml;
  }

  // Polish plural helper
  function getPolishPlural(count, singular, few, many) {
    if (count === 1) return singular;
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
      return few;
    }
    return many;
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Event listeners
  if (searchInput) {
    const debouncedSearch = debounce((e) => {
      const query = e.target.value.trim();

      // Show/hide clear button
      if (query) {
        searchClear.style.display = 'block';
      } else {
        searchClear.style.display = 'none';
        searchResults.innerHTML = '';
        searchStats.innerHTML = '';
      }

      if (query.length >= 2) {
        performSearch(query);
      }
    }, 300);

    searchInput.addEventListener('input', debouncedSearch);

    // Focus on search input when page loads
    searchInput.focus();
  }

  // Clear button
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchResults.innerHTML = '';
      searchStats.innerHTML = '';
      searchClear.style.display = 'none';
      searchInput.focus();
    });
  }

  // Initialize - wait for DOM to be ready
  function init() {
    if (typeof Fuse === 'undefined') {
      console.error('Fuse.js not loaded');
      if (searchStats) {
        searchStats.innerHTML = '<p class="text-danger">Błąd: biblioteka wyszukiwania nie została załadowana.</p>';
      }
      return;
    }

    if (!searchInput || !searchResults || !searchStats) {
      console.error('Search elements not found in DOM');
      return;
    }

    loadSearchData();
  }

  // Run init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
