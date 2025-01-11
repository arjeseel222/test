import { database } from '../src/firebase/firebase';
import { ref, set } from 'firebase/database';

const initialSeats = [
  ["available", "available", "available", "available", "gap", "gap", "gap", "gap", "gap", "gap", "gap", "gap", "gap", "available", "available", "available", "available"],
  ...Array(20).fill().map(() => [
    "available", "available", "available", "available", 
    "available", 
    "available", "available", "available", "gap", 
    "available", "available", "available", "available", 
    "available", "available", "available", "available"
  ])
];

const initializeSeats = async () => {
  try {
    const seatsRef = ref(database, 'seats');
    await set(seatsRef, initialSeats);
    console.log('Seats initialized successfully');
  } catch (error) {
    console.error('Error initializing seats:', error);
  }
};

initializeSeats();