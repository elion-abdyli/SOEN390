import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CalendarView from '@/components/CalendarComponents/CalendarView';
import { Calendar } from 'react-native-calendars';
import { EventsType } from '@/types/eventTypes';

// Mock the Calendar component
jest.mock('react-native-calendars', () => {
  const { View } = require('react-native');
  return {
    Calendar: jest.fn(props => {
      return (
        <View testID="mock-calendar">
          <View testID="day-press" onPress={() => props.onDayPress({ dateString: '2025-04-10' })} />
        </View>
      );
    }),
  };
});

// Enum for CalendarType
const CalendarType = {
  COURSES: 'Courses',
  PERSONAL: 'Personal',
  WORK: 'Work',
};

describe('CalendarView Component', () => {
  const mockEvents = {
    [CalendarType.COURSES]: {
      '2025-04-05': [
        { id: '1', title: 'CS101', startTime: '10:00', endTime: '11:30', description: 'Lecture', location: 'Room 101' },
      ],
      '2025-04-06': [
        { id: '2', title: 'Math201', startTime: '14:00', endTime: '15:30', description: 'Tutorial', location: 'Room 202' },
      ],
    },
    [CalendarType.PERSONAL]: {
      '2025-04-05': [
        { id: '3', title: 'Gym', startTime: '18:00', endTime: '19:00', description: 'Workout', location: 'Fitness Center' },
      ],
    },
    [CalendarType.WORK]: {
      '2025-04-07': [
        { id: '4', title: 'Meeting', startTime: '09:00', endTime: '10:00', description: 'Weekly Sync', location: 'Conference Room' },
      ],
    },
  };

  const mockDateSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    const { getByTestId } = render(
      <CalendarView
        events={mockEvents}
        selectedDate="2025-04-05"
        onDateSelect={mockDateSelect}
      />
    );

    expect(getByTestId('mock-calendar')).toBeTruthy();
  });

  test('displays loading state correctly', () => {
    const { getByText } = render(
      <CalendarView
        events={mockEvents}
        selectedDate="2025-04-05"
        onDateSelect={mockDateSelect}
        isLoading={true}
      />
    );

    expect(getByText('Loading calendar...')).toBeTruthy();
  });

  test('displays error state correctly', () => {
    const errorMessage = 'Network error';
    const { getByText } = render(
      <CalendarView
        events={mockEvents}
        selectedDate="2025-04-05"
        onDateSelect={mockDateSelect}
        error={new Error(errorMessage)}
      />
    );

    expect(getByText(`Failed to load calendar: ${errorMessage}`)).toBeTruthy();
  });

  test('renders calendar toggle buttons', () => {
    const { getByText } = render(
      <CalendarView
        events={mockEvents}
        selectedDate="2025-04-05"
        onDateSelect={mockDateSelect}
      />
    );

    expect(getByText('Courses')).toBeTruthy();
    expect(getByText('Personal')).toBeTruthy();
    expect(getByText('Work')).toBeTruthy();
  });

  test('calendar toggle changes active calendar', () => {
    const { getByText } = render(
      <CalendarView
        events={mockEvents}
        selectedDate="2025-04-05"
        onDateSelect={mockDateSelect}
      />
    );

    // Default is Courses
    const personalToggle = getByText('Personal');
    fireEvent.press(personalToggle);
    
    // Test internal state change via re-render behavior
    // We can't directly test the state change, but we can test that the component
    expect(Calendar).toHaveBeenCalledTimes(2); // Initial render + after toggle
  });

  test('calls onDateSelect when a day is pressed', () => {
    const { getByTestId } = render(
      <CalendarView
        events={mockEvents}
        selectedDate="2025-04-05"
        onDateSelect={mockDateSelect}
      />
    );

    const dayPress = getByTestId('day-press');
    fireEvent.press(dayPress);

    expect(mockDateSelect).toHaveBeenCalledWith('2025-04-10');
  });

  test('handles errors gracefully when processing events', () => {
    const brokenEvents = null; // This will cause an error when trying to process events
    
    // This should not throw an error, but handle it gracefully
    const { getByTestId } = render(
      <CalendarView
        events={brokenEvents}
        selectedDate="2025-04-05"
        onDateSelect={mockDateSelect}
      />
    );

    expect(getByTestId('mock-calendar')).toBeTruthy();
  });
});