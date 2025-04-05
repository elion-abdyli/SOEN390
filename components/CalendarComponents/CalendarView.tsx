
import { EventsType } from "@/types/eventTypes";
import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { MarkedDates } from "react-native-calendars/src/types";
import { Styles } from "@/Styles/CalendarStyles";

interface CalendarViewProps {
  events: EventsType;
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
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});

  // Update marked dates when events or selected date changes
  useEffect(() => {
    try {
      const marked: MarkedDates = {};
      
      // Mark dates that have events
      Object.keys(events).forEach(date => {
        marked[date] = {
          marked: true,
          dotColor: '#2E66E7'
        };
      });
      
      // Mark the selected date
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#2E66E7'
      };
      
      setMarkedDates(marked);
    } catch (err) {
      console.error('Error setting marked dates:', err);
    }
  }, [events, selectedDate]);

  const handleDayPress = (day: DateData): void => {
    try {
      onDateSelect(day.dateString);
    } catch (err) {
      console.error('Error handling day press:', err);
    }
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
      )}
    </View>
  );
};



export default CalendarView;