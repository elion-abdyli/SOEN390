import { EventsType, Event } from '@/types/eventTypes';

// Get today's date as a string in YYYY-MM-DD format
export const getTodayString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Fetch events based on calendar type
export const getEvents = async (calendarType: string = 'courses'): Promise<EventsType> => {
  try {
    // Mock data for different calendar types
    let events: EventsType = {};
    
    if (calendarType === 'courses') {
      events = generateMockCourseEvents();
    } else if (calendarType === 'personal') {
      events = generateMockPersonalEvents();
    } else if (calendarType === 'work') {
      events = generateMockWorkEvents();
    }
    
    return events;
  } catch (error) {
    console.error(`Error fetching ${calendarType} events:`, error);
    throw error;
  }
};

// Helper function to generate mock course events
const generateMockCourseEvents = (): EventsType => {
  const today = getTodayString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  return {
    [today]: [
      {
        id: '1',
        title: 'CS101 Lecture',
        startTime: '09:00',
        endTime: '10:30',
        description: 'Introduction to Programming',
        location: 'Room 302',
      },
      {
        id: '2',
        title: 'Math201 Tutorial',
        startTime: '13:00',
        endTime: '14:00',
        description: 'Linear Algebra Practice',
        location: 'Math Building',
      },
    ],
    [tomorrowStr]: [
      {
        id: '3',
        title: 'Physics Lab',
        startTime: '11:00',
        endTime: '13:00',
        description: 'Electricity and Magnetism',
        location: 'Science Building',
      },
    ],
  };
};

// Helper function to generate mock personal events
const generateMockPersonalEvents = (): EventsType => {
  const today = getTodayString();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];
  
  return {
    [today]: [
      {
        id: '101',
        title: 'Gym Session',
        startTime: '17:30',
        endTime: '19:00',
        description: 'Cardio and weights',
        location: 'Fitness Center',
      },
    ],
    [nextWeekStr]: [
      {
        id: '102',
        title: 'Birthday Party',
        startTime: '18:00',
        endTime: '22:00',
        description: 'Sarah\'s birthday celebration',
        location: 'Downtown Cafe',
      },
    ],
  };
};

// Helper function to generate mock work events
const generateMockWorkEvents = (): EventsType => {
  const today = getTodayString();
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];
  
  return {
    [today]: [
      {
        id: '201',
        title: 'Team Meeting',
        startTime: '10:00',
        endTime: '11:00',
        description: 'Weekly progress update',
        location: 'Conference Room A',
      },
    ],
    [dayAfterTomorrowStr]: [
      {
        id: '202',
        title: 'Project Deadline',
        startTime: '17:00',
        endTime: '17:30',
        description: 'Submit final report',
        location: 'Online',
      },
    ],
  };
};