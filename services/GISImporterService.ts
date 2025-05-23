import { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
var buildings_outlines: FeatureCollection<Geometry, GeoJsonProperties>;
var buildings_markers: FeatureCollection<Geometry, GeoJsonProperties>;
var buildings: { [id: string]: Building} = {};

export class Building {
  id: string;
  floors: {[id: string]: Floor} = {};
  constructor(id: string) {
    this.id = id;
  }
}

export class Floor {
  id: string;
  plan: FeatureCollection<Geometry, GeoJsonProperties>;
  roomPOIs: FeatureCollection<Geometry, GeoJsonProperties>;

  constructor(
    id: string,
    plan:FeatureCollection<Geometry, GeoJsonProperties>, 
    roomPOIs:FeatureCollection<Geometry, GeoJsonProperties>, 
  )
  {
    this.id = id;
    this.plan = plan;
    this.roomPOIs = roomPOIs;
  }
}

export const getBuildingOutlines = (): FeatureCollection<Geometry, GeoJsonProperties> =>
{
  return buildings_outlines;
}

export const getBuildingMarkers = (): FeatureCollection<Geometry, GeoJsonProperties> =>
{
  return buildings_markers;
}

export const getBuilding = (id: string): Building =>
{
  return buildings[id];
}

function _fullImport()
{
  _importBuildingOutlines();
  _importBuildings();
}

function _importBuildingOutlines() {
  buildings_outlines = require("@/gis/building-outlines.json") as FeatureCollection<Geometry, GeoJsonProperties>;
  buildings_markers = require("@/gis/building-markers.json") as FeatureCollection<Geometry, GeoJsonProperties>;
}

function _importBuildings()
{
  let H_building = new Building("H");
  {
    {
      let H1_floorPlan = require("@/gis/hall-1-floor-plan.json") as FeatureCollection<Geometry, GeoJsonProperties>;
      let H1_pois = require("@/gis/hall-1-rooms-pois.json") as FeatureCollection<Geometry, GeoJsonProperties>;
      let floorH1 = new Floor("H1", H1_floorPlan, H1_pois);
      H_building.floors["H1"] = floorH1;
    }
    {
      let H2_floorPlan = require("@/gis/hall-2-floor-plan.json") as FeatureCollection<Geometry, GeoJsonProperties>;
      let H2_pois = require("@/gis/hall-2-rooms-pois.json") as FeatureCollection<Geometry, GeoJsonProperties>;
      let floorH2 = new Floor("H2", H2_floorPlan, H2_pois);
      H_building.floors["H2"] = floorH2;
    }
    {
      let H8_floorPlan = require("@/gis/hall-8-floor-plan.json") as FeatureCollection<Geometry, GeoJsonProperties>;
      let H8_pois = require("@/gis/hall-8-rooms-pois.json") as FeatureCollection<Geometry, GeoJsonProperties>;
      let floorH8 = new Floor("H8", H8_floorPlan, H8_pois);
      H_building.floors["H8"] = floorH8;
    }
    {
      let H9_floorPlan = require("@/gis/hall-9-floor-plan.json") as FeatureCollection<Geometry, GeoJsonProperties>;
      let H9_pois = require("@/gis/hall-9-rooms-pois.json") as FeatureCollection<Geometry, GeoJsonProperties>;
      let floorH9 = new Floor("H9", H9_floorPlan, H9_pois);
      H_building.floors["H9"] = floorH9;
    }
  }
  buildings["H"] = H_building;

  let MB_building = new Building("MB");
  {
    {
      let MB1_floorPlan = require("@/gis/mb-1-floor-plan.json") as FeatureCollection<Geometry, GeoJsonProperties>;
      let MB1_pois = require("@/gis/mb-1-rooms-pois.json") as FeatureCollection<Geometry, GeoJsonProperties>;
      let floorMB1 = new Floor("MB1", MB1_floorPlan, MB1_pois);
      MB_building.floors["MB1"] = floorMB1;
    }
    {
      let MB2_floorPlan = require("@/gis/mb-2-floor-plan.json") as FeatureCollection<Geometry, GeoJsonProperties>;
      let MB2_pois = require("@/gis/mb-2-rooms-pois.json") as FeatureCollection<Geometry, GeoJsonProperties>;
      let floorMB2 = new Floor("MB2", MB2_floorPlan, MB2_pois);
      MB_building.floors["MB2"] = floorMB2;
    }
  }
  buildings["MB"] = MB_building;

}

_fullImport();