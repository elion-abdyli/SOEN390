
type Event = {
  id: string;
  title: string;
  time: string;
  description: string;
};

type EventsType = {
  [date: string]: Event[];
};

export const getEvents = async (): Promise<EventsType> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      '2025-04-15': [
        { id: '1', title: 'Meeting with John', time: '10:00 AM', description: 'Discuss project timeline' },
        { id: '2', title: 'Lunch with team', time: '1:00 PM', description: 'Team building lunch' }
      ],
      '2025-04-17': [
        { id: '3', title: 'Doctor Appointment', time: '9:30 AM', description: 'Annual checkup' },
        { id: '4', title: 'Conference Call', time: '2:00 PM', description: 'Client presentation' },
        { id: '5', title: 'Gym', time: '6:00 PM', description: 'Workout session' }
      ],
      '2025-04-20': [
        { id: '6', title: 'Birthday Party', time: '7:00 PM', description: "Sarah's birthday celebration" }
      ]
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    throw new Error('Failed to fetch events');
  }
};

// Get events for a specific date
export const getEventsByDate = async (date: string): Promise<Event[]> => {
  try {
    const allEvents = await getEvents();
    return allEvents[date] || [];
  } catch (error) {
    console.error(`Error fetching events for date ${date}:`, error);
    throw new Error(`Failed to fetch events for ${date}`);
  }
};

// Get today's date in YYYY-MM-DD format
export const getTodayString = (): string => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error getting today\'s date:', error);
    // Fallback to a manual date string if something goes wrong
    return new Date().toISOString().split('T')[0];
  }
};

// Create a new event
export const createEvent = async (date: string, event: Omit<Event, 'id'>): Promise<Event> => {
  try {
    // This would be an API call in a real application
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate a unique ID (in a real app, this would come from the backend)
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
    };
    
    // Return the created event
    return newEvent;
  } catch (error) {
    console.error('Error creating event:', error);
    throw new Error('Failed to create event');
  }
};

// Delete an event
export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return success
    return true;
  } catch (error) {
    console.error(`Error deleting event ${eventId}:`, error);
    throw new Error(`Failed to delete event ${eventId}`);
  }
};