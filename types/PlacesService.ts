export interface PlaceResult {
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