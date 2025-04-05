
import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card } from 'react-native-paper';
import { EventListStyles } from '@/Styles/CalendarStyles';

interface Event {
  id: string;
  title: string;
  time: string;
  description: string;
}

interface EventListProps {
  date: string;
  events: Event[];
  isLoading?: boolean;
  error?: Error | null;
}

const EventList: React.FC<EventListProps> = ({ 
  date, 
  events, 
  isLoading = false,
  error = null
}) => {
  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return dateString; 
    }
  };

  // Event card component
  const EventCard: React.FC<{ event: Event }> = ({ event }) => (
    <Card style={EventListStyles.card} mode="outlined">
      <Card.Content>
        <Text style={EventListStyles.eventTitle}>{event.title}</Text>
        <Text style={EventListStyles.eventTime}>{event.time}</Text>
        <Text style={EventListStyles.eventDescription}>{event.description}</Text>
      </Card.Content>
    </Card>
  );

  if (error) {
    return (
      <View style={EventListStyles.centeredContainer}>
        <Text style={EventListStyles.errorText}>Failed to load events: {error.message}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={EventListStyles.centeredContainer}>
        <ActivityIndicator size="large" color="#2E66E7" />
        <Text style={EventListStyles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={EventListStyles.container}>
      <Text style={EventListStyles.dateHeader}>
        Events for {formatDate(date)}
      </Text>
      
      <ScrollView style={EventListStyles.eventsScrollView}>
        {events.length > 0 ? (
          events.map(event => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <Text style={EventListStyles.noEventsText}>No events scheduled for this day</Text>
        )}
      </ScrollView>
    </View>
  );
};



export default EventList;