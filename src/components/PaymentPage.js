import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDatabase, ref, set, get, push } from 'firebase/database';
import axios from 'axios';
import './PaymentPage.css';
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';
import ReceiptUploadModal from './ReceiptUploadModal';

const API_URL = process.env.REACT_APP_FIREBASE_DATABASE_URL;

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedSeats = [], totalPrice = 0 } = location.state || {};
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (selectedSeats.length > 0) {
      const timer = setTimeout(() => {
        navigate('/');  // Navigate back to seat selection
        alert("Seat selection timeout. Please select seats again.");
      }, 600000); // 10 minutes in milliseconds
      
      return () => clearTimeout(timer);
    }
  }, [selectedSeats, navigate]);

  const handlePaymentClick = () => {
    console.log('Opening modal');
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    navigate('/');
  };

  const handleReceiptSubmit = async ({ studentNumber, receipt }) => {
    console.log('Starting handleReceiptSubmit');
  
    try {
      const db = getDatabase();
      const seatsRef = ref(db, 'seats');
      
      // Get current seats data
      const snapshot = await get(seatsRef);
      if (!snapshot.exists()) {
        throw new Error("Seats data not found");
      }
      const currentSeats = snapshot.val();

      // Update seats status
      const updatedSeats = { ...currentSeats };
      selectedSeats.forEach(seatId => {
        const [row, col] = seatId.split('-');
        if (updatedSeats[row] && updatedSeats[row][col]) {
          updatedSeats[row][col].status = 'booked';
        }
      });

      // Save the updated seats data
      await set(seatsRef, updatedSeats);

      // Save the booking information
      const bookingsRef = ref(db, 'bookings');
      const newBookingRef = push(bookingsRef);
      await set(newBookingRef, {
        seats: selectedSeats,
        studentNumber,
        receipt,
        paymentStatus: 'pending',
        timestamp: Date.now()
      });

      console.log('Updated seats and saved booking');

      setPaymentSuccess(true);
      setShowModal(false);
      setTimeout(() => {
        navigate('/');
      }, 15000);
    } catch (error) {
      alert('Payment submission failed. Please try again.');
      console.error('Error in handleReceiptSubmit:', error);
    }
  };

  if (!selectedSeats || selectedSeats.length === 0) {
    navigate('/');
    return null;
  }

  return (
    <div className="payment-page">
      <h1>Payment Page</h1>
      <div className="payment-summary">
        <h2>Booking Summary</h2>
        <p><strong>Total Amount:</strong> ₱{totalPrice}</p>
        <p><strong>Seats You Booked:</strong> {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'No seats selected'}</p>
      </div>

      <div className="payment-method">
        <h2>Choose Your Payment Method</h2>
        <div className="gcash-option">
          <img src="https://upload.wikimedia.org/wikipedia/en/c/cc/GCash_logo.png" alt="GCash" className="gcash-logo" />
          <button className="pay-btn" onClick={handlePaymentClick}>
            Pay with GCash
          </button>
        </div>
      </div>

      <div className="payment-instructions">
        <h3>How to Pay with GCash</h3>
        <p>1. Open your GCash app on your mobile phone.</p>
        <p>2. Go to the "Send Cash" section.</p>
        <p>3. Enter the details provided below.</p>
        <p>4. Confirm your payment.</p>
        <p><strong>Amount: ₱{totalPrice}</strong></p>
        <p><strong>Account Name: Alaina Marie D.</strong></p>
        <p><strong>GCash Number: 0977 140 3317 </strong></p>
        <p>5. After payment, click the "Pay with GCash" button to upload your receipt.</p>
      </div>

      {paymentSuccess && (
        <div className="payment-confirmation">
          <h2>Payment Submitted Successfully!</h2>
          <p>Thank you for booking with us! Your payment is being verified, 
            and we will email your ticket once the verification is complete.</p>
        </div>
      )}

      <ReceiptUploadModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSubmit={handleReceiptSubmit}
        totalAmount={totalPrice}
        selectedSeats={selectedSeats}
      />
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

export default PaymentPage;
