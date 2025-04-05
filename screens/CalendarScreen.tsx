
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import CalendarView from '@/components/CalendarComponents/CalendarView';
import EventList from '@/components/CalendarComponents/EventList';
import { getEvents, getTodayString } from '../services/eventService';
import { EventsType, Event } from '../types/eventTypes';
import NetInfo from '@react-native-community/netinfo';

const CalendarScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [events, setEvents] = useState<EventsType>({});
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);

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
      const allEvents = await getEvents();
      setEvents(allEvents);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update selected day events when date changes
  useEffect(() => {
    try {
      const dayEvents = events[selectedDate] || [];
      setSelectedDateEvents(dayEvents);
    } catch (err) {
      console.error('Error updating selected date events:', err);
      setSelectedDateEvents([]);
    }
  }, [selectedDate, events]);

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
    <SafeAreaView style={styles.container}>
      {/* Calendar section - top half */}
      <View style={styles.calendarContainer}>
        <CalendarView 
          events={events}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          isLoading={isLoading && !isOffline}
          error={isOffline ? new Error('You are offline. Please check your connection.') : error}
        />
      </View>

      {/* Events section - bottom half */}
      <View style={styles.eventsContainer}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  calendarContainer: {
    height: height * 0.5,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  eventsContainer: {
    flex: 1,
  },
});

export default CalendarScreen;