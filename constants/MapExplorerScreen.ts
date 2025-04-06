import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

export const POI_MIN_ZOOM_LEVEL = 12; // Minimum zoom level to show POIs (zoomed in)
export const POI_MAX_ZOOM_LEVEL = 19; // Maximum zoom level for POIs (very zoomed in)
export const POI_RADIUS_MIN = 500; // Minimum radius in meters
export const POI_RADIUS_MAX = 5000; // Maximum radius in meters
export const POI_ZOOM_REFRESH_THRESHOLD = 1.5; // How much zoom needs to change before refreshing POIs
export const ZOOM_LEVEL_THRESHOLD = 19;
export const BUILDING_MARKERS_ZOOM_THRESHOLD = 18;

export const buildingMarkers = require("@/gis/building-markers.json") as FeatureCollection<Geometry, GeoJsonProperties>;
export const buildingOutlines = require("@/gis/building-outlines.json") as FeatureCollection<Geometry, GeoJsonProperties>;
export const hall9RoomsPois = require("@/gis/hall-9-rooms-pois.json") as FeatureCollection<Geometry, GeoJsonProperties>;
export const hall9FloorPlan = require("@/gis/hall-9-floor-plan.json") as FeatureCollection<Geometry, GeoJsonProperties>;
export const hall8RoomsPois = require("@/gis/hall-8-rooms-pois.json") as FeatureCollection<Geometry, GeoJsonProperties>;
export const hall8FloorPlan = require("@/gis/hall-8-floor-plan.json") as FeatureCollection<Geometry, GeoJsonProperties>;