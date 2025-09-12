import { useEffect, useRef, useState } from 'react';
import { FiSearch, FiX, FiUser, FiMapPin, FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useFilters } from '../../../../contexts/FilterContext';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { useDebounce } from '../../../../hooks/useDebounce';
import { useSearchMPs } from '../../../../hooks/useApi';
import { sanitizeInput, sanitizeForSubmission } from '../../../../utils/inputSanitization';
import './SearchBar.css';
import { buildMPSlugHuman, normalizeMPSlug } from '../../../../utils/slug';

// A lean and robust search bar built from scratch.
// - No suggestions dropdown
// - Syncs with global filters
// - Submits on Enter or on clicking the search button
// - Simple, accessible markup
const SearchBar = ({ placeholder = 'Search MPs, constituencies, or projects...' }) => {
  const navigate = useNavigate();
  const { filters, updateFilter } = useFilters();
  const { trackSearch, trackEngagement } = useAnalytics();
  const inputRef = useRef(null);
  const [query, setQuery] = useState(filters.searchQuery || '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debounced = useDebounce(query, 250);
  const { data, isLoading } = useSearchMPs(debounced);
  const suggestions = Array.isArray(data?.data?.mps) ? data.data.mps : (data?.data || []);

  // Keep local state in sync if filters change elsewhere
  useEffect(() => {
    if (filters.searchQuery !== query) {
      setQuery(filters.searchQuery || '');
    }
  }, [filters.searchQuery, query]);

  const handleChange = (e) => {
    const value = sanitizeInput(e.target.value);
    setQuery(value);
    updateFilter('searchQuery', value);
    setOpen(value.length > 0);
    setActiveIndex(-1);
  };

  const handleClear = () => {
    setQuery('');
    updateFilter('searchQuery', '');
    inputRef.current?.focus();
  };

  const normalize = (str) =>
    (str || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

  const tryNavigateDirectToMP = (value) => {
    const norm = normalize(value);
    if (!norm || suggestions.length === 0) return false;

    const match = suggestions.find((s) => {
      const constituency = normalize(s?.constituency);
      const state = normalize(s?.state);
      const combos = [
        constituency,
        `${constituency}, ${state}`.trim(),
        `${constituency} ${state}`.trim(),
      ].filter(Boolean);
      return combos.includes(norm);
    });

    const id = match?._id || match?.id;
    if (id) {
      const slug = normalizeMPSlug(buildMPSlugHuman(match, { lsTerm: filters?.lsTerm }) || String(id));
      navigate(`/mplads/mps/${encodeURIComponent(slug)}`);
      return true;
    }
    return false;
  };

  const submit = () => {
    const value = sanitizeForSubmission(query); // Trim only when submitting
    if (value.length === 0) return;
    
    // Track the search event
    trackSearch(value, suggestions.length, 'search_submit');
    
    // If user typed a constituency name, jump straight to the MP page
    if (tryNavigateDirectToMP(value)) {
      trackEngagement('mp_profile', 'direct_search', 'direct_navigation');
      setOpen(false);
      return;
    }
    // Otherwise go to the full search results page
    navigate(`/mplads/search?q=${encodeURIComponent(value)}`);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length === 0) return;
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        const s = suggestions[activeIndex];
        const id = s?._id || s?.id;
        if (id) {
          const slug = normalizeMPSlug(buildMPSlugHuman(s, { lsTerm: filters?.lsTerm }) || String(id));
          navigate(`/mplads/mps/${encodeURIComponent(slug)}`);
          setOpen(false);
          return;
        }
      }
      submit();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="ni-search__wrap">
      <form
        className="ni-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
      <span className="ni-search__icon" aria-hidden="true">
        <FiSearch />
      </span>
      <input
        ref={inputRef}
        type="text"
        className="ni-search__input"
        placeholder={placeholder}
        aria-label="Search"
        autoComplete="off"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        maxLength={100}
        onFocus={() => setOpen(query.length > 0)}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="search-suggestion-list"
      />
      {query && (
        <button
          type="button"
          className="ni-search__clear"
          aria-label="Clear search"
          onClick={handleClear}
        >
          <FiX />
        </button>
      )}
      <button type="submit" className="ni-search__submit" aria-label="Search">
        <FiSearch />
      </button>
      </form>

      {open && query && (
        <div id="search-suggestion-list" className="ni-search__dropdown" role="listbox">
          {isLoading ? (
            <div className="ni-suggestion ni-suggestion--loading">Searching…</div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((s, idx) => (
                <div
                  key={`${s._id || s.id || idx}`}
                  role="option"
                  aria-selected={idx === activeIndex}
                  className={`ni-suggestion ${idx === activeIndex ? 'is-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    const id = s?._id || s?.id;
                    if (id) {
                      trackEngagement('mp_profile', id, 'suggestion_click');
                      const slug = normalizeMPSlug(buildMPSlugHuman(s, { lsTerm: filters?.lsTerm }) || String(id));
                      navigate(`/mplads/mps/${encodeURIComponent(slug)}`);
                      setOpen(false);
                    }
                  }}
                >
                  <span className="ni-suggestion__icon" aria-hidden="true">
                    {/* Basic type-based icon support; fallback to user */}
                    {s?.type === 'constituency' ? <FiMapPin /> : s?.type === 'project' ? <FiFileText /> : <FiUser />}
                  </span>
                  <span className="ni-suggestion__body">
                    <span className="ni-suggestion__title">{s?.name || s?.mpName || 'Unnamed'}</span>
                    {s?.constituency && (
                      <span className="ni-suggestion__meta">{s.constituency}{s?.state ? `, ${s.state}` : ''}</span>
                    )}
                  </span>
                  <span className="ni-suggestion__type">{s?.type || 'mp'}</span>
                </div>
              ))}
              <div
                className="ni-suggestion ni-suggestion--viewall"
                onClick={() => {
                  submit();
                }}
              >
                <FiSearch />
                <span>View all results for "{query}"</span>
              </div>
            </>
          ) : (
            <div className="ni-suggestion ni-suggestion--empty">No results</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
