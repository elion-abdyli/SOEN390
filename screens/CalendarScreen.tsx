import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import CalendarView from '@/components/CalendarComponents/CalendarView';
import EventList from '@/components/CalendarComponents/EventList';
import { getEvents, getTodayString } from '../services/eventService';
import { EventsType, Event } from '../types/eventTypes';
import NetInfo from '@react-native-community/netinfo';
import {CalendarScreemStyles} from '@/Styles/CalendarStyles';

// Define the calendar type enum
enum CalendarType {
  COURSES = 'Courses',
  PERSONAL = 'Personal',
  WORK = 'Work',
}

const CalendarScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [events, setEvents] = useState<{[key in CalendarType]?: EventsType}>({});
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [activeCalendar, setActiveCalendar] = useState<CalendarType>(CalendarType.COURSES);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Load all events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch events for each calendar type
      // In a real app, you would modify your getEvents function to support different calendar types
      const coursesEvents = await getEvents('courses');
      const personalEvents = await getEvents('personal');
      const workEvents = await getEvents('work');
      
      setEvents({
        [CalendarType.COURSES]: coursesEvents,
        [CalendarType.PERSONAL]: personalEvents,
        [CalendarType.WORK]: workEvents
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update selected day events when date or active calendar changes
  useEffect(() => {
    try {
      const currentCalendarEvents = events[activeCalendar] || {};
      const dayEvents = currentCalendarEvents[selectedDate] || [];
      setSelectedDateEvents(dayEvents);
    } catch (err) {
      console.error('Error updating selected date events:', err);
      setSelectedDateEvents([]);
    }
  }, [selectedDate, events, activeCalendar]);

  // Handle date selection
  const handleDateSelect = useCallback((date: string) => {
    try {
      setSelectedDate(date);
    } catch (err) {
      console.error('Error selecting date:', err);
    }
  }, []);

  // Retry loading events
  const handleRetry = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <SafeAreaView style={CalendarScreemStyles.container}>
      {/* Calendar section - top half */}
      <View style={CalendarScreemStyles.calendarContainer}>
        <CalendarView 
          events={events}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          isLoading={isLoading && !isOffline}
          error={isOffline ? new Error('You are offline. Please check your connection.') : error}
        />
      </View>

      {/* Events section - bottom half */}
      <View style={CalendarScreemStyles.eventsContainer}>
        <EventList 
          date={selectedDate}
          events={selectedDateEvents}
          isLoading={isLoading && !isOffline && selectedDate !== getTodayString()}
          error={isOffline ? new Error('You are offline. Please check your connection.') : error}
        />
      </View>
    </SafeAreaView>
  );
};

const { height } = Dimensions.get('window');


export default CalendarScreen;