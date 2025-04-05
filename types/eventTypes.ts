
export interface Event {
    id: string;
    title: string;
    time: string;
    description: string;
  }
  
  export interface EventsType {
    [date: string]: Event[];
  }