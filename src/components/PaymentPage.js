import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PaymentPage.css';
import ReceiptUploadModal from './ReceiptUploadModal';

const API_URL = process.env.REACT_APP_API_URL || 'https://psoc-2.onrender.com/api/';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedSeats = [] } = location.state || {};
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const totalAmount = selectedSeats.length * 50;

  const handlePaymentClick = () => {
    console.log('Opening modal');
    setShowModal(true);
  };

  const handleModalClose = () => {
    console.log('Closing modal');
    setShowModal(false);
  };

  const handleReceiptSubmit = async ({ studentNumber, receipt }) => {
    try {
      const formData = new FormData();
      formData.append('seats', JSON.stringify(selectedSeats));
      formData.append('studentNumber', studentNumber);
      formData.append('receipt', receipt);
      formData.append('paymentStatus', 'pending');

      await axios.post(`${API_URL}/seats/confirm`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setPaymentSuccess(true);
      setShowModal(false);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      alert('Payment submission failed. Please try again.');
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (selectedSeats.length === 0) {
      alert('No seats selected!');
    }
  }, [selectedSeats]);

  return (
    <div className="payment-page">
      <h1>Payment Page</h1>
      <div className="payment-summary">
        <h2>Booking Summary</h2>
        <p><strong>Total Amount:</strong> ₱{totalAmount}</p>
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
        <p><strong>Amount: ₱{totalAmount}</strong></p>
        <p><strong>Account Name: ED**N J* S</strong></p>
        <p><strong>GCash Number: 0995 225 6413</strong></p>
        <p>5. After payment, click the "Pay with GCash" button to upload your receipt.</p>
      </div>

      {paymentSuccess && (
        <div className="payment-confirmation">
          <h2>Payment Submitted Successfully!</h2>
          <p>Thank you for booking with us. Your payment is being verified.</p>
        </div>
      )}

      <ReceiptUploadModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSubmit={handleReceiptSubmit}
        totalAmount={totalAmount}
        selectedSeats={selectedSeats}
      />
    </div>
  );
};

export default PaymentPage;
