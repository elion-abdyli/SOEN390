import { EventsType } from "@/types/eventTypes";
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { MarkedDates } from "react-native-calendars/src/types";
import { Styles, toggleStyles } from "@/Styles/CalendarStyles";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import axios from "axios";
import EventList from "./EventList";


interface CalendarData {
  id: string;
  name: string;
}



const fetchEvents = async (calendarId: string, date: string): Promise<Event[] | undefined> => {
  console.log(calendarId);
  try {
    const { accessToken } = await GoogleSignin.getTokens();
    
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1); // Get events for that day only

    const eventsResponse = await axios.get(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        },
      }
    );

    console.log('Events Response:', eventsResponse.data.items);  // Log the response to debug


    const events = eventsResponse.data.items.map((event: any) => ({
      id: event.id,
      title: event.summary,
      time: event.start.dateTime || event.start.date, // Adjust according to event's time format
      description: event.description || 'No description available.',
    }));

    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    return;
  }
};


const CalendarFetching = async (): Promise<CalendarData[] | undefined> => {
  try {
    const { accessToken } = await GoogleSignin.getTokens();

    const calendarResponse = await axios.get(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const calendars = calendarResponse.data.items;

    if (!calendars || calendars.length === 0) {
      console.log('No calendars found.');
      return;
    }

    // Only return name and id of calendars
    const calendarData: CalendarData[] = calendars.map((calendar: any) => ({
      id: calendar.id,
      name: calendar.summary,
    }));

    return calendarData;
  } catch (error) {
    console.error('Error fetching calendars:', error);
    return;
  }
};



// Extended props interface to include calendar types
interface CalendarViewProps {
  events: any; // Assuming a structure for events, update based on your actual event types
  selectedDate: string;
  onDateSelect: (date: string) => void;
  isLoading?: boolean;
  error?: Error | null;
}


const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  selectedDate,
  onDateSelect,
  isLoading = false,
  error = null
}) => {
  const [markedDates, setMarkedDates] = useState({});
  const [activeCalendar, setActiveCalendar] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<CalendarData[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<Event[]>([]); // State for holding events

  useEffect(() => {
    const fetchCalendars = async () => {
      const calendarData = await CalendarFetching();
      if (calendarData) {
        setCalendars(calendarData);
        setActiveCalendar(calendarData[0]?.id || null); // Default to first calendar
      }
    };

    fetchCalendars();
  }, []);

  useEffect(() => {
    if (activeCalendar && selectedDate) {
      const fetchEventsForDate = async () => {
        const events = await fetchEvents(activeCalendar, selectedDate);
        if (events) {
          setCalendarEvents(events);
        }
      };

      fetchEventsForDate();
    }
  }, [activeCalendar, selectedDate]);

  const handleDayPress = (day: DateData): void => {
    try {
      onDateSelect(day.dateString);
    } catch (err) {
      console.error('Error handling day press:', err);
    }
  };

  const handleCalendarToggle = (calendarId: string) => {
    setActiveCalendar(calendarId);
  };

  const renderCalendarToggles = () => {
    return (
      <View style={toggleStyles.toggleContainer}>
        {calendars.map((calendar) => (
          <TouchableOpacity
            key={calendar.id}
            style={[
              toggleStyles.toggleButton,
              activeCalendar === calendar.id && {
                backgroundColor: '#2E66E7',
                borderColor: '#2E66E7',
              },
            ]}
            onPress={() => handleCalendarToggle(calendar.id)}
          >
            <Text
              style={[
                toggleStyles.toggleText,
                activeCalendar === calendar.id && toggleStyles.activeToggleText,
              ]}
            >
              {calendar.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (error) {
    return (
      <View style={Styles.errorContainer}>
        <Text style={Styles.errorText}>
          Failed to load calendar: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <View style={Styles.container}>
      {/* Calendar type toggle buttons */}
      {renderCalendarToggles()}

      {isLoading ? (
        <View style={Styles.loadingContainer}>
          <Text>Loading calendar...</Text>
        </View>
      ) : (
        <>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={markedDates}
            theme={{
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#b6c1cd',
              selectedDayBackgroundColor: '#2E66E7',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#2E66E7',
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              dotColor: '#2E66E7',
              selectedDotColor: '#ffffff',
              arrowColor: '#2E66E7',
              monthTextColor: '#2d4150',
              indicatorColor: '#2E66E7',
            }}
            enableSwipeMonths={true}
          />
          <EventList
            date={selectedDate}
            events={calendarEvents}
            isLoading={false} // Add loading logic here if needed
            error={null} // Add error handling if needed
          />
        </>
      )}
    </View>
  );
};


export default CalendarView;




