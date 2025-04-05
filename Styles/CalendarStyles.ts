import { StyleSheet } from 'react-native';


export const Styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2d4150',
  },
  eventsScrollView: {
    flex: 1,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2d4150',
  },
  eventTime: {
    fontSize: 14,
    color: '#2E66E7',
    marginBottom: 5,
  },
  eventDescription: {
    fontSize: 14,
    color: 'red',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
  },
  noEventsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    color: "red",
  },
});

export const EventListStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2d4150',
  },
  eventsScrollView: {
    flex: 1,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2d4150',
  },
  eventTime: {
    fontSize: 14,
    color: '#2E66E7',
    marginBottom: 5,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
  },
  noEventsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 30,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  }
});

export const toggleStyles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    minWidth: 90,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeToggleText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});