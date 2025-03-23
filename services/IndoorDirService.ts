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


// Function to extract rooms from a given JSON data
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

const hallwaysList: Hallway[] = [
    extractHallways(hall8Hallways, "hall-8-hallways"),
    extractHallways(hall9Hallways, "hall-9-hallways")
];

const logHallwaysData = (hallwaysList: Hallway[]) => {
    hallwaysList.forEach(hallway => {
        console.log(hallway.name);
        hallway.hallways.forEach((coords, index) => {
            console.log(`Hallway ${index + 1}:`, JSON.stringify(coords));
        });
    });
};


const roomList: Room[] = [...extractRooms(hall8Rooms), ...extractRooms(hall9Rooms)];
// console.log("All Rooms List:", roomList);

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

export const loadHallwaysData = async (floorNumber: number): Promise<Record<string, string[]> | null> => {
    try {
      const filePath = join(__dirname, '..', 'gis', `hall-${floorNumber}-hallways.json`);
      const fileContent = await readFile(filePath, 'utf-8');
      const data: FeatureCollection = JSON.parse(fileContent);
      
      return createHallwayGraph(data);
    } catch (error) {
      console.error("Error loading hallway data:", error);
      return null;
    }
};

const calculateDistance = (node1: string, node2: string): number => {
  const [lat1, lon1] = JSON.parse(node1);  // Parse the string back into [lat, lon]
  const [lat2, lon2] = JSON.parse(node2);  // Parse the string back into [lat, lon]

  const latDiff = lat2 - lat1;
  const lonDiff = lon2 - lon1;

  return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff); // Euclidean distance
};

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


const splitRoomCode = (roomCode: string): { letters: string; numbers: string } => {
    const match = roomCode.match(/^([A-Za-z]+)(\d+)/);
    if (!match) throw new Error(`Invalid room code format: ${roomCode}`);
    return { letters: match[1], numbers: match[2] };
};

// Main function to compare room codes and determine execution path
const compareRooms = (room1: string, room2: string) => {
    const { letters: letters1, numbers: numbers1 } = splitRoomCode(room1);
    const { letters: letters2, numbers: numbers2 } = splitRoomCode(room2);

    if (letters1 === letters2) {
        sameBuilding(); // Call function for rooms in the same building

        // Check floor only if the buildings are the same
        if (numbers1[0] === numbers2[0]) {
            sameFloor(room1, room2); 
        } else {
            differentFloor(); // Call function for rooms on different floors
        }
    } else {
        console.log("Rooms are in different buildings.");
        // Do NOT check the floor if buildings are different
    }
};

// Placeholder functions
const sameBuilding = () => console.log("Same Building function executed.");

const sameFloor = (room1Code: string, room2Code: string) => {
    console.log("Same Floor function executed.");

    const getRoomCoordinates = (roomCode: string): number[] | undefined => {
        const room = roomList.find(r => r.code === roomCode);
        return room ? room.coordinates : undefined;
    };

    const extractFloorFromCode = (roomCode: string): string => {
        const match = roomCode.match(/\d+/); // Matches the first number in the room code
        if (!match) {
            throw new Error(`Invalid room code format: ${roomCode}`);
        }
        return match[0][0]; // Return the first digit of the matched number (floor)
    };

    // Extract floor information from the room codes
    const floor = extractFloorFromCode(room1Code);
    const room1Coords = getRoomCoordinates(room1Code);
    const room2Coords = getRoomCoordinates(room2Code);

    if (room1Coords && room2Coords) {
        console.log(`Room 1 Coordinates: ${room1Coords}`);
        console.log(`Room 2 Coordinates: ${room2Coords}`);
    } else {
        console.log("One or both rooms not found in the room list.");
    }

    loadHallwaysData(Number(floor)).then((hallwaysGraph) => {
        if (!hallwaysGraph) {
          console.error("Error: Failed to load hallways data");
          return;
        }
        const path = dijkstra(hallwaysGraph, JSON.stringify(room1Coords), JSON.stringify(room2Coords))
        console.log(JSON.stringify(room1Coords))
        console.log(JSON.stringify(room2Coords))
        console.log("Graph Keys:", Object.keys(hallwaysGraph));
        console.log("Start Exists:", JSON.stringify(room1Coords) in hallwaysGraph);
        console.log("End Exists:", JSON.stringify(room2Coords) in hallwaysGraph);
        console.log(JSON.stringify(path, null, 2));
      });


    // const matchingHallways = hallwaysList.filter((hallway) => hallway.name.includes(floor));

    // if (matchingHallways.length > 0) {
    //     console.log(`Hallways Coordinates for Floor ${floor}:`);
    //     matchingHallways.forEach((hallway) => {
    //         hallway.hallways.forEach((line, index) => {
    //             console.log(`  Hallway ${index + 1}: ${JSON.stringify(line)}`);
    //         });
    //     });
    // } else {
    //     console.log(`No hallways found for Floor ${floor}.`);
    // }
};

const loadAndDisplayGraph = async () => {
    const hallwaysGraph = await loadHallwaysData(8);
    
    if (hallwaysGraph) {
      console.log("Hallways Graph:", JSON.stringify(hallwaysGraph, null, 2));
    } else {
      console.log("Failed to load hallways graph.");
    }
  };

compareRooms("H820", "H822")
//loadAndDisplayGraph();
const differentFloor = () => console.log("Different Floor function executed.");

