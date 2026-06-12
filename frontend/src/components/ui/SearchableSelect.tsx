import { useState, useRef, useEffect, useCallback } from "react";
import { Search, ChevronDown, X } from "lucide-react";

interface Option {
  id: string;
  label: string;
  value?: string | null;
}

interface SearchableSelectProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  required?: boolean;
}

export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  emptyMessage = "No options found",
  loading = false,
  required = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value || o.label === value);

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const el = listRef.current.children[highlightedIndex] as HTMLElement;
      if (el) {
        el.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = useCallback((option: Option) => {
    onChange(option.value || option.label);
    setIsOpen(false);
    setSearch("");
    setHighlightedIndex(-1);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === " " || e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        setIsOpen(false);
        setSearch("");
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case "Tab":
        setIsOpen(false);
        setSearch("");
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger / Input */}
      <div
        className={`relative flex items-center w-full rounded-lg border transition-colors cursor-text ${
          isOpen
            ? "border-primary-500 ring-2 ring-primary-500/20"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        {isOpen ? (
          <>
            <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedOption ? selectedOption.label : placeholder}
              className="w-full pl-10 pr-8 py-2 text-sm bg-transparent border-none outline-none rounded-lg"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearch("");
                  inputRef.current?.focus();
                }}
                className="absolute right-8 p-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        ) : (
          <>
            <span className={`flex-1 px-3 py-2 text-sm ${selectedOption ? "text-gray-900" : "text-gray-400"}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown className="absolute right-3 w-4 h-4 text-gray-400 pointer-events-none" />
          </>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-sm text-gray-400">
              <span className="animate-pulse">Loading options...</span>
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="px-3 py-6 text-sm text-gray-400 text-center">
              {emptyMessage}
            </div>
          ) : (
            <div ref={listRef} className="max-h-52 overflow-y-auto">
              {filteredOptions.map((option, index) => {
                const isSelected = (option.value || option.label) === value;
                const isHighlighted = index === highlightedIndex;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : isHighlighted
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <svg className="w-4 h-4 text-primary-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className={isSelected ? "" : "ml-6"}>{option.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
