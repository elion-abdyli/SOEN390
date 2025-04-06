import mb1Rooms from "../gis/mb-1-rooms-pois.json";
import mb2Rooms from "../gis/mb-2-rooms-pois.json";
import hall1Rooms from "../gis/hall-1-rooms-pois.json";
import hall2Rooms from "../gis/hall-2-rooms-pois.json";
import hall8Rooms from "../gis/hall-8-rooms-pois.json";
import hall9Rooms from "../gis/hall-9-rooms-pois.json";
import hall1Hallways from "../gis/hall-1-hallways.json";
import hall2Hallways from "../gis/hall-2-hallways.json";
import mb1Hallways from "../gis/mb-1-hallways.json";
import mb2Hallways from "../gis/mb-2-hallways.json";
import hall8Hallways from "../gis/hall-8-hallways.json";
import hall9Hallways from "../gis/hall-9-hallways.json";
import { FeatureCollection, Feature, MultiLineString } from 'geojson';
import { Room, Hallway, Graph, Distances, PreviousNodes, PathResult } from '../types/IndoorDirServiceTypes';
import { readFile } from 'fs/promises';
import { join } from 'path';

const reverseLookup: Record<string, any> = {
  "mb-1-rooms-pois.json": mb1Rooms,
  "mb-2-rooms-pois.json": mb2Rooms,
  "hall-1-rooms-pois.json": hall1Rooms,
  "hall-2-rooms-pois.json": hall2Rooms,
  "hall-8-rooms-pois.json": hall8Rooms,
  "hall-9-rooms-pois.json": hall9Rooms,
  "hall-1-hallways.json": hall1Hallways,
  "hall-2-hallways.json": hall2Hallways,
  "mb-1-hallways.json": mb1Hallways,
  "mb-2-hallways.json": mb2Hallways,
  "hall-8-hallways.json": hall8Hallways,
  "hall-9-hallways.json": hall9Hallways,
}



// FUNCTIONS TO EXTRACT DATA FROM GIS JSON FILES
export const extractRooms = (data: any): Room[] => {
    return data.features.map((feature: any) => ({
        code: feature.properties.Code,
        coordinates: feature.geometry.coordinates
    }));
};

export const extractHallways = (data: any, name: string): Hallway => ({
    name,
    hallways: data.features.map((feature: any) => feature.geometry.coordinates)
});

//"DATABASE" VARIABLES THAT HOLD HALLWAYS FOR EACH FLOOR AND ROOMS FOR EACH FLOOR
export const hallwaysList: Hallway[] = [
    extractHallways(hall1Hallways, "hall-1-hallways"),
    extractHallways(hall2Hallways, "hall-2-hallways"),
    extractHallways(hall8Hallways, "hall-8-hallways"),
    extractHallways(hall9Hallways, "hall-9-hallways"),
    extractHallways(mb1Hallways, "mb-1-hallways"),
    extractHallways(mb2Hallways, "mb-2-hallways")
];

export const roomList: Room[] = [...extractRooms(hall1Rooms),...extractRooms(hall2Rooms),...extractRooms(hall8Rooms), ...extractRooms(hall9Rooms),...extractRooms(mb1Rooms),...extractRooms(mb2Rooms)];


//FUNCTION TO MAKE THE HALLWAY GRAPH FOR DJIKSTRA TO WORK, USES HALLWAY DATA.
export const createHallwayGraph = (hallwayData: FeatureCollection): Record<string, string[]> => {
    const graph: Record<string, string[]> = {};
  
    
    hallwayData.features.forEach((feature: Feature) => {
      if (feature.geometry.type === 'MultiLineString') {
        const lines: MultiLineString = feature.geometry as MultiLineString;
  
        lines.coordinates.forEach((line) => {
          for (let i = 0; i < line.length - 1; i++) {
            const from = line[i];
            const to = line[i + 1];
  
            const fromKey = JSON.stringify(from);
            const toKey = JSON.stringify(to);
  
            
            if (!graph[fromKey]) graph[fromKey] = [];
            if (!graph[toKey]) graph[toKey] = [];
  
            graph[fromKey].push(toKey);
            graph[toKey].push(fromKey);
          }
        });
      }
    });
  
    return graph;
  };

//FUNCTION TO LOAD HALLWAY DATA BASED ON FLOOR NUMBER
export const loadHallwaysData = async (buildingName: string, floorNumber: number): Promise<Record<string, string[]> | null> => {
    try {
      const filePath: string = `${buildingName}-${floorNumber}-hallways.json`;
      const fileContent = JSON.stringify(reverseLookup[filePath]);
      const data: FeatureCollection = JSON.parse(fileContent);
      
      return createHallwayGraph(data);
    } catch (error) {
      console.error("Error loading hallway data:", error);
      return null;
    }
};

//FUNCTION USED TO GET DISTANCE BETWEEN TWO COORDINATE POINTS
export const calculateDistance = (node1: string, node2: string): number => {
  const [lat1, lon1] = JSON.parse(node1);  
  const [lat2, lon2] = JSON.parse(node2);  

  const latDiff = lat2 - lat1;
  const lonDiff = lon2 - lon1;

  return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff); 
};

export const findClosestNode = (graph: Graph, target: string): string => {
  let closestNode = "";
  let minDistance = Infinity;

  Object.keys(graph).forEach((node) => {
    const distance = calculateDistance(target, node);
    if (distance < minDistance) {
      minDistance = distance;
      closestNode = node;
    }
  });

  return closestNode;
};

//DIJKSTRA FUNCTION
export const dijkstra = (
  graph: Graph,
  start: string,
  end: string
): string[] => {
  const closestStartNode = findClosestNode(graph, start); 
  const closestEndNode = findClosestNode(graph, end); 

  const distances: Distances = {};
  const previousNodes: PreviousNodes = {};
  const nodes: Set<string> = new Set();


  Object.keys(graph).forEach((node) => {
    distances[node] = node === closestStartNode ? 0 : Infinity;
    previousNodes[node] = null; 
    nodes.add(node);
  });

  while (nodes.size > 0) {
   
    let closestNode = Array.from(nodes).reduce((closest, node) => {
      if (distances[node] < distances[closest]) {
        return node;
      }
      return closest;
    });

  
    if (closestNode === closestEndNode) {
      const path: string[] = [];
      let currentNode = closestEndNode;
    
      while (previousNodes[currentNode] !== null) {
        path.unshift(currentNode);
        currentNode = previousNodes[currentNode]!;
      }
      
      path.unshift(closestStartNode); 
      return path; 
    }

    nodes.delete(closestNode); 

    
    graph[closestNode].forEach((neighbor) => {
      const alt = distances[closestNode] + 1; 
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previousNodes[neighbor] = closestNode;
      }
    });
  }

  return []; 
};

//Used to find building (first letters) and then floor number (first number encountered)
export const splitRoomCode = (roomCode: string): { letters: string; numbers: string } => {
    const match = roomCode.match(/^([A-Za-z]+)(\d+)/);
    if (!match) throw new Error(`Invalid room code format: ${roomCode}`);
    return { letters: match[1], numbers: match[2] };
};

export const compareRooms = async (room1: string, room2: string, forDisabled: boolean = false): Promise<PathResult> => {
    const { letters: letters1, numbers: numbers1 } = splitRoomCode(room1);
    const { letters: letters2, numbers: numbers2 } = splitRoomCode(room2);

    if (letters1 === letters2) {
        // Same building
        if (numbers1[0] === numbers2[0]) {
            return sameFloor(room1, room2); 
        } else {
            return differentFloor(room1, room2, forDisabled);
        }
    } else {
        // Different buildings
        return differentBuilding(room1, room2, forDisabled);
    }
};


//FUNCTIONS USED IN MAIN NAV FUNCTIONS
export const getRoomCoordinates = (roomCode: string): number[] | undefined => {
  const room = roomList.find(r => r.code === roomCode);
  return room ? room.coordinates : undefined;
};

export const extractBuildingFromCode = (roomCode: string): string => {
  const match = roomCode.match(/^([A-Za-z]+)/);
  if (!match) {
    throw new Error(`Invalid room code format: ${roomCode}`);
  }

  const buildingCode = match[1].toUpperCase();

  if (/^HALL$/i.test(buildingCode)) {
    return "hall";
  }

  switch (buildingCode) {
    case "H": return "hall";
    case "MB": return "mb";
    case "VE": return "ve";
    case "VL": return "vl";
    case "CC": return "cc";
    default: throw new Error(`Unknown building code: ${buildingCode}`);
  }
};

export const extractFloorFromCode = (roomCode: string): string => {
  const match = roomCode.match(/\d+/); 
  if (!match) {
      throw new Error(`Invalid room code format: ${roomCode}`);
  }
  return match[0][0]; 
};


export const sameFloor = async (room1Code: string, room2Code: string): Promise<string[]> => {

  const building = extractBuildingFromCode(room1Code);
  const floor = extractFloorFromCode(room1Code);
  const room1Coords = getRoomCoordinates(room1Code);
  const room2Coords = getRoomCoordinates(room2Code);

  if (!room1Coords || !room2Coords) {
      console.error("One or both rooms not found in the room list.");
      return [];
  }

  try {
      const hallwaysGraph = await loadHallwaysData(building, Number(floor));
      if (!hallwaysGraph) {
          console.error("Error: Failed to load hallways data");
          return [];
      }
      
      const path = dijkstra(hallwaysGraph, JSON.stringify(room1Coords), JSON.stringify(room2Coords));
      return path;

  } catch (error) {
      console.error("Error computing path:", error);
      return [];
  }
};

export const differentFloor = async (
  room1Code: string, 
  room2Code: string, 
  forDisabled: boolean = false
): Promise<{ path1: string[], path2: string[] }> => {

  const building1 = extractBuildingFromCode(room1Code);
  const floor1 = extractFloorFromCode(room1Code);

  const elevatorCode1 = `${building1}${floor1}ELEV`;
  const escalatorCode1 = `${building1}${floor1}ESCA`;

  const room1Coords = getRoomCoordinates(room1Code);
  const elevatorCoords1 = getRoomCoordinates(elevatorCode1);
  const escalatorCoords1 = getRoomCoordinates(escalatorCode1);

  if (!room1Coords) {
    console.error("Starting room not found in the room list.");
    return { path1: [], path2: [] };
  }

  // Determine closest transition point on first floor
  let closestTransition: string | null = null;
  
  if (forDisabled) {
    closestTransition = elevatorCoords1 ? elevatorCode1 : null;
  } else {
    // Get available transition points
    const availableTransitions: {code: string, coords: any}[] = [];
    if (elevatorCoords1) availableTransitions.push({code: elevatorCode1, coords: elevatorCoords1});
    if (escalatorCoords1) availableTransitions.push({code: escalatorCode1, coords: escalatorCoords1});

    if (availableTransitions.length === 0) {
      console.error("No transition points (elevator or escalator) found on the starting floor.");
      return { path1: [], path2: [] };
    }

    // Find closest available transition
    closestTransition = availableTransitions.reduce((closest, current) => {
      const currentDistance = calculateDistance(JSON.stringify(room1Coords), JSON.stringify(current.coords));
      const closestDistance = calculateDistance(JSON.stringify(room1Coords), JSON.stringify(closest.coords));
      return currentDistance < closestDistance ? current : closest;
    }).code;
  }

  if (!closestTransition) {
    console.error("No suitable transition point found on the starting floor.");
    return { path1: [], path2: [] };
  }

  const path1 = await sameFloor(room1Code, closestTransition);

  const building2 = extractBuildingFromCode(room2Code);
  const floor2 = extractFloorFromCode(room2Code);

  // Determine transition point on second floor
  const elevatorCode2 = `${building2}${floor2}ELEV`;
  const escalatorCode2 = `${building2}${floor2}ESCA`;
  
  const elevatorCoords2 = getRoomCoordinates(elevatorCode2);
  const escalatorCoords2 = getRoomCoordinates(escalatorCode2);

  let secondTransition: string | null = null;
  
  if (forDisabled) {
    // For disabled, must use elevator if available
    secondTransition = elevatorCoords2 ? elevatorCode2 : null;
  } else {
    // Prefer the same type of transition as used on first floor
    const preferredType = closestTransition.includes("ELEV") ? "ELEV" : "ESCA";
    const preferredCode = preferredType === "ELEV" ? elevatorCode2 : escalatorCode2;
    const preferredCoords = preferredType === "ELEV" ? elevatorCoords2 : escalatorCoords2;
    
    // Fallback to the other type if preferred not available
    const fallbackCode = preferredType === "ELEV" ? escalatorCode2 : elevatorCode2;
    const fallbackCoords = preferredType === "ELEV" ? escalatorCoords2 : elevatorCoords2;
    
    secondTransition = preferredCoords ? preferredCode : (fallbackCoords ? fallbackCode : null);
  }

  if (!secondTransition) {
    console.error("No valid transition point found on the second floor.");
    return { path1, path2: [] };
  }

  // Compute second path using sameFloor
  const path2 = await sameFloor(secondTransition, room2Code);

  return { path1, path2 };
};

export const differentBuilding = async (room1: string, room2: string, forDisabled: boolean): Promise<{ path1: string[], path2: string[], path3: string[], path4: string[] }> => {
  const { path1, path2 } = await indoorToOutdoor(room1, forDisabled);

  const { path1: path3, path2: path4 } = await outdoorToIndoor(room2, forDisabled);

  return { path1, path2, path3, path4 };
};

export const indoorToOutdoor = async (room1: string, forDisabled: boolean): Promise<{ path1: string[], path2: string[] }> => {
  const buildingCode = extractBuildingFromCode(room1); 
  const startFloor = Number(extractFloorFromCode(room1)); 

  let path1: string[] = [];
  let path2: string[] = [];

  if (startFloor === 1) {
      path2 = await sameFloor(room1, `${buildingCode}1ENTR`);
  } else {
      const { path1: floorPath1, path2: floorPath2 } = await differentFloor(room1, `${buildingCode}1ENTR`, forDisabled);
      path1 = floorPath1;
      path2 = floorPath2;
  }

  return { path1, path2 };
};

export const outdoorToIndoor = async (room2: string, forDisabled: boolean): Promise<{ path1: string[], path2: string[] }> => {
  const buildingCode = extractBuildingFromCode(room2); 
  const startFloor = Number(extractFloorFromCode(room2)); 

  let path1: string[] = [];
  let path2: string[] = [];
  const entranceRoom = `${buildingCode}1ENTR`;

  if (startFloor === 1) {
    path1 = await sameFloor(entranceRoom, room2);
  } else {
    const { path1: floorPath1, path2: floorPath2 } = await differentFloor(entranceRoom, room2, forDisabled);
    path1 = floorPath1;
    path2 = floorPath2;
  }

  return { path1, path2 };
};

//HELPER FUNCTIONS FOR GEOPOSITION TO ROOM
export const calculateDistanceForGeoposition = (coord1: [number, number], coord2: [number, number]): number => {
  const latDiff = coord2[0] - coord1[0];
  const longDiff = coord2[1] - coord1[1];
  return Math.sqrt(latDiff * latDiff + longDiff * longDiff);
};

export const findClosestRoom = (
  geoposition: [number, number],
  roomList: Room[],
  building: string,
  floor: number
): string | null => {
  let closestRoomCode: string | null = null;
  let minDistance = Infinity;

  roomList.forEach(room => {
    const code = room.code;
    if (!code.startsWith(building)) return;

    const match = code.match(/\d+/);
    if (!match) return;

    const firstDigit = parseInt(match[0].charAt(0), 10);
    if (firstDigit !== floor) return;

    const roomCoords = room.coordinates;
    const distance = calculateDistanceForGeoposition(geoposition, roomCoords);

    if (distance < minDistance) {
      minDistance = distance;
      closestRoomCode = code;
    }
  });

  return closestRoomCode;
};

export const routeToRoom = async (
  geoposition: [number, number], 
  floor: number, 
  building: string, 
  room: string, 
  isDisabled: boolean
): Promise<PathResult> => {
   const room1 = findClosestRoom(geoposition, roomList, building, floor)
   const room2 = room;
   if (room1 && room2) {
    return compareRooms(room1, room2, isDisabled);
  } else {
    return [];
  }
}

