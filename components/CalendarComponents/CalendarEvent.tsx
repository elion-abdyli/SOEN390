import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';




export const getCalendarEvents = async () => {
  try {
    // Ensure the user is signed in
    const {accessToken} = await GoogleSignin.getTokens(); 
  

    // Make an authenticated request to the Google Calendar API
    const calendarResponse  = await axios.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const calendars = calendarResponse.data.items;
    if (!calendars || calendars.length === 0) {
      console.log('No calendars found.');
      return;
    }

    console.log('Available calendars:');
    calendars.forEach((calendar, index) => {
      console.log(`${index + 1}: ${calendar.summary}`);
    });

    // Prompt the user to select a calendar (for now, we'll assume the user selects the first calendar)
    const selectedCalendar = calendars[1]; // You can replace this with actual user input in the UI

    // Now fetch the events for the selected calendar
    const response = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/${selectedCalendar.id}/events`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        timeMin: new Date().toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      },
    });


    if (response.data.items && response.data.items.length > 0) {
      console.log('Courses Calendar Events:', response.data.items);
    } else {
      console.log('No events found in the "courses" calendar.');
    }
  } catch (error) {
    console.error('Error fetching calendar events:', error);
  }
};
