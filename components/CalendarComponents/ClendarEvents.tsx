import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';








const groupEventsByDate = (events: any[]) => {
  const grouped: { [date: string]: any[] } = {};

  events.forEach((event) => {
    const dateTime = event.start?.dateTime || event.start?.date;
    const date = new Date(dateTime).toISOString().split('T')[0];

    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(event);
  });

  return grouped;
};

export const getCalendarEvents = async (id : string) => {
  try {
    const { accessToken } = await GoogleSignin.getTokens();

    const res = await axios.get(
      `https://www.googleapis.com/calendar/v3/calendars/${id}/events`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          timeMin: new Date().toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        },
      }
    );

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return { calendars: [], eventsByCalendar: {} };
  }
};
