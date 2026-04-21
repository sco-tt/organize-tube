import { useState, useEffect, useRef, useCallback } from 'react';
import { TagsService } from '../../services/tagsService';
import './TagAutocomplete.css';

interface TagAutocompleteProps {
  value: string;
  placeholder?: string;
  currentTags: string[];
  onValueChange: (value: string) => void;
  onTagAdd: (tag: string) => void;
  className?: string;
  disabled?: boolean;
}

export function TagAutocomplete({
  value,
  placeholder = "Add tag...",
  currentTags,
  onValueChange,
  onTagAdd,
  className = '',
  disabled = false
}: TagAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const tagsService = TagsService.getInstance();

  // Fetch suggestions when input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value.trim() || value.length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await tagsService.getTagSuggestions(value, currentTags);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Failed to fetch tag suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(debounceTimer);
  }, [value, currentTags]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(e.target.value);
  }, [onValueChange]);

  const handleSuggestionClick = useCallback((tag: string) => {
    onTagAdd(tag);
    onValueChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, [onTagAdd, onValueChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (value.trim()) {
          onTagAdd(value.trim());
          onValueChange('');
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (value.trim()) {
          onTagAdd(value.trim());
          onValueChange('');
          setSuggestions([]);
          setShowSuggestions(false);
        }
        break;

      case 'Escape':
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;

      case 'Tab':
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, value, onTagAdd, onValueChange, handleSuggestionClick]);

  const handleInputBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 150);
  }, []);

  const handleInputFocus = useCallback(() => {
    if (suggestions.length > 0 && value.trim()) {
      setShowSuggestions(true);
    }
  }, [suggestions.length, value]);

  return (
    <div className={`tag-autocomplete ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        disabled={disabled}
        className="tag-autocomplete-input"
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
      />

      {showSuggestions && (
        <div ref={suggestionsRef} className="tag-suggestions">
          {isLoading ? (
            <div className="suggestion-item loading">
              <span>Loading suggestions...</span>
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="suggestion-text">{suggestion}</span>
                <span className="suggestion-hint">↵</span>
              </div>
            ))
          )}
          {!isLoading && suggestions.length === 0 && value.trim() && (
            <div className="suggestion-item no-suggestions">
              <span>No matching tags. Press Enter to create "{value.trim()}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}