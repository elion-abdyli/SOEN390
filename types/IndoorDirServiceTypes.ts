export interface Room {
    code: string;
    coordinates: [number, number];
}

export interface Hallway {
    name: string;
    hallways: number[][][]; 
}

export type Graph = Record<string, string[]>;
export type Distances = Record<string, number>;
export type PreviousNodes = Record<string, string | null>;

export type PathResult =
  | string[]  
  | { path1: string[]; path2: string[] }  
  | { path1: string[]; path2: string[]; path3: string[]; path4: string[] };