(function() {
  'use strict';

  // DOM elements
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const searchStats = document.getElementById('search-stats');
  const searchLoading = document.getElementById('search-loading');
  const searchClear = document.getElementById('search-clear');
  const categoryButtons = document.getElementById('category-buttons');

  let fuse = null;
  let allPosts = [];
  let allTags = [];
  let currentCategory = 'all';
  let currentQuery = '';

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
        allPosts = data.posts;
        allTags = data.allTags;

        fuse = new Fuse(allPosts, fuseOptions);
        searchLoading.style.display = 'none';

        // Initialize category buttons
        initializeCategoryButtons();

        // Display all posts initially
        displayPosts(allPosts);
      })
      .catch(error => {
        console.error('Error loading search data:', error);
        searchLoading.style.display = 'none';
        searchStats.innerHTML = '<p class="text-danger">Błąd ładowania danych wyszukiwania.</p>';
      });
  }

  // Initialize category filter buttons
  function initializeCategoryButtons() {
    if (!categoryButtons || !allTags || allTags.length === 0) return;

    // Update "Wszystkie" badge with total post count
    const allCountBadge = document.getElementById('all-count');
    if (allCountBadge && allPosts) {
      allCountBadge.textContent = allPosts.length;
    }

    // Add category buttons dynamically wrapped in <li> for list-inline styling
    allTags.forEach(tag => {
      const li = document.createElement('li');

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-default btn-category';
      button.dataset.category = tag.name;
      button.setAttribute('aria-pressed', 'false');
      button.innerHTML = `${escapeHtml(tag.name)} <span class="badge">${tag.count}</span>`;

      button.addEventListener('click', () => handleCategoryClick(tag.name, button));

      li.appendChild(button);
      categoryButtons.appendChild(li);
    });
  }

  // Handle category button click
  function handleCategoryClick(category, clickedButton) {
    currentCategory = category;

    // Update button states
    const allButtons = categoryButtons.querySelectorAll('.btn-category');
    allButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });
    clickedButton.classList.add('active');
    clickedButton.setAttribute('aria-pressed', 'true');

    // Update display
    updateDisplay();
  }

  // Update display based on current filters
  function updateDisplay() {
    if (currentQuery && currentQuery.length >= 2) {
      // Search mode
      performSearch(currentQuery);
    } else {
      // Browse mode - filter by category
      const filteredPosts = filterPostsByCategory(allPosts, currentCategory);
      displayPosts(filteredPosts);
    }
  }

  // Filter posts by category
  function filterPostsByCategory(posts, category) {
    if (category === 'all') {
      return posts;
    }
    return posts.filter(post => post.tags && post.tags.includes(category));
  }

  // Perform search
  function performSearch(query) {
    if (!fuse || query.length < 2) {
      displayPosts(filterPostsByCategory(allPosts, currentCategory));
      return;
    }

    // Get posts filtered by category first
    let postsToSearch = filterPostsByCategory(allPosts, currentCategory);

    // Search within filtered posts
    const fuseForCategory = new Fuse(postsToSearch, fuseOptions);
    const results = fuseForCategory.search(query);

    displaySearchResults(results, query);
  }

  // Display search results
  function displaySearchResults(results, query) {
    const categoryText = currentCategory === 'all'
      ? ''
      : ` w kategorii "<strong>${escapeHtml(currentCategory)}</strong>"`;

    // Update stats
    if (results.length > 0) {
      searchStats.innerHTML = `Znaleziono <strong>${results.length}</strong> ${getPolishPlural(results.length, 'wynik', 'wyniki', 'wyników')} dla "<strong>${escapeHtml(query)}</strong>"${categoryText}`;
    } else {
      searchStats.innerHTML = `Nie znaleziono wyników dla "<strong>${escapeHtml(query)}</strong>"${categoryText}`;
    }

    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="no-results">
          <p>Spróbuj:</p>
          <ul>
            <li>Użyć innych słów kluczowych</li>
            <li>Sprawdzić pisownię</li>
            <li>Użyć bardziej ogólnych terminów</li>
            ${currentCategory !== 'all' ? '<li>Zmienić wybraną kategorię lub wybrać "Wszystkie"</li>' : ''}
          </ul>
        </div>
      `;
      return;
    }

    // Display results
    const posts = results.map(result => result.item);
    displayPosts(posts);
  }

  // Display posts (for both search and browse mode)
  function displayPosts(posts) {
    if (!posts || posts.length === 0) {
      if (currentCategory !== 'all') {
        searchStats.innerHTML = `Brak wpisów w kategorii "<strong>${escapeHtml(currentCategory)}</strong>"`;
      } else {
        searchStats.innerHTML = 'Brak wpisów do wyświetlenia';
      }
      searchResults.innerHTML = '';
      return;
    }

    // Update stats for browse mode
    if (!currentQuery || currentQuery.length < 2) {
      const categoryText = currentCategory === 'all'
        ? 'wszystkich kategorii'
        : `kategorii "<strong>${escapeHtml(currentCategory)}</strong>"`;
      searchStats.innerHTML = `Wyświetlam <strong>${posts.length}</strong> ${getPolishPlural(posts.length, 'wpis', 'wpisy', 'wpisów')} z ${categoryText}`;
    }

    // Build results HTML
    const resultsHtml = posts.map(post => {
      const dateFormatted = post.dateFormatted || formatDate(post.date);

      let description = post.description || post.quote || post.content || '';
      if (description.length > 200) {
        description = description.substring(0, 200) + '...';
      }

      return `
        <article class="search-result">
          <h3 class="result-title">
            <a href="${post.url}">${escapeHtml(post.title)}</a>
          </h3>
          <div class="result-meta">
            <time datetime="${post.date}">${dateFormatted}</time>
            ${post.tags && post.tags.length > 0 ?
              `<span class="result-tags">${post.tags.map(tag =>
                `<span class="badge">${escapeHtml(tag)}</span>`
              ).join(' ')}</span>` : ''}
          </div>
          ${description ? `<p class="result-description">${escapeHtml(description)}</p>` : ''}
        </article>
      `;
    }).join('');

    searchResults.innerHTML = resultsHtml;
  }

  // Format date
  function formatDate(dateString) {
    const date = new Date(dateString);
    const months = [
      'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
      'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
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
      currentQuery = e.target.value.trim();

      // Show/hide clear button
      if (currentQuery) {
        searchClear.style.display = 'block';
      } else {
        searchClear.style.display = 'none';
      }

      updateDisplay();
    }, 300);

    searchInput.addEventListener('input', debouncedSearch);

    // Focus on search input when page loads
    searchInput.focus();
  }

  // Clear button
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      currentQuery = '';
      searchClear.style.display = 'none';
      searchInput.focus();
      updateDisplay();
    });
  }

  // "All" button handler
  if (categoryButtons) {
    const allButton = categoryButtons.querySelector('[data-category="all"]');
    if (allButton) {
      allButton.addEventListener('click', () => handleCategoryClick('all', allButton));
    }
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
