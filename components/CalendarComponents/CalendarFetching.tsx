import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';


export const getCalendarEvents = async () => {
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
    else {
    return calendars;}
  
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return;
  }
};
