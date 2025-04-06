import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import CalendarScreen from '@/screens/CalendarScreen';
import * as eventService from '@/services/eventService';
import NetInfo from '@react-native-community/netinfo';

// Mock dependencies
jest.mock('@/components/CalendarComponents/CalendarView', () => 'CalendarView');
jest.mock('@/components/CalendarComponents/EventList', () => 'EventList');
jest.mock('@/services/eventService');
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
}));

describe('CalendarScreen Component', () => {
  const mockEvents = {
    courses: {
      '2025-04-05': [
        { id: '1', title: 'CS101', startTime: '10:00', endTime: '11:30', description: 'Lecture', location: 'Room 101' },
      ],
    },
    personal: {
      '2025-04-05': [
        { id: '2', title: 'Gym', startTime: '18:00', endTime: '19:00', description: 'Workout', location: 'Fitness Center' },
      ],
    },
    work: {
      '2025-04-07': [
        { id: '3', title: 'Meeting', startTime: '09:00', endTime: '10:00', description: 'Weekly Sync', location: 'Conference Room' },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    eventService.getEvents.mockImplementation((calendarType) => {
      return Promise.resolve(mockEvents[calendarType]);
    });
    
    eventService.getTodayString.mockReturnValue('2025-04-05');
    
    NetInfo.addEventListener.mockImplementation((callback) => {
      callback({ isConnected: true });
      // unsubscribe function
      return jest.fn(); 
    });
  });

  test('renders without crashing', async () => {
    await act(async () => {
      const { getByTestId } = render(<CalendarScreen />);
      await waitFor(() => expect(eventService.getEvents).toHaveBeenCalled());
    });
  });

  test('fetches events on component mount', async () => {
    await act(async () => {
      render(<CalendarScreen />);
      await waitFor(() => {
        expect(eventService.getEvents).toHaveBeenCalledWith('courses');
        expect(eventService.getEvents).toHaveBeenCalledWith('personal');
        expect(eventService.getEvents).toHaveBeenCalledWith('work');
      });
    });
  });

  test('passes correct props to CalendarView', async () => {
    let calendarViewProps;
    
    jest.doMock('@/components/CalendarComponents/CalendarView', () => {
      return function MockCalendarView(props) {
        calendarViewProps = props;
        return null;
      };
    });
    
    await act(async () => {
      render(<CalendarScreen />);
      await waitFor(() => expect(eventService.getEvents).toHaveBeenCalled());
    });
    
    expect(calendarViewProps).toBeDefined();
    expect(calendarViewProps.selectedDate).toBe('2025-04-05');
    expect(calendarViewProps.isLoading).toBeDefined();
    expect(calendarViewProps.events).toBeDefined();
  });

  test('handles network state changes', async () => {
    let netInfoCallback;
    
    NetInfo.addEventListener.mockImplementation((callback) => {
      netInfoCallback = callback;
      callback({ isConnected: true });
      // unsubscribe function
      return jest.fn(); 
    });
    
    await act(async () => {
      const { rerender } = render(<CalendarScreen />);
      
      // Simulate network disconnection
      netInfoCallback({ isConnected: false });
      rerender(<CalendarScreen />);
      
      await waitFor(() => expect(eventService.getEvents).toHaveBeenCalled());
    });
    
  });

  test('handles error in fetching events', async () => {
    const error = new Error('Failed to fetch events');
    eventService.getEvents.mockRejectedValueOnce(error);
    
    await act(async () => {
      render(<CalendarScreen />);
      await waitFor(() => expect(eventService.getEvents).toHaveBeenCalled());
    });
    
    // Component should handle errors correctly
  });

  test('unsubscribes from NetInfo on unmount', async () => {
    const unsubscribeMock = jest.fn();
    NetInfo.addEventListener.mockReturnValue(unsubscribeMock);
    
    await act(async () => {
      const { unmount } = render(<CalendarScreen />);
      await waitFor(() => expect(eventService.getEvents).toHaveBeenCalled());
      
      unmount();
    });
    
    expect(unsubscribeMock).toHaveBeenCalled();
  });
});