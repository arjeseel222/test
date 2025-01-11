import React, { useState, useEffect } from "react";
import { database } from '../firebase/firebase';
import { ref, onValue, set, get } from 'firebase/database';
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';
import './MovieSeatSelector.css';

const MovieSeatSelector = () => {
  // Constants and state declarations
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
  const maxSeats = 5;
  const seatPrice = 50;
  const navigate = useNavigate();

  // Calculate total price
  const totalPrice = selectedSeats.length * seatPrice;

  // Helper Functions
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

  // Event Handlers
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
      
      // Verify selected seats are still available
      for (const seatId of selectedSeats) {
        const rowLetter = seatId[0];
        const colIndex = parseInt(seatId.slice(1)) - 1;
        const rowIndex = rowLabels.indexOf(rowLetter);
        
        if (rowIndex === -1 || !currentSeats[rowIndex]) {
          throw new Error(`Invalid seat: ${seatId}`);
        }
  
        if (currentSeats[rowIndex][colIndex] !== "available" && 
            currentSeats[rowIndex][colIndex] !== "selected") {
          alert("Some seats have been booked by another user. Please select different seats.");
          setSelectedSeats([]);
          return;
        }
      }
  
      // Navigate to payment with the selected seats
      navigate('/payment', { 
        state: { 
          selectedSeats: [...new Set(selectedSeats)],
          totalPrice: selectedSeats.length * seatPrice,
          currentSeats: currentSeats // Pass the current seat state to PaymentPage
        }
      });
    } catch (error) {
      console.error("Error verifying seats:", error);
      alert("There was an error verifying your seats. Please try again.");
    }
  };

  // Firebase initialization and real-time updates
  useEffect(() => {
    const seatsRef = ref(database, 'seats');
    
    const initializeSeats = async () => {
      try {
        console.log('Fetching seats data...');
        const snapshot = await get(seatsRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log('Received data:', data);
          
          if (isValidSeatData(data)) {
            console.log('Valid seat data received, updating state');
            setSeats(data);
          } else {
            console.log('Invalid data format, reinitializing');
            await set(seatsRef, initialSeats);
            setSeats(initialSeats);
          }
        } else {
          console.log('No existing data, initializing with default seats');
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

  // Render loading and error states
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

  // Main render
  return (
    <div className="seat-selector">
      <h1>Select Your Seats</h1>
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