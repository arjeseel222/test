import React, { useState, useEffect } from "react";
import { database } from '../firebase/firebase';
import { ref, onValue, set, get, push } from 'firebase/database';
import { X } from "lucide-react";
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';
import './MovieSeatSelector.css';

const MovieSeatSelector = () => {
  const rowLabels = ['0', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
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

  const [seats, setSeats] = useState(initialSeats);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const maxSeats = 15;
  const seatPrice = 50;

  const totalPrice = selectedSeats.length * seatPrice;

  const isValidSeatData = (data) => {
    if (!Array.isArray(data)) return false;
    
    return data.every(row => 
      Array.isArray(row) && 
      row.every(seat => 
        typeof seat === 'string' && 
        ['available', 'selected', 'booked', 'gap', 'walkway'].includes(seat)
      )
    );
  };

  const getSeatLabel = (seatId) => {
    const rowLabel = seatId[0];
    const seatNumber = seatId.slice(1);
    return `Seat ${rowLabel}${seatNumber}`;
  };

  const handleSeatClick = (rowIndex, colIndex) => {
    const seatId = `${rowLabels[rowIndex]}${colIndex + 1}`;

    if (seats[rowIndex][colIndex] === "walkway" || 
        seats[rowIndex][colIndex] === "gap" || 
        seats[rowIndex][colIndex] === "booked") return;

    setSeats(prevSeats => {
      const updatedSeats = prevSeats.map(row => [...row]);
      
      if (updatedSeats[rowIndex][colIndex] === "available") {
        if (selectedSeats.length < maxSeats) {
          updatedSeats[rowIndex][colIndex] = "selected";
          setSelectedSeats(prev => {
            if (!prev.includes(seatId)) {
              return [...prev, seatId];
            }
            return prev;
          });
        } else {
          alert("You can only select up to 5 seats.");
          return prevSeats;
        }
      } else if (updatedSeats[rowIndex][colIndex] === "selected") {
        updatedSeats[rowIndex][colIndex] = "available";
        setSelectedSeats(prev => prev.filter(seat => seat !== seatId));
      }

      return updatedSeats;
    });
  };

  const handleConfirmBooking = async () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }

    try {
      const seatsRef = ref(database, 'seats');
      const snapshot = await get(seatsRef);

      if (!snapshot.exists()) {
        throw new Error("Seats data not found");
      }

      const currentSeats = snapshot.val();
      const updatedSeats = JSON.parse(JSON.stringify(currentSeats)); // Deep copy

      // Verify selected seats are still available and book them
      for (const seatId of selectedSeats) {
        const rowLetter = seatId[0];
        const colIndex = parseInt(seatId.slice(1)) - 1;
        const rowIndex = rowLabels.indexOf(rowLetter);

        if (rowIndex === -1 || !updatedSeats[rowIndex]) {
          throw new Error(`Invalid seat: ${seatId}`);
        }

        if (updatedSeats[rowIndex][colIndex] !== "available" && updatedSeats[rowIndex][colIndex] !== "selected") {
          alert("Some seats have been booked by another user. Please select different seats.");
          setSelectedSeats([]);
          return;
        }

        updatedSeats[rowIndex][colIndex] = "booked"; // Book the seat
      }

      // Save the updated seats data
      await set(seatsRef, updatedSeats);

      // Optionally, you can save the booking information in a separate node
      const bookingsRef = ref(database, 'bookings');
      const newBookingRef = push(bookingsRef);
      await set(newBookingRef, {
        seats: selectedSeats,
        timestamp: Date.now(),
        status: 'booked'
      });

      alert("Booking successful! Your seats have been reserved.");
      setSelectedSeats([]); // Clear selected seats after booking

    } catch (error) {
      console.error("Error confirming booking:", error);
      alert("There was an error confirming your booking. Please try again.");
    }
  };

  useEffect(() => {
    const seatsRef = ref(database, 'seats');
    
    const initializeSeats = async () => {
      try {
        const snapshot = await get(seatsRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          if (isValidSeatData(data)) {
            setSeats(data);
          } else {
            await set(seatsRef, initialSeats);
            setSeats(initialSeats);
          }
        } else {
          await set(seatsRef, initialSeats);
          setSeats(initialSeats);
        }
        
        setError(null);
      } catch (error) {
        console.error('Error in initializeSeats:', error);
        setError('Failed to load seats. Please refresh the page.');
        setSeats(initialSeats); // Fallback to initial seats
      } finally {
        setIsLoading(false);
      }
    };

    const handleRealtimeUpdate = (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (isValidSeatData(data)) {
          setSeats(data);
          setSelectedSeats([]); // Clear selections when seats update
        } else {
          setError('Invalid data received. Please refresh the page.');
        }
      }
    };

    initializeSeats();
    const unsubscribe = onValue(seatsRef, handleRealtimeUpdate);

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="loading">
        <p>Loading seats...</p>
        <p className="text-sm text-gray-500">Please wait while we fetch the latest seat information.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (  
    <div className="seat-selector">
      <h1>Select Your Seats</h1>
      <h2>ATTENTION: Mr. and Ms. Psychology has been moved from January 25 to February 5, 2025.</h2>
      <div className="screen">Stage</div>
      <div className="seats">
        {seats.map((row, rowIndex) => (
          <div className="seat-row" key={rowIndex}>
            <div className="row-label">{rowLabels[rowIndex]}</div>
            {row.slice(0, 8).map((seat, colIndex) => (
              <div
                key={colIndex}
                className={`seat ${seat}`}
                onClick={() => handleSeatClick(rowIndex, colIndex)}
              >
                {seat === "selected" && <X />}
              </div>
            ))}

            {row[8] === "gap" ? (
              <div className="seat gap"></div>
            ) : (
              <div className="seat walkway"></div>
            )}

            {row.slice(9).map((seat, colIndex) => (
              <div
                key={colIndex + 9}
                className={`seat ${seat}`}
                onClick={() => handleSeatClick(rowIndex, colIndex + 9)}
              >
                {seat === "selected" && <X />}
              </div>
            ))}
            
            <div className="row-label">{rowLabels[rowIndex]}</div>
          </div>
        ))}
      </div>
      
      <div className="seat-status">
        <button className="status available">Available</button>
        <button className="status selected">Selected</button>
        <button className="status booked">Booked</button>
      </div>
      
      <div className="total-price">
        <h3>Total: ₱{totalPrice}</h3>
      </div>
      
      {selectedSeats.length > 0 && (
        <button className="checkout" onClick={handleConfirmBooking}>
          Confirm Booking
        </button>
      )}
        
      {selectedSeats.length > 0 && (
        <div className="selected-seats">
          <h4>Selected Seats:</h4>
          <ul>
            {[...new Set(selectedSeats)].map(seatId => (
              <li key={seatId}>{getSeatLabel(seatId)}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="social-media">
        <p>If you have any issues or concerns, you may reach us through our social media accounts.</p>
        <div className="social-icons">
          <a 
            href="https://www.facebook.com/OLFUpsychsoc/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="facebook"
          >
            <FaFacebook />
          </a>
          <a 
            href="https://www.instagram.com/psychsoc_olfuqc/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="instagram"
          >
            <FaInstagram />
          </a>
          <a 
            href="https://twitter.com/PsychSoc_OLFUQC" 
            target="_blank" 
            rel="noopener noreferrer"
            className="twitter"
          >
            <FaTwitter />
          </a>
        </div>
      </div>
    </div>
  );
};

export default MovieSeatSelector;
