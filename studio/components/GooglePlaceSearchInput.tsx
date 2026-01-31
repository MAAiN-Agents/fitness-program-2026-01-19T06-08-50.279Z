import React, { useState } from "react";
import { Stack, TextInput, Button, Card, Text, Inline, Spinner, Flex, Select } from "@sanity/ui";
import { set, unset } from "sanity";

type PlaceResult = {
  placeId: string;
  name: string | null;
  secondaryText?: string | null;
  address?: string | null;
  rating?: number | null;
  types?: string[] | null;
  location?: { lat: number; lng: number } | null;
};

type PlaceDetails = {
  placeId: string;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  mapsUrl?: string | null;
  googleRating?: number | null;
  openingHoursWeekdayDescriptions?: string[] | null;
  openingHoursNextOpenTime?: string | null;
  openingHoursNextCloseTime?: string | null;
  types?: string[] | null;
};

const DEFAULT_AUTOCOMPLETE_URL =
  "http://127.0.0.1:5001/nomadic-fitness/us-central1/api/placesAutocomplete";
const DEFAULT_DETAILS_URL =
  "http://127.0.0.1:5001/nomadic-fitness/us-central1/api/placeDetails";
const DEFAULT_NEARBY_URL =
  "http://127.0.0.1:5001/nomadic-fitness/us-central1/api/placesNearby";

const getAutocompleteUrl = () => process.env?.GOOGLE_PLACES_AUTOCOMPLETE_URL || DEFAULT_AUTOCOMPLETE_URL;
const getDetailsUrl = () => process.env?.GOOGLE_PLACE_DETAILS_URL || DEFAULT_DETAILS_URL;
const getNearbyUrl = () => process.env?.GOOGLE_PLACES_NEARBY_URL || DEFAULT_NEARBY_URL;

export default function GooglePlaceSearchInput(props: any) {
  const { value, onChange } = props;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [placeType, setPlaceType] = useState("gym");
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceResult[]>([]);
  const [nearbyMessage, setNearbyMessage] = useState<string | null>(null);

  const search = async (nextQuery: string) => {
    if (!nextQuery.trim()) {
      setMessage("Enter a search term.");
      setResults([]);
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams({ q: nextQuery.trim() });
      if (placeType) {
        params.set("type", placeType);
      }
      const response = await fetch(`${getAutocompleteUrl()}?${params.toString()}`);
      const data = await response.json();
      const items = Array.isArray(data) ? data : [];
      setResults(items);
      if (items.length === 0) {
        setMessage("No places found.");
      }
    } catch (error) {
      setMessage("Unable to search Google Places.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setMessage(null);
      return;
    }
    const handle = setTimeout(() => {
      search(query);
    }, 350);
    return () => clearTimeout(handle);
  }, [query, placeType]);

  const selectPlace = async (place: PlaceResult) => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${getDetailsUrl()}?placeId=${encodeURIComponent(place.placeId)}`);
      const data = (await response.json()) as PlaceDetails | null;
      const nextValue: PlaceDetails = {
        placeId: data?.placeId || place.placeId,
        name: data?.name || place.name,
        address: data?.address || place.address || null,
        city: data?.city || null,
        lat: data?.lat ?? place.location?.lat ?? null,
        lng: data?.lng ?? place.location?.lng ?? null,
        mapsUrl: data?.mapsUrl || null,
        googleRating: data?.googleRating ?? place.rating ?? null,
        openingHoursWeekdayDescriptions: data?.openingHoursWeekdayDescriptions || null,
        openingHoursNextOpenTime: data?.openingHoursNextOpenTime ?? null,
        openingHoursNextCloseTime: data?.openingHoursNextCloseTime ?? null,
        types: data?.types || place.types || null,
      };
      onChange(set({ _type: "googlePlace", ...nextValue }));
      setResults([]);
      setQuery("");
    } catch (error) {
      setMessage("Unable to load place details.");
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    onChange(unset());
  };

  const fetchNearby = async () => {
    if (!value?.lat || !value?.lng) {
      setNearbyMessage("Missing coordinates for this place.");
      return;
    }
    setNearbyLoading(true);
    setNearbyMessage(null);
    try {
      const params = new URLSearchParams({
        lat: String(value.lat),
        lng: String(value.lng),
        radius: "3000",
      });
      if (placeType) {
        params.set("type", placeType);
      }
      const response = await fetch(`${getNearbyUrl()}?${params.toString()}`);
      const data = await response.json();
      const items = Array.isArray(data) ? data : [];
      setNearbyPlaces(items);
      if (items.length === 0) {
        setNearbyMessage("No nearby places found.");
      }
    } catch (error) {
      setNearbyMessage("Unable to load nearby places.");
    } finally {
      setNearbyLoading(false);
    }
  };

  return (
    <Stack space={3}>
      <TextInput
        placeholder="Search for a gym or location"
        value={query}
        onChange={event => setQuery(event.currentTarget.value)}
      />
      <Inline space={2}>
        <Button
          text={filtersOpen ? "Hide Filters" : "Filters"}
          mode="ghost"
          onClick={() => setFiltersOpen(open => !open)}
        />
        <Button text="Search" onClick={() => search(query)} disabled={loading} />
        {loading && <Spinner muted />}
        {value?.name && (
          <Button text="Clear" mode="ghost" onClick={clearSelection} />
        )}
      </Inline>
      {filtersOpen && (
        <Card padding={3} radius={2} shadow={1}>
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Place type filter
            </Text>
            <Select value={placeType} onChange={event => setPlaceType(event.currentTarget.value)}>
              <option value="gym">Gym</option>
              <option value="restaurant">Restaurant</option>
              <option value="parking">Parking</option>
              <option value="gas_station">Gas station</option>
              <option value="campground">Campground</option>
              <option value="electric_vehicle_charging_station">EV charging station</option>
            </Select>
            <Text size={1} muted>
              This filter biases autocomplete results to the selected place type.
            </Text>
          </Stack>
        </Card>
      )}
      {message && <Text size={1}>{message}</Text>}
      {value?.name && (
        <Card padding={3} radius={2} shadow={1} tone="positive">
          <Stack space={2}>
            <Text weight="semibold">Selected location</Text>
            <Text>{value.name}</Text>
            {value.city && <Text size={1}>{value.city}</Text>}
            {value.address && <Text size={1}>{value.address}</Text>}
            {(typeof value.lat === "number" || typeof value.lng === "number" || value.address) && (
              <div
                style={{
                  borderRadius: 6,
                  overflow: "hidden",
                  border: "1px solid #e4e7eb",
                }}
              >
                <iframe
                  title="Selected location map"
                  src={
                    typeof value.lat === "number" && typeof value.lng === "number"
                      ? `https://www.google.com/maps?q=${value.lat},${value.lng}&z=15&output=embed`
                      : `https://www.google.com/maps?q=${encodeURIComponent(value.address || value.name || "")}&output=embed`
                  }
                  width="100%"
                  height={180}
                  loading="lazy"
                  style={{ border: 0, display: "block" }}
                />
              </div>
            )}
          </Stack>
        </Card>
      )}
      {results.map(place => (
        <Card
          key={place.placeId}
          padding={3}
          shadow={1}
          radius={2}
          style={{ cursor: "pointer" }}
          onClick={() => selectPlace(place)}
        >
          <Stack space={2}>
            <Flex align="center" justify="space-between">
            <Text weight="semibold">{place.name || "Untitled place"}</Text>
          </Flex>
            {(place.secondaryText || place.address) && (
              <Text size={1}>{place.secondaryText || place.address}</Text>
            )}
            {Array.isArray(place.types) && place.types.length > 0 && (
              <Text size={1}>{place.types.slice(0, 4).join(", ")}</Text>
            )}
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
