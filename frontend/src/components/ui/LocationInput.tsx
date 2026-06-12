import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Navigation, MapPin } from "lucide-react";

// ── Geoapify API Key ──────────────────────────────────────────
// Set VITE_GEOAPIFY_KEY in .env to override the default key

const GEOAPIFY_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEOAPIFY_KEY) ||
  "36d6fdc74d3d4b91850890455bf7fe27";

// ── Types ─────────────────────────────────────────────────────

interface GeoapifyFeature {
  properties: {
    formatted: string;
    city: string;
    state: string;
    country: string;
    address_line1: string;
    address_line2: string;
  };
}

interface LocationInputProps {
  /** Current address value */
  address: string;
  /** Called when the user types or selects an address suggestion */
  onAddressChange: (value: string) => void;
  /** Current city value */
  city: string;
  /** Called when the user types or selects a city suggestion */
  onCityChange: (value: string) => void;
  /** Optional: automatically fill city when selecting an address (default: true) */
  autoFillCity?: boolean;
  /** Optional: add placeholder text for address field */
  addressPlaceholder?: string;
  /** Optional: add placeholder text for city field */
  cityPlaceholder?: string;
  /** Optional: custom label for address field */
  addressLabel?: string;
  /** Optional: custom label for city field */
  cityLabel?: string;
}

// ── Hook: Geoapify Search with AbortController ────────────────

function useGeoapifySearch() {
  const controllerRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (query: string, type?: string): Promise<GeoapifyFeature[]> => {
      if (query.length < (type === "city" ? 2 : 3)) return [];

      // Cancel any in-flight request before starting a new one
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      const controller = new AbortController();
      controllerRef.current = controller;

      const params = new URLSearchParams({
        text: query,
        limit: "5",
        apiKey: GEOAPIFY_KEY,
      });
      if (type) params.set("type", type);

      try {
        const res = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        return data.features || [];
      } catch (err) {
        // AbortError is expected when cancelling — swallow silently
        if (err instanceof DOMException && err.name === "AbortError") {
          return [];
        }
        return [];
      }
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  return { search };
}

// ── Autocomplete Dropdown ─────────────────────────────────────

function AutocompleteDropdown({
  suggestions,
  onSelect,
  formatLabel,
}: {
  suggestions: GeoapifyFeature[];
  onSelect: (feature: GeoapifyFeature) => void;
  formatLabel: (feature: GeoapifyFeature) => string;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
      {suggestions.map((feature, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect(feature)}
          className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0"
        >
          <div className="flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-gray-700">{formatLabel(feature)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Location Input Component ──────────────────────────────────

export function LocationInput({
  address,
  onAddressChange,
  city,
  onCityChange,
  autoFillCity = true,
  addressPlaceholder = "Start typing for auto-complete...",
  cityPlaceholder = "Start typing for suggestions...",
  addressLabel = "Address",
  cityLabel = "City",
}: LocationInputProps) {
  const { search } = useGeoapifySearch();

  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<GeoapifyFeature[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const addressRef = useRef<HTMLDivElement>(null);
  const addressTimer = useRef<ReturnType<typeof setTimeout>>();

  // City autocomplete state
  const [citySuggestions, setCitySuggestions] = useState<GeoapifyFeature[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);
  const cityTimer = useRef<ReturnType<typeof setTimeout>>();

  // Track latest city value in a ref for auto-fill to avoid stale closures
  const cityRefValue = useRef(city);
  cityRefValue.current = city;

  // ── Close dropdowns on click outside ─────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addressRef.current && !addressRef.current.contains(e.target as Node)) {
        setShowAddressDropdown(false);
      }
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCityDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Cleanup timers on unmount ────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(addressTimer.current);
      clearTimeout(cityTimer.current);
    };
  }, []);

  // ── Address Handlers ─────────────────────────────────────
  const handleAddressInput = (value: string) => {
    onAddressChange(value);
    clearTimeout(addressTimer.current);
    addressTimer.current = setTimeout(async () => {
      const results = await search(value);
      setAddressSuggestions(results);
      setShowAddressDropdown(results.length > 0);
    }, 400);
  };

  const handleSelectAddress = (feature: GeoapifyFeature) => {
    const props = feature.properties;
    onAddressChange(props.formatted);
    // Use ref to get the latest city value (avoids stale closure)
    if (autoFillCity && props.city && !cityRefValue.current) {
      onCityChange(props.city);
    }
    setShowAddressDropdown(false);
  };

  // ── City Handlers ────────────────────────────────────────
  const handleCityInput = (value: string) => {
    onCityChange(value);
    clearTimeout(cityTimer.current);
    cityTimer.current = setTimeout(async () => {
      const results = await search(value, "city");
      setCitySuggestions(results);
      setShowCityDropdown(results.length > 0);
    }, 400);
  };

  const handleSelectCity = (feature: GeoapifyFeature) => {
    onCityChange(feature.properties.city || feature.properties.formatted);
    setShowCityDropdown(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Address Field */}
      <div ref={addressRef} className="relative">
        <Input
          label={addressLabel}
          value={address}
          onChange={(e) => handleAddressInput(e.target.value)}
          placeholder={addressPlaceholder}
          icon={<MapPin className="w-4 h-4 text-gray-400" />}
        />
        <AutocompleteDropdown
          suggestions={showAddressDropdown ? addressSuggestions : []}
          onSelect={handleSelectAddress}
          formatLabel={(f) => f.properties.formatted}
        />
      </div>

      {/* City Field */}
      <div ref={cityRef} className="relative">
        <Input
          label={cityLabel}
          value={city}
          onChange={(e) => handleCityInput(e.target.value)}
          placeholder={cityPlaceholder}
          icon={<MapPin className="w-4 h-4 text-gray-400" />}
        />
        <AutocompleteDropdown
          suggestions={showCityDropdown ? citySuggestions : []}
          onSelect={handleSelectCity}
          formatLabel={(f) => f.properties.city || f.properties.formatted}
        />
      </div>
    </div>
  );
}
