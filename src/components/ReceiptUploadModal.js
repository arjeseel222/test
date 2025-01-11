import React, { useState, useEffect } from 'react';
import { AlertCircle, Upload, Loader } from 'lucide-react';
import { getDatabase, ref, push, set, get } from 'firebase/database';
import { database } from '../firebase/firebase';
import './ReceiptUploadModal.css';

const ReceiptUploadModal = ({ isOpen, onClose, onSubmit, totalAmount, selectedSeats = [] }) => {
  const [studentNumber, setStudentNumber] = useState('');
  const [name, setName] = useState('');
  const [gsuiteEmail, setGsuiteEmail] = useState(''); 
  const [receiptUrl, setReceiptUrl] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStudentNumber('');
      setName('');
      setGsuiteEmail('');
      setReceiptUrl('');
      setError('');
      setIsSubmitted(false);
    }
  }, [isOpen]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setReceiptUrl(data.secure_url);
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStudentNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 11) { // Only update if length <= 11
      setStudentNumber(value);
    }

  };
  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._-]+@student\.fatima\.edu\.ph$/;
    return regex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value.toLowerCase();
    setGsuiteEmail(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!studentNumber.trim() || studentNumber.length !== 11) {
      setError('Please enter a valid student number');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your G Suite email');
      return;
    }
    
    if (!validateEmail(gsuiteEmail)) {
      setError('Please enter a valid @student.fatima.edu.ph email address');
      return;
    }
  
    if (!receiptUrl) {
      setError('Please upload your receipt');
      return;
    }

  
    try {
      setIsSubmitting(true);
      setError('');
  
      console.log('Starting submission');
  
       // First verify and book the seats
       const seatsRef = ref(database, 'seats');
       const snapshot = await get(seatsRef);
   
       console.log('Got seats snapshot');
   
       if (!snapshot.exists()) {
         throw new Error("Seats data not found");
       }
   
       const currentSeats = snapshot.val();
       const updatedSeats = JSON.parse(JSON.stringify(currentSeats)); // Deep copy
   
       console.log('Updated seats');
  
      // Verify selected seats are still available
      for (const seatId of selectedSeats) {
        let rowIndex, colIndex;
  
        if (seatId[0] >= 'A' && seatId[0] <= 'Z') {
          rowIndex = seatId[0].charCodeAt(0) - 'A'.charCodeAt(0) + 1;
          colIndex = parseInt(seatId.slice(1)) - 1;
        } else {
          rowIndex = 0;
          colIndex = parseInt(seatId) - 1;
        }
        console.log(`Checking seat ${seatId}:`, {
          rowIndex,
          colIndex,
          status: updatedSeats[rowIndex][colIndex]
        });
  
        if (rowIndex < 0 || 
            rowIndex >= updatedSeats.length || 
            colIndex < 0 || 
            colIndex >= updatedSeats[rowIndex].length) {
          throw new Error(`Invalid seat index: ${seatId} (${rowIndex},${colIndex})`);
        }
  
        const currentStatus = updatedSeats[rowIndex][colIndex];
        if (currentStatus !== "available" && currentStatus !== "selected") {
          console.error(`Seat ${seatId} status:`, currentStatus);
          throw new Error(`Seat ${seatId} is no longer available (${currentStatus})`);
        }
  
        updatedSeats[rowIndex][colIndex] = "booked";
      }
  
  
      console.log('Verified seats');
  
      // Create booking entry
      const bookingRef = ref(database, 'bookings');
      const newBookingRef = push(bookingRef);
  
      console.log('Created booking ref');
  
      const bookingData = {
        studentNumber,
        name,
        gsuiteEmail,
        receipt: receiptUrl,
        seats: selectedSeats,
        amount: totalAmount,
        timestamp: Date.now(),
        status: 'pending'
      };
  
      console.log('Created booking data');
  
      // Save both the booking and update seats atomically
      await Promise.all([
        set(newBookingRef, bookingData),
        set(seatsRef, updatedSeats)
      ]);
  
      console.log('Saved booking and seats');
  
      await onSubmit({ studentNumber, name, gsuiteEmail, receipt: receiptUrl });
  
      console.log('Submitted booking');
  
      setIsSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
      setError(error.message || 'Failed to submit form. Please try again.');
    } finally {
      console.log('Finally block');
      setIsSubmitting(false); // Reset isSubmitting state
    }
  };

  return (
    isOpen && (
      <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-container">
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">
                {isSubmitted ? 'Thank You!' : 'Payment Details'}
              </h2>
            </div>

            {isSubmitted ? (
              <div className="thank-you-container text-center py-6">
                <h3 className="text-xl font-semibold text-green-600 mb-2">
                  Booking Successful!
                </h3>
                <p className="text-gray-600">
                  Thank you for your booking! Your seats have been reserved, we will email you the ticket.
                </p>
              </div>
            ) : (
              <>
                <div className="booking-summary">
                  <h2>Booking Summary</h2>
                  <div className="booking-details">
                    <p>Total Amount:</p>
                    <p>₱{totalAmount}</p>
                  </div>
                  <div className="booking-details">
                    <p>Selected Seats:</p>
                    <p>{selectedSeats.join(', ')}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="input-container">
                    <label htmlFor="name">Full Name</label>
                    <input
                      id="name"
                      placeholder="Fabian Villacarlos"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="input-container">
                    <label htmlFor="gsuiteEmail">GSuite Email</label>
                    <input
                      id="gsuiteEmail"
                      type="email"
                      placeholder="fhvillacarlos0368qc@student.fatima.edu.ph"
                      value={gsuiteEmail}
                      onChange={handleEmailChange}
                      pattern="[a-zA-Z0-9._-]+@student\.fatima\.edu\.ph"
                      title="Please enter a valid @student.fatima.edu.ph email"
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="input-container">
                    <label htmlFor="studentNumber">Student Number</label>
                    <input
                      id="studentNumber"
                      placeholder="022XXXXXXXXX"
                      value={studentNumber}
                      onChange={handleStudentNumberChange}
                      className="input-field"
                      pattern="[0-9]{11}"
                      maxLength="11"
                      title="Please enter 11 digits"
                      required
                    />
                  </div>

                  <div className="input-container">
                    <label>Payment Receipt</label>
                    <div className="upload-container">
                      <label className="flex flex-col items-center justify-center w-full cursor-pointer">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          PNG, JPG or JPEG (MAX. 5MB)
                        </p>
                        {receiptUrl && (
                          <img 
                            src={receiptUrl} 
                            alt="Receipt preview" 
                            className="mt-4 max-h-32 object-contain"
                          />
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="payment-info">
                    <p className="text-sm">Amount to pay: ₱{totalAmount}</p>
                    <p className="text-sm mt-2">GCash Number: 0995 225 6413</p>
                  </div>

                  {error && (
                    <div className="error-alert">
                      <AlertCircle className="h-4 w-4" />
                      <p>{error}</p>
                    </div>
                  )}

                  <div className="dialog-footer mt-4">
                    <button 
                      type="button" 
                      onClick={onClose}
                      className="button button-outline"
                      disabled={isUploading || isSubmitting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="button button-primary"
                      disabled={isUploading || isSubmitting}
                    >
                      {isUploading ? (
                        <>
                          <Loader className="animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : isSubmitting ? (
                        <>
                          <Loader className="animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        'Confirm Payment'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    )
  );
};

export default ReceiptUploadModal;