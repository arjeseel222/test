import React, { useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import './MovieSeatSelector.css';

const MovieSeatSelector = () => {
  const rowLabels = ['0', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
  const [seats, setSeats] = useState(
    [
      ["available", "available", "available", "available", "gap", "gap", "gap", "gap", "gap", "gap", "gap", "gap", "gap", "available", "available", "available", "available"],
      ...Array(20).fill().map(() => [
        "available", "available", "available", "available", 
        "available", 
        "available", "available", "available", "gap", 
        "available", "available", "available", "available", 
        "available", "available", "available", "available"
      ])
    ]
  );

  const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
  const [selectedSeats, setSelectedSeats] = useState([]);
  const maxSeats = 5;
  const seatPrice = 50;
  const navigate = useNavigate();

  const handleSeatClick = (rowIndex, colIndex) => {
    const updatedSeats = [...seats];

    if (!updatedSeats[rowIndex]) {
      console.error(`Row index ${rowIndex} is out of bounds`);
      return;
    }

    const rowLetter = rowLabels[rowIndex];
    const seatId = `${rowLetter}${colIndex + 1}`;

    if (updatedSeats[rowIndex][colIndex] === "walkway" || 
        updatedSeats[rowIndex][colIndex] === "gap" || 
        updatedSeats[rowIndex][colIndex] === "booked") return;

    if (updatedSeats[rowIndex][colIndex] === "available") {
      if (selectedSeats.length < maxSeats) {
        updatedSeats[rowIndex][colIndex] = "selected";
        setSelectedSeats([...selectedSeats, seatId]);
      } else {
        alert("You can only select up to 5 seats.");
      }
    } else if (updatedSeats[rowIndex][colIndex] === "selected") {
      updatedSeats[rowIndex][colIndex] = "available";
      setSelectedSeats(selectedSeats.filter(seat => seat !== seatId));
    }

    setSeats(updatedSeats);
  };

  const handleConfirmBooking = () => {
    const updatedSeats = [...seats];
    
    selectedSeats.forEach(seatId => {
      const rowLetter = seatId[0];
      const colIndex = parseInt(seatId.slice(1)) - 1;
      const rowIndex = rowLetters.indexOf(rowLetter);
      if (rowIndex >= 0 && updatedSeats[rowIndex]) {
        updatedSeats[rowIndex][colIndex] = "booked";
      }
    });
    
    setSeats(updatedSeats);
    setSelectedSeats([]);

    alert("Booking confirmed! You will be redirected to the payment page.");
    
    navigate('/payment', { state: { selectedSeats } });
  };

  const totalPrice = selectedSeats.length * seatPrice;

  const getSeatLabel = (seatId) => {
    const rowLabel = seatId[0];
    const seatNumber = seatId.slice(1);
    return `Seat ${rowLabel}${seatNumber}`;
  };

  return (
    <div className="seat-selector">
      <h1>Select Your Seats</h1>
      <div className="screen">Screen</div>
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
        <button className="checkout" onClick={handleConfirmBooking}>Confirm Booking</button>
      )}

      {selectedSeats.length > 0 && (
        <div className="selected-seats">
          <h4>Selected Seats:</h4>
          <ul>
            {selectedSeats.map(seatId => (
              <li key={seatId}>{getSeatLabel(seatId)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MovieSeatSelector;
