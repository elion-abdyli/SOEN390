import { extractRooms, extractHallways } from '../IndoorDirService'
import { createHallwayGraph } from '../IndoorDirService';
import { Graph } from '../IndoorDirService';
import { loadHallwaysData } from '../IndoorDirService';
import { calculateDistance } from '../IndoorDirService';
import { findClosestNode } from '../IndoorDirService';
import { dijkstra } from '../IndoorDirService';
import { splitRoomCode } from '../IndoorDirService';
import type { Room } from '../IndoorDirService'
import { getRoomCoordinates, extractBuildingFromCode, extractFloorFromCode } from '../IndoorDirService';
import { sameFloor, differentFloor, differentBuilding, indoorToOutdoor, outdoorToIndoor } from '../IndoorDirService';
import { calculateDistanceForGeoposition } from '../IndoorDirService';
import { findClosestRoom } from '../IndoorDirService';
import { roomList } from '../IndoorDirService';
import { routeToRoom } from '../IndoorDirService';
import { FeatureCollection } from 'geojson';
import path from 'path';


//EXTRACT ROOMS AND HALLWAYS TESTS
describe('extractRooms', () => {
  it('should extract room codes and coordinates from feature data', () => {
    const mockData = {
      features: [
        {
          properties: { Code: 'A101' },
          geometry: { coordinates: [1, 2] }
        },
        {
          properties: { Code: 'B202' },
          geometry: { coordinates: [3, 4] }
        }
      ]
    };

    const result = extractRooms(mockData);
    expect(result).toEqual([
      { code: 'A101', coordinates: [1, 2] },
      { code: 'B202', coordinates: [3, 4] }
    ]);
  });

  it('should return an empty array if there are no features', () => {
    const result = extractRooms({ features: [] });
    expect(result).toEqual([]);
  });
});

describe('extractHallways', () => {
  it('should extract hallway coordinates with a given name', () => {
    const mockData = {
      features: [
        { geometry: { coordinates: [[0, 0], [1, 1]] } },
        { geometry: { coordinates: [[2, 2], [3, 3]] } }
      ]
    };

    const result = extractHallways(mockData, 'floor-1');
    expect(result).toEqual({
      name: 'floor-1',
      hallways: [
        [[0, 0], [1, 1]],
        [[2, 2], [3, 3]]
      ]
    });
  });

  it('should return an empty hallways array if there are no features', () => {
    const result = extractHallways({ features: [] }, 'floor-1');
    expect(result).toEqual({ name: 'floor-1', hallways: [] });
  });
});

//CREATEHALLWAYGRAPH TESTS
describe('createHallwayGraph', () => {
  it('creates a bidirectional graph from MultiLineString hallway data', () => {
    const hallwayData: FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'MultiLineString',
            coordinates: [
              [
                [0, 0],
                [1, 1],
                [2, 2],
              ],
              [
                [2, 2],
                [3, 3],
              ],
            ],
          },
          properties: {},
        },
      ],
    };

    const graph = createHallwayGraph(hallwayData);

    expect(graph).toEqual({
      '[0,0]': ['[1,1]'],
      '[1,1]': ['[0,0]', '[2,2]'],
      '[2,2]': ['[1,1]', '[3,3]'],
      '[3,3]': ['[2,2]'],
    });
  });

  it('returns an empty graph when there are no features', () => {
    const emptyData: FeatureCollection = {
      type: 'FeatureCollection',
      features: [],
    };

    const graph = createHallwayGraph(emptyData);
    expect(graph).toEqual({});
  });

  it('ignores features that are not MultiLineString', () => {
    const invalidData: FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0, 0],
          },
          properties: {},
        },
      ],
    };

    const graph = createHallwayGraph(invalidData);
    expect(graph).toEqual({});
  });
});

//LOADHALLWAYSDATA TESTS

const testHallwaysData: Record<string, FeatureCollection> = {
  'mb-1-hallways.json': {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'MultiLineString',
        coordinates: [[[0,0], [1,1]]]
      },
      properties: {}
    }]
  }
};

const originalReverseLookup = require('../IndoorDirService').reverseLookup;
beforeAll(() => {
  require('../IndoorDirService').reverseLookup = testHallwaysData;
});

afterAll(() => {
  require('../IndoorDirService').reverseLookup = originalReverseLookup;
});

describe('loadHallwaysData', () => {

  it('returns null when hallway data is not found', async () => {
    const result = await loadHallwaysData('invalid', 99);
    expect(result).toBeNull();
  });

  it('returns null for invalid feature collection data', async () => {
    testHallwaysData['invalid-data.json'] = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'InvalidType',
          coordinates: []
        },
        properties: {}
      }]
    } as unknown as FeatureCollection;
    
    const result = await loadHallwaysData('invalid', 1);
    expect(result).toBeNull();
    delete testHallwaysData['invalid-data.json'];
  });
});

//CALCULATEDISTANCE TESTS
describe('calculateDistance', () => {

  it('should calculate the correct distance between two points', () => {
    const node1 = '[0, 0]';
    const node2 = '[3, 4]';
    const result = calculateDistance(node1, node2);
    expect(result).toBeCloseTo(5); 
  });

  it('should return 0 when both points are the same', () => {
    const node1 = '[1, 1]';
    const node2 = '[1, 1]';
    const result = calculateDistance(node1, node2);
    expect(result).toBe(0);
  });

  it('should throw an error for invalid JSON input', () => {
    const node1 = '[0, 0]';
    const node2 = 'invalid_json';
    expect(() => calculateDistance(node1, node2)).toThrowError(SyntaxError);
  });

});

//FINDCLOSESTNODE TESTS
describe('findClosestNode', () => {
  it('should find the closest node in a simple graph', () => {
    const graph: Graph = {
      '[0,0]': ['[1,0]', '[0,1]'],
      '[1,0]': ['[0,0]'],
      '[0,1]': ['[0,0]'],
      '[5,5]': []
    };
    
    const target = '[0.5,0.5]';
    const result = findClosestNode(graph, target);
    
    expect(['[0,0]', '[1,0]', '[0,1]']).toContain(result);
  });

  it('should return empty string for empty graph', () => {
    const graph: Graph = {};
    const target = '[1,2]';
    const result = findClosestNode(graph, target);
    expect(result).toBe('');
  });

  it('should return the only node when graph has one node', () => {
    const graph: Graph = {
      '[10,20]': []
    };
    const target = '[15,25]';
    const result = findClosestNode(graph, target);
    expect(result).toBe('[10,20]');
  });
});

describe('dijkstra', () => {
  it('returns shortest path between directly connected nodes', () => {
    const graph: Graph = {
      '[0,0]': ['[1,0]'],
      '[1,0]': ['[0,0]', '[2,0]'],
      '[2,0]': ['[1,0]']
    };
    const result = dijkstra(graph, '[0,0]', '[2,0]');
    expect(result).toEqual(['[0,0]', '[1,0]', '[2,0]']);
  });


  it('returns path with start node when no path exists', () => {
    const graph: Graph = {
      '[0,0]': ['[1,0]'],
      '[1,0]': ['[0,0]'],
      '[2,0]': []
    };
    const result = dijkstra(graph, '[0,0]', '[2,0]');
    expect(result).toEqual(['[0,0]']);
  });

  it('finds a valid path when multiple routes exist', () => {
    const graph: Graph = {
      '[0,0]': ['[1,0]', '[0,1]'],
      '[1,0]': ['[0,0]', '[2,0]'],
      '[0,1]': ['[0,0]', '[0,2]', '[1,1]'],
      '[2,0]': ['[1,0]', '[2,1]'],
      '[0,2]': ['[0,1]', '[1,2]'],
      '[1,1]': ['[0,1]', '[2,1]'],
      '[2,1]': ['[1,1]', '[2,0]', '[2,2]'],
      '[1,2]': ['[0,2]', '[2,2]'],
      '[2,2]': ['[1,2]', '[2,1]']
    };
    const result = dijkstra(graph, '[0,0]', '[2,2]');
    expect(result[0]).toBe('[0,0]');
    expect(result[result.length-1]).toBe('[2,2]');
    for (let i = 0; i < result.length-1; i++) {
      expect(graph[result[i]]).toContain(result[i+1]);
    }
  });
});

describe('splitRoomCode', () => {
  it('correctly splits standard room codes', () => {
    const result = splitRoomCode('MB123');
    expect(result).toEqual({
      letters: 'MB',
      numbers: '123'
    });
  });

  it('handles mixed case room codes', () => {
    const result = splitRoomCode('hAll101');
    expect(result).toEqual({
      letters: 'hAll',
      numbers: '101'
    });
  });

  it('throws error for invalid room codes', () => {
    expect(() => splitRoomCode('123')).toThrow('Invalid room code format: 123');
    expect(() => splitRoomCode('!Room')).toThrow('Invalid room code format: !Room');
    expect(() => splitRoomCode('')).toThrow('Invalid room code format: ');
  });
});

//TESTS FOR GETROOMCOORDINATES
describe('getRoomCoordinates', () => {
  // Mock roomList data with proper Room type
  const mockRoomList: Room[] = [
    { code: 'MB101', coordinates: [1.234, 5.678] }, // Explicit tuple
    { code: 'HALL201', coordinates: [2.345, 6.789] } // Explicit tuple
  ];

  beforeAll(() => {
    // Clear and replace the actual roomList with our mock data
    roomList.length = 0;
    roomList.push(...mockRoomList);
  });

  it('returns coordinates for existing room', () => {
    const result = getRoomCoordinates('MB101');
    expect(result).toEqual([1.234, 5.678]);
    expect(result?.length).toBe(2); // Verify tuple length
  });

  it('returns undefined for non-existent room', () => {
    expect(getRoomCoordinates('INVALID')).toBeUndefined();
  });

  it('is case sensitive', () => {
    expect(getRoomCoordinates('mb101')).toBeUndefined();
  });

  it('returns coordinates with exactly two numbers', () => {
    const coords = getRoomCoordinates('HALL201');
    if (coords) {
      const [long, lat] = coords;
      expect(typeof long).toBe('number');
      expect(typeof lat).toBe('number');
    } else {
      fail('Coordinates should exist for HALL201');
    }
  });
});

//TESTS FOR EXTRACTBUILDINGFROMCODE
describe('extractBuildingFromCode', () => {
  it('extracts standard building codes', () => {
    expect(extractBuildingFromCode('MB101')).toBe('mb');
    expect(extractBuildingFromCode('VE205')).toBe('ve');
    expect(extractBuildingFromCode('HALL301')).toBe('hall');
  });

  it('handles single-letter building codes', () => {
    expect(extractBuildingFromCode('H101')).toBe('hall');
  });

  it('throws error for invalid formats', () => {
    expect(() => extractBuildingFromCode('101')).toThrow('Invalid room code format: 101');
    expect(() => extractBuildingFromCode('!X101')).toThrow('Invalid room code format: !X101');
    expect(() => extractBuildingFromCode('UNKNOWN101')).toThrow('Unknown building code: UNKNOWN');
  });
});


//TESTS FOR EXTRACTFLOORFROMCODE
describe('extractFloorFromCode', () => {
  it('extracts floor from standard room codes', () => {
    expect(extractFloorFromCode('MB101')).toBe('1');
    expect(extractFloorFromCode('HALL205')).toBe('2');
    expect(extractFloorFromCode('VE3001')).toBe('3');
  });

  it('handles room codes with multiple numbers', () => {
    expect(extractFloorFromCode('MB101A')).toBe('1');
    expect(extractFloorFromCode('HALL205B')).toBe('2');
  });

  it('throws error for invalid formats', () => {
    expect(() => extractFloorFromCode('MB')).toThrow('Invalid room code format: MB');
    expect(() => extractFloorFromCode('HALL')).toThrow('Invalid room code format: HALL');
    expect(() => extractFloorFromCode('!X-Y')).toThrow('Invalid room code format: !X-Y');
  });
});

//MAIN FUNCTIONALITY TESTS HERE

//SAMEFLOOR TESTS
const TEST_DATA_PATH = path.join(__dirname, 'test-data');

describe('sameFloor', () => {
  beforeAll(() => {
    process.env.GIS_DATA_PATH = TEST_DATA_PATH;
  });

  it('returns empty array when no path exists', async () => {
    const result = await sameFloor('MB101', 'MB103');
    expect(result).toEqual([]);
  });


  it('returns empty array when a room is missing', async () => {
    const result = await sameFloor('MB101', 'INVALID');
    expect(result).toEqual([]);
  });
});

//DIFFERENTBUILDING TESTS
describe('differentFloor', () => {
  it('returns 2 arrays when 2 valid inputs', async () =>{
    const result = await differentFloor('H841', 'H908', false)
    expect(result).toEqual({
      path1: expect.any(Array),
      path2: expect.any(Array)
    })
  });

  it('returns 2 empty arrays when one invalid input', async () => {
    const result = await differentFloor("H8000", "H908", false)
    expect(result.path1).toEqual([]);
    expect(result.path2).toEqual([]);
    })
  })

describe('differentBuilding', () => {
  it('returns 4 arrays when 2 valid inputs', async () => {
    const result = await differentBuilding('H841', "MB1.410", false)
    expect(result).toEqual({
      path1: expect.any(Array),
      path2: expect.any(Array),
      path3: expect.any(Array),
      path4: expect.any(Array)
    })
  })
  it('returns 4 empty arrays when an invalid input', async () => {
    const result = await differentBuilding('H8000', "MB1.410", false)
    expect(result.path1).toEqual([]);
    expect(result.path2).toEqual([]);
    expect(result.path3).toEqual([]);
    expect(result.path4).toEqual([]);
  })
})

describe('indoorToOutdoor', () => {
  it('returns 2 arrays when 2 valid inputs', async () =>{
    const result = await indoorToOutdoor('H841', false)
    expect(result).toEqual({
      path1: expect.any(Array),
      path2: expect.any(Array)
    })
  });

  it('returns 2 empty arrays when one invalid input', async () => {
    const result = await indoorToOutdoor("H8000", false)
    expect(result.path1).toEqual([]);
    expect(result.path2).toEqual([]);
    })
  })

describe('outdoorToIndoor', () => {
  it('returns 2 arrays when 2 valid inputs', async () =>{
    const result = await indoorToOutdoor('H841', false)
    expect(result).toEqual({
        path1: expect.any(Array),
        path2: expect.any(Array)
      })
    });
  
    it('returns 2 empty arrays when one invalid input', async () => {
      const result = await indoorToOutdoor("H8000", false)
      expect(result.path1).toEqual([]);
      expect(result.path2).toEqual([]);
      })
    })

describe('calculateDistanceForGeoposition', () => {
  it('returns 0 for identical coordinates', () => {
    const coord: [number, number] = [10, 20];
    expect(calculateDistanceForGeoposition(coord, coord)).toBe(0);
  });

  it('correctly calculates horizontal distance', () => {
    const coord1: [number, number] = [0, 0];
    const coord2: [number, number] = [3, 0]; // 3 units right
    expect(calculateDistanceForGeoposition(coord1, coord2)).toBe(3);
  });

  it('correctly calculates diagonal distance', () => {
    const coord1: [number, number] = [0, 0];
    const coord2: [number, number] = [3, 4]; // 3-4-5 triangle
    expect(calculateDistanceForGeoposition(coord1, coord2)).toBe(5);
  });
})

describe('findClosestRoom', () => {
  it('returns the right room for invalid coordinates', async () => {
    const result = findClosestRoom([ -73.578927722554851, 45.496934540344347 ], roomList, 'H',8);
    expect(result).toEqual(null);
  })
})

describe('routeToRoom', () => {
  it('returns empty array for invalid coordinates', async () => {
    const result = await routeToRoom([ -73.578927722554851, 45.496934540344347 ], 8, 'H', "H841", false);
    expect(result).toEqual([]);
  })
})

