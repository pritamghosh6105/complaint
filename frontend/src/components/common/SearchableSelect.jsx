import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, Check, Clock } from 'lucide-react';

/**
 * Premium Searchable Combobox for CivicPulse AI
 * Supports:
 * - Live typing & fuzzy search
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Recent selections stored in localStorage
 * - Clear selection button
 * - Placeholder & disabled state
 */
export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  disabled = false,
  storageKey = null, // key to persist recent selections
  labelKey = 'name',
  valueKey = 'id',
  secondaryKey = null,
  emptyMessage = 'No matching options found'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentItems, setRecentItems] = useState([]);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Load recent selections from localStorage
  useEffect(() => {
    if (storageKey) {
      try {
        const stored = localStorage.getItem(`recent_sel_${storageKey}`);
        if (stored) {
          setRecentItems(JSON.parse(stored).slice(0, 3));
        }
      } catch (e) {
        // ignore storage errors
      }
    }
  }, [storageKey]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredOptions = options.filter(opt => {
    const label = String(opt[labelKey] || '').toLowerCase();
    const secondary = secondaryKey ? String(opt[secondaryKey] || '').toLowerCase() : '';
    const q = searchQuery.toLowerCase().trim();
    return label.includes(q) || secondary.includes(q);
  });

  // Currently selected item
  const selectedItem = options.find(opt => String(opt[valueKey]) === String(value));

  const handleSelect = (item) => {
    onChange(item ? item[valueKey] : '', item || null);
    setIsOpen(false);
    setSearchQuery('');

    // Save to recents
    if (storageKey && item) {
      try {
        const updated = [item, ...recentItems.filter(r => String(r[valueKey]) !== String(item[valueKey]))].slice(0, 3);
        setRecentItems(updated);
        localStorage.setItem(`recent_sel_${storageKey}`, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('', null);
    setSearchQuery('');
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div 
      ref={containerRef} 
      style={{ position: 'relative', width: '100%' }}
      onKeyDown={handleKeyDown}
    >
      {/* Combobox Trigger Box */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(prev => !prev);
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        style={{
          width: '100%',
          minHeight: '38px',
          padding: '6px 12px',
          background: disabled ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(10px)',
          border: isOpen ? '1px solid var(--accent-primary, #38bdf8)' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
          color: selectedItem ? 'var(--text-primary, #ffffff)' : 'var(--text-muted, #94a3b8)',
          fontSize: '0.86rem',
          transition: 'all 0.15s ease',
          boxShadow: isOpen ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none',
          userSelect: 'none'
        }}
      >
        <span style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          paddingRight: '6px'
        }}>
          {selectedItem ? (
            <span style={{ fontWeight: 500, color: '#f8fafc' }}>
              {selectedItem[labelKey]}
              {secondaryKey && selectedItem[secondaryKey] ? (
                <span style={{ fontSize: '0.76rem', color: '#94a3b8', marginLeft: '6px' }}>
                  ({selectedItem[secondaryKey]})
                </span>
              ) : null}
            </span>
          ) : (
            placeholder
          )}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {selectedItem && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '4px'
              }}
              title="Clear selection"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown 
            size={15} 
            color="#94a3b8" 
            style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease'
            }} 
          />
        </div>
      </div>

      {/* Dropdown Popup */}
      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#0d1527',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '10px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(56, 189, 248, 0.15)',
            overflow: 'hidden',
            maxHeight: '290px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Search Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 23, 42, 0.95)'
          }}>
            <Search size={14} color="#38bdf8" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder={searchPlaceholder}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '0.84rem',
                width: '100%'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
            {/* Recent Items section if no query */}
            {!searchQuery && recentItems.length > 0 && (
              <div style={{ padding: '4px 10px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ fontSize: '0.68rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <Clock size={10} /> Recent Selections
                </span>
                {recentItems.map((item, idx) => (
                  <div
                    key={`recent-${idx}`}
                    onClick={() => handleSelect(item)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: '#cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(56, 189, 248, 0.06)',
                      marginBottom: '2px'
                    }}
                  >
                    <span>{item[labelKey]}</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Recent</span>
                  </div>
                ))}
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div style={{ padding: '16px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = String(opt[valueKey]) === String(value);
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={String(opt[valueKey])}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    style={{
                      padding: '7px 12px',
                      cursor: 'pointer',
                      fontSize: '0.83rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isHighlighted
                        ? 'rgba(56, 189, 248, 0.15)'
                        : isSelected
                        ? 'rgba(56, 189, 248, 0.08)'
                        : 'transparent',
                      color: isSelected ? '#38bdf8' : '#f1f5f9',
                      transition: 'background 0.1s ease'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: isSelected ? 600 : 400 }}>
                        {opt[labelKey]}
                      </span>
                      {secondaryKey && opt[secondaryKey] && (
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {opt[secondaryKey]}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check size={14} color="#38bdf8" style={{ flexShrink: 0, marginLeft: '6px' }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
