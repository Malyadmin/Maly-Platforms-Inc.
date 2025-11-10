
import React, { useState } from 'react';

interface CheckoutButtonProps {
  eventId: string;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({ eventId }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const sessionId = localStorage.getItem('maly_session_id');
      
      if (!sessionId) {
        console.error('No session ID found');
        return;
      }

      const formData = new FormData();
      formData.append('eventId', eventId);

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId,
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Event created successfully:', data);
      
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleClick}
      disabled={isLoading}
      className="px-4 py-2 bg-blue-500 text-foreground rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {isLoading ? 'Processing...' : 'Checkout'}
    </button>
  );
};

export default CheckoutButton;
