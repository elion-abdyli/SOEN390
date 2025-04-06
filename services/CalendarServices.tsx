import { GoogleSignin } from "@react-native-google-signin/google-signin";
import axios from "axios";





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
      return { calendars: [], eventsByCalendar: {} };
    }

    console.log('Available calendars:');
    calendars.forEach((calendar, index) => {
      console.log(`${index + 1}: ${calendar.summary}`);
    });

    const eventsByCalendar: {
      [calendarSummary: string]: { [date: string]: any[] };
    } = {};

    // Fetch events for each calendar
      const res = await axios.get(
        `https://www.googleapis.com/calendar/v3/calendars/${calendars[1].id}/events`,
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

      const grouped = groupEventsByDate(res.data.items || []);
      console.log(grouped);
      eventsByCalendar[calendars[1].summary] = grouped;
    

    return {
      calendars: calendars.map((c: any) => ({ id: c.id, summary: c.summary })),
      eventsByCalendar,
    };
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return { calendars: [], eventsByCalendar: {} };
  }
};