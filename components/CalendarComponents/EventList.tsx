
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card } from 'react-native-paper';
import { EventListStyles } from '@/Styles/CalendarStyles';

export interface CalendarEventInterface {
  description: string;
  id: string;
  time: string;
  title: string;
}

interface EventListProps {
  date: string;
  events: CalendarEventInterface[];
  isLoading?: boolean;
  error?: Error | null;
}

const EventList: React.FC<EventListProps> = ({ 
  date, 
  events, 
  isLoading = false,
  error = null
}) => {

useEffect(()=>{
console.log("this is console log" , events)
},[events])


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
  const EventCard: React.FC<{ event }> = ({ event }) => (

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
      {console.log(events.length > 0)}
      <ScrollView style={EventListStyles.eventsScrollView}>
        {console.log(events)}
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