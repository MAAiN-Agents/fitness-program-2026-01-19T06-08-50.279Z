import React, { useEffect, useMemo, useState } from "react";
import { Stack, Text, Button, Card, Inline, Select, Spinner } from "@sanity/ui";
import { PatchEvent, set, setIfMissing, insert, unset, useClient, useFormValue } from "sanity";

type PlaceResult = {
  placeId: string | null;
  name?: string | null;
  address?: string | null;
  rating?: number | null;
  types?: string[] | null;
  mapsUrl?: string | null;
  location?: { lat: number | null; lng: number | null } | null;
};

type NearbyPlaceDoc = {
  _id: string;
  place?: {
    placeId?: string | null;
    name?: string | null;
    address?: string | null;
    city?: string | null;
    lat?: number | null;
    lng?: number | null;
    mapsUrl?: string | null;
    googleRating?: number | null;
  } | null;
  categories?: string[] | null;
};

const getKey = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `key-${Math.random().toString(36).slice(2, 10)}`;
};

const DEFAULT_NEARBY_URL =
  "http://127.0.0.1:5001/nomadic-fitness/us-central1/api/placesNearby";
const getNearbyUrl = () => process.env?.GOOGLE_PLACES_NEARBY_URL || DEFAULT_NEARBY_URL;

const PLACE_TYPE_OPTIONS = [
  { value: "gym", label: "Gym" },
  { value: "restaurant", label: "Restaurant" },
  { value: "parking", label: "Parking" },
  { value: "gas_station", label: "Gas station" },
  { value: "campground", label: "Campground" },
  { value: "electric_vehicle_charging_station", label: "EV charging station" },
];

export default function NearbyPlacesInput(props: any) {
  const { value, onChange } = props;
  const client = useClient({ apiVersion: "2024-01-01" });
  const place = useFormValue(["place"]) as any;
  const [placeType, setPlaceType] = useState("gym");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [linkedDocs, setLinkedDocs] = useState<NearbyPlaceDoc[]>([]);

  const placeLat = place?.lat;
  const placeLng = place?.lng;

  const refIds = useMemo(() => {
    if (!Array.isArray(value)) return [] as string[];
    return value
      .map((item: { _ref?: string }) => item?._ref)
      .filter((ref?: string): ref is string => Boolean(ref));
  }, [value]);

  useEffect(() => {
    let active = true;
    if (refIds.length === 0) {
      setLinkedDocs([]);
      return undefined;
    }
    client
      .fetch<NearbyPlaceDoc[]>(
        `*[_type == "nearbyPlace" && _id in $ids]{
          _id,
          categories,
          place{
            placeId,
            name,
            address,
            city,
            lat,
            lng,
            mapsUrl,
            googleRating
          }
        }`,
        { ids: refIds }
      )
      .then(docs => {
        if (!active) return;
        setLinkedDocs(Array.isArray(docs) ? docs : []);
      })
      .catch(() => {
        if (!active) return;
        setLinkedDocs([]);
      });
    return () => {
      active = false;
    };
  }, [client, refIds]);

  const fetchNearby = async () => {
    if (!placeLat || !placeLng) {
      setMessage("Select a gym place with coordinates first.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams({
        lat: String(placeLat),
        lng: String(placeLng),
      });
      if (placeType) {
        params.set("type", placeType);
      }
      const response = await fetch(`${getNearbyUrl()}?${params.toString()}`);
      const data = await response.json();
      const items = Array.isArray(data) ? data : [];
      setResults(items);
      if (items.length === 0) {
        setMessage("No nearby places found.");
      }
    } catch (error) {
      setMessage("Unable to load nearby places.");
    } finally {
      setLoading(false);
    }
  };

  const addNearbyPlace = async (placeResult: PlaceResult) => {
    if (!placeResult.placeId) {
      setMessage("Place ID is missing.");
      return;
    }
    if (linkedDocs.some(doc => doc.place?.placeId === placeResult.placeId)) {
      setMessage("That place is already linked.");
      return;
    }
    try {
      const existing = await client.fetch<{ _id: string; categories?: string[] | null } | null>(
        `*[_type == "nearbyPlace" && place.placeId == $placeId][0]{_id, categories}`,
        { placeId: placeResult.placeId }
      );
      let docId = existing?._id;
      if (!docId) {
        const created = await client.create({
          _type: "nearbyPlace",
          place: {
            _type: "googlePlace",
            placeId: placeResult.placeId,
            name: placeResult.name || null,
            address: placeResult.address || null,
            lat: placeResult.location?.lat ?? null,
            lng: placeResult.location?.lng ?? null,
            googleRating: placeResult.rating ?? null,
            mapsUrl: placeResult.mapsUrl ?? null,
            types: placeResult.types ?? null,
          },
          categories: placeType ? [placeType] : [],
        });
        docId = created._id;
      } else if (placeType) {
        const nextCategories = Array.isArray(existing?.categories) ? existing?.categories : [];
        if (!nextCategories.includes(placeType)) {
          await client
            .patch(docId)
            .setIfMissing({ categories: [] })
            .insert("after", "categories[-1]", [placeType])
            .commit();
        }
      }
      if (docId && onChange) {
        const ref = { _type: "reference", _ref: docId, _key: getKey() };
        onChange(PatchEvent.from([setIfMissing([]), insert([ref], "after", [-1])]));
      }
    } catch (error) {
      setMessage("Unable to add nearby place.");
    }
  };

  const removeNearbyPlace = (id: string) => {
    if (!onChange) return;
    const next = (Array.isArray(value) ? value : []).filter((item: any) => item?._ref !== id);
    if (next.length === 0) {
      onChange(PatchEvent.from([unset()]));
      return;
    }
    const refs = next.map((item: any) => ({
      _type: "reference",
      _ref: item._ref,
      _key: item._key || getKey(),
    }));
    onChange(PatchEvent.from([set(refs)]));
  };

  return (
    <Stack space={3}>
      <Card padding={3} radius={2} shadow={1} tone="transparent">
        <Stack space={2}>
          <Text weight="semibold">Nearby Places (linked)</Text>
          {linkedDocs.length === 0 ? (
            <Text size={1} muted>
              No nearby places linked yet.
            </Text>
          ) : (
            <Stack space={2}>
              {linkedDocs.map(doc => (
                <Card key={doc._id} padding={2} radius={2} shadow={1}>
                  <Stack space={1}>
                    <Text weight="semibold">{doc.place?.name || "Nearby place"}</Text>
                    {doc.place?.address && <Text size={1}>{doc.place.address}</Text>}
                    <Inline space={2}>
                      {doc.place?.mapsUrl && (
                        <Button
                          as="a"
                          href={doc.place.mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          text="Maps"
                          mode="ghost"
                        />
                      )}
                      <Button
                        text="Remove"
                        mode="ghost"
                        tone="critical"
                        onClick={() => removeNearbyPlace(doc._id)}
                      />
                    </Inline>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Card>

      <Card padding={3} radius={2} shadow={1} tone="transparent">
        <Stack space={2}>
          <Text weight="semibold">Find nearby places</Text>
          <Text size={1} muted>
            Uses the selected gym location coordinates to search nearby.
          </Text>
          <Select value={placeType} onChange={event => setPlaceType(event.currentTarget.value)}>
            {PLACE_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button text="Search nearby" onClick={fetchNearby} disabled={loading} />
          {loading && <Spinner muted />}
          {message && <Text size={1}>{message}</Text>}
          {results.length > 0 && (
            <Stack space={2}>
              {results.map(result => (
                <Card
                  key={result.placeId || result.name || Math.random().toString(36)}
                  padding={2}
                  radius={2}
                  shadow={1}
                >
                  <Stack space={1}>
                    <Text weight="semibold">{result.name || "Nearby place"}</Text>
                    {result.address && <Text size={1}>{result.address}</Text>}
                    <Inline space={2}>
                      <Button text="Add" mode="ghost" onClick={() => addNearbyPlace(result)} />
                    </Inline>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
