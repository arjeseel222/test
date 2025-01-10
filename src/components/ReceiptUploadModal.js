import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogOverlay
} from "./ui/dialog";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertCircle, Upload } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import './ReceiptUploadModal.css';

const ReceiptUploadModal = ({ isOpen, onClose, onSubmit, totalAmount, selectedSeats = [] }) => {
  const [studentNumber, setStudentNumber] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      setReceipt(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const studentNumberPattern = /^022\d{8}$/;
    if (!studentNumberPattern.test(studentNumber)) {
      setError('Please enter a valid student number (format: 022XXXXXXXX)');
      return;
    }

    if (!receipt) {
      setError('Please upload your receipt');
      return;
    }

    onSubmit({ studentNumber, receipt });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
    <DialogContent className="dialog-content">
      <DialogHeader className="dialog-header">
        <DialogTitle className="dialog-title">Payment Details</DialogTitle>
      </DialogHeader>

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
            <Label htmlFor="studentNumber">Student Number</Label>
            <Input
              id="studentNumber"
              placeholder="022XXXXXXXXX"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="input-container">
            <Label>Payment Receipt</Label>
            <div className="upload-container">
              <label className="flex flex-col items-center justify-center w-full cursor-pointer">
                <Upload className="w-8 h-8 mb-4 text-gray-500" />
                <p className="text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG or JPEG (MAX. 5MB)
                </p>
                {previewUrl && (
                  <img 
                    src={previewUrl} 
                    alt="Receipt preview" 
                    className="mt-4 max-h-32 object-contain"
                  />
                )}
                <Input
                  id="receipt"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          <div className="payment-info">
            <p className="text-sm">Amount to pay: ₱{totalAmount}</p>
            <p className="text-sm mt-2">GCash Number: 0995 225 6413</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="footer">
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
              className="button button-outline"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="button button-primary"
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptUploadModal;