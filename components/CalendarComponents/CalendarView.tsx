import { EventsType } from "@/types/eventTypes";
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { MarkedDates } from "react-native-calendars/src/types";
import { Styles, toggleStyles } from "@/Styles/CalendarStyles";


// Define the calendar type enum
enum CalendarType {
  COURSES = 'Courses',
  PERSONAL = 'Personal',
  WORK = 'Work',
}

// Extended props interface to include calendar types
interface CalendarViewProps {
  events: {
    [key in CalendarType]?: EventsType;
  };
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
  // State for marked dates on the calendar
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  
  // State for active calendar type
  const [activeCalendar, setActiveCalendar] = useState<CalendarType>(CalendarType.COURSES);
  
  // Get the events for the currently active calendar
  const currentEvents = events[activeCalendar] || {};

  // Update marked dates when events, selected date, or active calendar changes
  useEffect(() => {
    try {
      const marked: MarkedDates = {};
      
      // Mark dates that have events in the current calendar
      Object.keys(currentEvents).forEach(date => {
        marked[date] = {
          marked: true,
          dotColor: getCalendarColor(activeCalendar)
        };
      });
      
      // Mark the selected date
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: getCalendarColor(activeCalendar)
      };
      
      setMarkedDates(marked);
    } catch (err) {
      console.error('Error setting marked dates:', err);
    }
  }, [currentEvents, selectedDate, activeCalendar]);

  // Helper function to get color based on calendar type
  const getCalendarColor = (type: CalendarType): string => {
    switch (type) {
      case CalendarType.COURSES:
        return '#2E66E7'; // Blue
      case CalendarType.PERSONAL:
        return '#E91E63'; // Pink
      case CalendarType.WORK:
        return '#4CAF50'; // Green
      default:
        return '#2E66E7';
    }
  };

  const handleDayPress = (day: DateData): void => {
    try {
      onDateSelect(day.dateString);
    } catch (err) {
      console.error('Error handling day press:', err);
    }
  };

  // Toggle between different calendar types
  const handleCalendarToggle = (type: CalendarType) => {
    setActiveCalendar(type);
  };

  // Render calendar type toggles
  const renderCalendarToggles = () => {
    return (
      <View style={toggleStyles.toggleContainer}>
        {Object.values(CalendarType).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              toggleStyles.toggleButton,
              activeCalendar === type && { 
                backgroundColor: getCalendarColor(type),
                borderColor: getCalendarColor(type),
              }
            ]}
            onPress={() => handleCalendarToggle(type)}
          >
            <Text
              style={[
                toggleStyles.toggleText,
                activeCalendar === type && toggleStyles.activeToggleText
              ]}
            >
              {type}
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
        <Calendar
          onDayPress={handleDayPress}
          markedDates={markedDates}
          theme={{
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: getCalendarColor(activeCalendar),
            selectedDayTextColor: '#ffffff',
            todayTextColor: getCalendarColor(activeCalendar),
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: getCalendarColor(activeCalendar),
            selectedDotColor: '#ffffff',
            arrowColor: getCalendarColor(activeCalendar),
            monthTextColor: '#2d4150',
            indicatorColor: getCalendarColor(activeCalendar),
          }}
          enableSwipeMonths={true}
        />
      )}
    </View>
  );
};


export default CalendarView;