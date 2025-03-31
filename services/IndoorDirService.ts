import hall8Rooms from "../gis/hall-8-rooms-pois.json";
import hall9Rooms from "../gis/hall-9-rooms-pois.json";
import hall8Hallways from "../gis/hall-8-hallways.json";
import hall9Hallways from "../gis/hall-9-hallways.json";
import { FeatureCollection, Feature, MultiLineString } from 'geojson';
import { readFile } from 'fs/promises';
import { join } from 'path';


interface Room {
    code: string;
    coordinates: [number, number]; // [longitude, latitude]
}

interface Hallway {
    name: string;
    hallways: number[][][]; // MultiLineString format from JSON
}


// FUNCTIONS TO EXTRACT DATA FROM GIS JSON FILES
const extractRooms = (data: any): Room[] => {
    return data.features.map((feature: any) => ({
        code: feature.properties.Code,
        coordinates: feature.geometry.coordinates
    }));
};

const extractHallways = (data: any, name: string): Hallway => ({
    name,
    hallways: data.features.map((feature: any) => feature.geometry.coordinates)
});

//"DATABASE" VARIABLES THAT HOLD HALLWAYS FOR EACH FLOOR AND ROOMS FOR EACH FLOOR
const hallwaysList: Hallway[] = [
    extractHallways(hall8Hallways, "hall-8-hallways"),
    extractHallways(hall9Hallways, "hall-9-hallways")
];

const roomList: Room[] = [...extractRooms(hall8Rooms), ...extractRooms(hall9Rooms)];

//For testing.
const logHallwaysData = (hallwaysList: Hallway[]) => {
    hallwaysList.forEach(hallway => {
        console.log(hallway.name);
        hallway.hallways.forEach((coords, index) => {
            console.log(`Hallway ${index + 1}:`, JSON.stringify(coords));
        });
    });
};

// console.log("All Rooms List:", roomList);

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
  
            // Initialize nodes in graph
            if (!graph[fromKey]) graph[fromKey] = [];
            if (!graph[toKey]) graph[toKey] = [];
  
            // Add the connections (undirected graph)
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
      const filePath = join(__dirname, '..', 'gis', `${buildingName}-${floorNumber}-hallways.json`); 
      const fileContent = await readFile(filePath, 'utf-8');
      const data: FeatureCollection = JSON.parse(fileContent);
      
      return createHallwayGraph(data);
    } catch (error) {
      console.error("Error loading hallway data:", error);
      return null;
    }
};

//FUNCTION USED TO GET DISTANCE BETWEEN TWO COORDINATE POINTS
const calculateDistance = (node1: string, node2: string): number => {
  const [lat1, lon1] = JSON.parse(node1);  // Parse the string back into [lat, lon]
  const [lat2, lon2] = JSON.parse(node2);  // Parse the string back into [lat, lon]

  const latDiff = lat2 - lat1;
  const lonDiff = lon2 - lon1;

  return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff); // Euclidean distance
};

//FUNCTION USED TO FIND CLOSEST NODE TO GIVEN POINT USING GRAPH GENERATED FROM JSON FILE
const findClosestNode = (graph: Graph, target: string): string => {
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


//ALL DJIKSTRA FUNCTION
type Graph = Record<string, string[]>; // Adjacency list
type Distances = Record<string, number>;
type PreviousNodes = Record<string, string | null>;

export const dijkstra = (
  graph: Graph,
  start: string,
  end: string
): string[] => {
  const closestStartNode = findClosestNode(graph, start); // Find closest start node
  const closestEndNode = findClosestNode(graph, end); // Find closest end node

  console.log('Closest Start Node:', closestStartNode);
  console.log('Closest End Node:', closestEndNode);

  const distances: Distances = {};
  const previousNodes: PreviousNodes = {};
  const nodes: Set<string> = new Set();

  // Initialize distances and nodes
  Object.keys(graph).forEach((node) => {
    distances[node] = node === closestStartNode ? 0 : Infinity; // Start node distance is 0
    previousNodes[node] = null; // No previous node initially
    nodes.add(node);
  });

  while (nodes.size > 0) {
    // Get the node with the smallest distance
    let closestNode = Array.from(nodes).reduce((closest, node) => {
      if (distances[node] < distances[closest]) {
        return node;
      }
      return closest;
    });

    // If we reach the end, reconstruct the path
    if (closestNode === closestEndNode) {
      const path: string[] = [];
      let currentNode = closestEndNode;
      
      // Reconstruct the path from end to start
      while (previousNodes[currentNode] !== null) {
        path.unshift(currentNode);
        currentNode = previousNodes[currentNode]!; // Non-null assertion
      }
      
      path.unshift(closestStartNode); // Add the start node at the beginning of the path
      return path; // Return the path to the end node directly
    }

    nodes.delete(closestNode); // Remove the closest node from the set

    // Check all neighbors of the current node
    graph[closestNode].forEach((neighbor) => {
      const alt = distances[closestNode] + 1; // Assuming uniform distance (1)
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previousNodes[neighbor] = closestNode;
      }
    });
  }

  return []; // No path found
};

//Used to find building (first letters) and then floor number (first number encountered)
const splitRoomCode = (roomCode: string): { letters: string; numbers: string } => {
    const match = roomCode.match(/^([A-Za-z]+)(\d+)/);
    if (!match) throw new Error(`Invalid room code format: ${roomCode}`);
    return { letters: match[1], numbers: match[2] };
};

// MAIN FUNCTION
const compareRooms = (room1: string, room2: string) => {
    const { letters: letters1, numbers: numbers1 } = splitRoomCode(room1);
    const { letters: letters2, numbers: numbers2 } = splitRoomCode(room2);

    if (letters1 === letters2) {
        // Check floor only if the buildings are the same
        if (numbers1[0] === numbers2[0]) {
            sameFloor(room1, room2); 
        } else {
            differentFloor(room1, room2); // Call function for rooms on different floors
        }
    } else {
        differentBuilding();
        console.log("Rooms are in different buildings.");
        // Do NOT check the floor if buildings are different
    }
};

//FUNCTIONS USED IN MAIN NAV FUNCTIONS
const getRoomCoordinates = (roomCode: string): number[] | undefined => {
  const room = roomList.find(r => r.code === roomCode);
  return room ? room.coordinates : undefined;
};

const extractBuildingFromCode = (roomCode: string): string => {
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


const extractFloorFromCode = (roomCode: string): string => {
  const match = roomCode.match(/\d+/); // Matches the first number in the room code
  if (!match) {
      throw new Error(`Invalid room code format: ${roomCode}`);
  }
  return match[0][0]; // Return the first digit of the matched number (floor)
};

// Placeholder functions

const differentBuilding = () => console.log("Different building")
const sameFloor = async (room1Code: string, room2Code: string): Promise<string[]> => {
  console.log("Same Floor function executed.");

  // Extract floor information from the room codes
  const building = extractBuildingFromCode(room1Code);
  const floor = extractFloorFromCode(room1Code);
  const room1Coords = getRoomCoordinates(room1Code);
  const room2Coords = getRoomCoordinates(room2Code);

  if (!room1Coords || !room2Coords) {
      console.error("One or both rooms not found in the room list.");
      return [];
  }

  console.log(`Room 1 Coordinates: ${JSON.stringify(room1Coords)}`);
  console.log(`Room 2 Coordinates: ${JSON.stringify(room2Coords)}`);

  try {
      const hallwaysGraph = await loadHallwaysData(building, Number(floor));
      if (!hallwaysGraph) {
          console.error("Error: Failed to load hallways data");
          return [];
      }
      
      const path = dijkstra(hallwaysGraph, JSON.stringify(room1Coords), JSON.stringify(room2Coords));
      console.log("Computed Path:", JSON.stringify(path, null, 2));
      return path;
  } catch (error) {
      console.error("Error computing path:", error);
      return [];
  }
};


const differentFloor = async (room1Code: string, room2Code: string): Promise<{ path1: string[], path2: string[] }> => {
  console.log("Different Floor function executed.");

  // Extract building and floor information from room1Code
  const building1 = extractBuildingFromCode(room1Code);
  const floor1 = extractFloorFromCode(room1Code);

  // Determine the two possible transition points
  const elevatorCode1 = `${building1}${floor1}ELEV`;
  const escalatorCode1 = `${building1}${floor1}ESCA`;

  // Get coordinates of the room and transition points
  const room1Coords = getRoomCoordinates(room1Code);
  const elevatorCoords1 = getRoomCoordinates(elevatorCode1);
  const escalatorCoords1 = getRoomCoordinates(escalatorCode1);

  if (!room1Coords || !elevatorCoords1 || !escalatorCoords1) {
      console.error("One or more required locations not found in the room list.");
      return { path1: [], path2: [] };
  }

  // Calculate distances to determine the closest transition point
  const distanceToElevator = calculateDistance(JSON.stringify(room1Coords), JSON.stringify(elevatorCoords1));
  const distanceToEscalator = calculateDistance(JSON.stringify(room1Coords), JSON.stringify(escalatorCoords1));
  const closestTransition = distanceToElevator < distanceToEscalator ? elevatorCode1 : escalatorCode1;

  console.log(`Closest transition point: ${closestTransition}`);

  // Compute first path using sameFloor
  const path1 = await sameFloor(room1Code, closestTransition);

  // Extract building and floor information from room2Code
  const building2 = extractBuildingFromCode(room2Code);
  const floor2 = extractFloorFromCode(room2Code);

  // Determine the transition point on the second floor using the same method
  const secondTransition = closestTransition.includes("ELEV") 
      ? `${building2}${floor2}ELEV` 
      : `${building2}${floor2}ESCA`;

  console.log(`Transition point for second floor: ${secondTransition}`);

  // Compute second path using sameFloor
  const path2 = await sameFloor(secondTransition, room2Code);

  return { path1, path2 };
};


//Function to test if graph is loaded correctly

const loadAndDisplayGraph = async () => {
    const hallwaysGraph = await loadHallwaysData("hall", 8); 
    
    if (hallwaysGraph) {
      console.log("Hallways Graph:", JSON.stringify(hallwaysGraph, null, 2));
    } else {
      console.log("Failed to load hallways graph.");
    }
  };
//compareRooms("H820", "H822")
// sameFloor("H825", "H831").then((path) => {
//   console.log("Returned Path:", path); 
// });
differentFloor("H863", "H968").then((path) => {
  console.log("Returned Path:", path); //Probably a bug with the files themselves but it rarely returns a path just not the shortest one.
});
//loadAndDisplayGraph();
//npx ts-node services/IndoorDirService.ts
