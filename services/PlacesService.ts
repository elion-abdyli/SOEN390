import { PlacesAPIError } from "@/errors/PlacesAPIError";
import { FeatureCollection, Feature, Point, Geometry, GeoJsonProperties } from "geojson";

interface PlaceResult {
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
  latitude?: number;
  longitude?: number;
  name?: string;
  formatted_address?: string;
  vicinity?: string;
  place_id?: string;
  types?: string[];
  rating?: number;
  price_level?: number;
  status?: string;
}

const MIN_RADIUS = 500;
const MAX_RADIUS = 10000;
const GENERIC_POI_TYPES = ['coffee', 'cafe', 'restaurant', 'food', 'shop', 'store', 'bar'];
const DEFAULT_POI_TYPE = 'restaurant';

const buildSearchUrl = (
  searchText: string,
  location: string,
  radius: number,
  apiKey: string
): string => {
  const encodedSearchText = encodeURIComponent(searchText);
  const isGenericPoiSearch = GENERIC_POI_TYPES.some(type => searchText.toLowerCase().includes(type));

  if (isGenericPoiSearch) {
    const poiType = GENERIC_POI_TYPES.find(type => searchText.toLowerCase().includes(type)) === 'coffee'
      ? 'cafe'
      : GENERIC_POI_TYPES.find(type => searchText.toLowerCase().includes(type)) || DEFAULT_POI_TYPE;
    return `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${poiType}&key=${apiKey}`;
  } else {
    return `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedSearchText}&location=${location}&radius=${radius}&type=point_of_interest&key=${apiKey}`;
  }
};

const validateApiResponse = (json: any): void => {
  if (json == null || json.results == null || !Array.isArray(json.results)) {
    throw new PlacesAPIError("Invalid API response structure");
  }
};

const handleZeroResults = (
  json: any
): FeatureCollection<Geometry, GeoJsonProperties> | null => {
  if ((json?.results ?? []).length === 0 || (json?.status ?? "") === "ZERO_RESULTS") {
    return { type: "FeatureCollection", features: [] };
  }
  return null;
};

const extractCoordinates = (item: PlaceResult): { lat: number | undefined; lng: number | undefined } => {
  if (item?.geometry?.location) {
    return { lat: item.geometry.location.lat, lng: item.geometry.location.lng };
  } else if (item.latitude && item.longitude) {
    return { lat: item.latitude, lng: item.longitude };
  } else {
    console.error("Invalid location data in place result:", item);
    return { lat: undefined, lng: undefined };
  }
};

const mapPlaceToFeature = (item: PlaceResult): Feature | null => {
  const { lat, lng } = extractCoordinates(item);
  if (lat === undefined || lng === undefined) {
    return null;
  }

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lng, lat],
    } as Point,
    properties: {
      name: item.name,
      formatted_address: item.formatted_address ?? item.vicinity ?? "No address available",
      place_id: item.place_id,
      types: item.types ?? [],
      rating: item.rating ?? 0,
      price_level: item.price_level ?? 0,
      coordinate: { latitude: lat, longitude: lng },
      Address: item.formatted_address ?? item.vicinity ?? "No address available",
      Building_Long_Name: item.name
    },
  };
};

export const searchPlaces = async (
  searchText: string,
  initialLat: number,
  initialLng: number,
  apiKey: string,
  radius: number = 1000
): Promise<FeatureCollection> => {
  if (!searchText.trim()) {
    return { type: "FeatureCollection", features: [] };
  }

  const effectiveRadius = Math.max(radius, MIN_RADIUS);
  const finalRadius = Math.min(effectiveRadius, MAX_RADIUS);
  const location = `${initialLat},${initialLng}`;
  const url = buildSearchUrl(searchText, location, finalRadius, apiKey);
  const controller = new AbortController();
  const signal = controller.signal;

  try {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new PlacesAPIError(
        `Failed to fetch places - HTTP ${response.status}`,
        response.status
      );
    }

    const json = await response.json();
    validateApiResponse(json);

    const zeroResults = handleZeroResults(json);
    if (zeroResults) {
      return zeroResults;
    }

    const features = (json.results as PlaceResult[])
      .map(mapPlaceToFeature)
      .filter((feature: Feature | null) => feature !== null) as Feature[];

    return { type: "FeatureCollection", features };
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return { type: "FeatureCollection", features: [] };
      }
      if (error instanceof PlacesAPIError) {
        throw error;
      }
    }
    throw new PlacesAPIError("Failed to fetch places");
  } finally {
    controller.abort();
  }
};