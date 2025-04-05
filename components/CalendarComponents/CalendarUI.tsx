import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, Button } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';

const CalendarEventsScreen = () => {
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [events, setEvents] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        // Ensure the user is signed in
        const userInfo = await GoogleSignin.signIn();
        const { accessToken } = await GoogleSignin.getTokens();

        // Fetch the list of calendars
        const calendarResponse = await axios.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setCalendars(calendarResponse.data.items);
      } catch (error) {
        console.error('Error fetching calendars:', error);
      }
    };

    fetchCalendars();
  }, []);

  const fetchEvents = async (calendarId) => {
    try {
      const { accessToken } = await GoogleSignin.getTokens();

      // Fetch events for the selected calendar
      const response = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          timeMin: new Date().toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        },
      });

      setEvents(response.data.items);
      setModalVisible(true); // Show the modal with events
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const renderCalendarItem = ({ item }) => (
    <TouchableOpacity onPress={() => fetchEvents(item.id)}>
      <View style={{ padding: 10, borderBottomWidth: 1 }}>
        <Text>{item.summary}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEventItem = ({ item }) => (
    
    <View>
      <Text>{item.summary}</Text>
      <Text>{new Date(item.start.dateTime).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Select a Calendar</Text>

      {/* Calendar List */}
      <FlatList
        data={calendars}
        renderItem={renderCalendarItem}
        keyExtractor={(item) => item.id}
      />

      {/* Modal to show events */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Events in {selectedCalendar?.summary}</Text>
          <FlatList
            data={events}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.id}
          />
          <Button title="Close" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
};

export default CalendarEventsScreen;
