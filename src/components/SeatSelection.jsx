import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Button,
  Typography,
  Divider,
  Paper,
  Container,
  LinearProgress,
  Stack,
  Chip
} from '@mui/material';
import {
  EventSeat,
  DirectionsBus,
  ArrowBack,
  AirlineSeatReclineNormal,
  MeetingRoom,
  AccessTime
} from '@mui/icons-material';
import { Client } from '@stomp/stompjs';
import { useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client'; // Add this import


const SeatSelection = ({ schedule, travellerType }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [reservedSeats, setReservedSeats] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [countdowns, setCountdowns] = useState({});
  const countdownRefs = useRef({});

  const clientRef = useRef(null);
  const navigate = useNavigate();

  // Generate seat layout (3 seats per row)
  const generateSeatLayout = (capacity = 20) => {
    const rows = Math.ceil(capacity / 3);
    const layout = [];

    for (let row = 0; row < rows; row++) {
      const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
      layout.push(
        { id: `${rowLetter}1`, number: `${rowLetter}1`, row: row, position: 'left' },
        { id: `${rowLetter}2`, number: `${rowLetter}2`, row: row, position: 'middle' },
        { id: `${rowLetter}3`, number: `${rowLetter}3`, row: row, position: 'right' }
      );
    }
    return layout;
  };

  const seatLayout = generateSeatLayout(schedule?.bus?.capacity);

  const startCountdown = (seatNumber) => {
    // Clear any existing countdown for this seat
    if (countdownRefs.current[seatNumber]) {
      clearInterval(countdownRefs.current[seatNumber]);
    }

    // Set initial time (120 seconds)
    setCountdowns(prev => ({ ...prev, [seatNumber]: 10 }));

    // Start new countdown
    countdownRefs.current[seatNumber] = setInterval(() => {
      setCountdowns(prev => {
        const newTime = prev[seatNumber] - 1;
        
        if (newTime <= 0) {
          clearInterval(countdownRefs.current[seatNumber]);
          // Auto-release the seat when time runs out
          handleSeatTimeout(seatNumber);
          return { ...prev, [seatNumber]: 0 };
        }
        
        return { ...prev, [seatNumber]: newTime };
      });
    }, 1000);
  };
   // Handle seat timeout
   const handleSeatTimeout = (seatNumber) => {
    if (clientRef.current && clientRef.current.connected) {
      const message = {
        scheduleId: schedule.scheduleId,
        seatNumber,
        action: 'release'
      };
      
      clientRef.current.publish({
        destination: '/app/seats/select',
        body: JSON.stringify(message),
        headers: {'content-type': 'application/json'}
      });
    }

    setSelectedSeats(prev => prev.filter(s => s !== seatNumber));
  };
    // Clean up countdowns on unmount
    useEffect(() => {
      return () => {
        Object.values(countdownRefs.current).forEach(interval => {
          clearInterval(interval);
        });
      };
    }, []);
    useEffect(() => {
      const client = new Client({
        webSocketFactory: () => new SockJS(`${API_BASE_URL}/AGENCY/seats/ws`),
        reconnectDelay: 5000,
        debug: (str) => {
          console.log('STOMP: ', str);
        },
        onConnect: () => {
          console.log('WebSocket Connected');
          setIsConnected(true);
          setRetryCount(0);
  
          client.subscribe(`/topic/seats/${schedule.scheduleId}`, (message) => {
            try {
              const update = JSON.parse(message.body);
              if (update.action === 'release') {
                setReservedSeats(prev =>
                  prev.filter(s => s.scheduleId !== update.scheduleId || s.seatNumber !== update.seatNumber)
                );
              } else {
                setReservedSeats(prev => [
                  ...prev.filter(s => s.scheduleId !== update.scheduleId || s.seatNumber !== update.seatNumber),
                  update
                ]);
              }
            } catch (error) {
              console.error('Error parsing message:', error);
            }
          });
  
          fetch(`${API_BASE_URL}/AGENCY/seats/status/${schedule.scheduleId}`)
            .then(res => res.json())
            .then(data => setReservedSeats(data))
            .catch(err => console.error('Fetch error:', err));
        },
        onDisconnect: () => {
          console.log('WebSocket Disconnected');
          setIsConnected(false);
          if (retryCount < 5) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
            setTimeout(() => {
              setRetryCount(c => c + 1);
              client.activate();
            }, delay);
          }
        },
        onStompError: (frame) => {
          console.error('STOMP error:', frame.headers.message);
        }
      });
  
      client.activate();
      clientRef.current = client;
  
      return () => {
        if (clientRef.current) {
          clientRef.current.deactivate();
        }
      };
    }, [schedule.scheduleId, retryCount]);
  
    const handleSeatClick = (seatNumber) => {
      if (reservedSeats.some(s => s.seatNumber === seatNumber && !selectedSeats.includes(seatNumber))) {
        return;
      }
  
      setSelectedSeats(prev => {
        const newSelection = prev.includes(seatNumber)
          ? prev.filter(s => s !== seatNumber)
          : [...prev, seatNumber];
  
        if (clientRef.current && clientRef.current.connected) {
          try {
            const message = {
              scheduleId: schedule.scheduleId,
              seatNumber,
              action: prev.includes(seatNumber) ? 'release' : 'select'
            };
            
            clientRef.current.publish({
              destination: '/app/seats/select',
              body: JSON.stringify(message),
              headers: {'content-type': 'application/json'}
            });
  
            // Start countdown when selecting a seat
            if (!prev.includes(seatNumber)) {
              startCountdown(seatNumber);
            } else {
              // Clear countdown when deselecting
              clearInterval(countdownRefs.current[seatNumber]);
              setCountdowns(prev => {
                const newCountdowns = { ...prev };
                delete newCountdowns[seatNumber];
                return newCountdowns;
              });
            }
          } catch (error) {
            console.error('Error sending message:', error);
          }
        }
  
        return newSelection;
      });
    };
  
    const getSeatStatus = (seatNumber) => {
      if (selectedSeats.includes(seatNumber)) return 'selected';
      if (reservedSeats.some(s => s.seatNumber === seatNumber)) return 'reserved';
      return 'available';
    };
  
    const handleConfirmBooking = () => {
      console.log('Confirmed seats:', selectedSeats);
      // Clear all countdowns when booking is confirmed
      selectedSeats.forEach(seat => {
        clearInterval(countdownRefs.current[seat]);
      });
      alert(`Booking confirmed for seats: ${selectedSeats.join(', ')}`);
      navigate('/booking-confirmed');
    };
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button 
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back to Schedule
      </Button>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Select Your Seats
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {schedule.route.fromRegion.regionName} → {schedule.route.toRegion.regionName}
            </Typography>
            <Typography variant="body1">
              Departure: {new Date(schedule.departureTime).toLocaleString()}
            </Typography>
          </Box>
          
          <Box textAlign="center">
            <DirectionsBus sx={{ fontSize: 60, color: 'primary.main' }} />
            <Typography variant="subtitle1">
              {schedule.bus.busType} Bus
            </Typography>
            <Typography variant="body2">
              Capacity: {schedule.bus.capacity} seats
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Bus Layout */}
        <Box sx={{ 
          position: 'relative',
          border: '2px solid #ddd',
          borderRadius: 2,
          p: 4,
          mb: 4,
          backgroundColor: '#f9f9f9'
        }}>
          {/* Driver Area */}
          <Box sx={{
            position: 'absolute',
    
            left: 40,
            top: '7%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <AirlineSeatReclineNormal sx={{ fontSize: 40, color: 'text.secondary' }} />
            <Typography variant="caption">Driver</Typography>
          </Box>
          
          {/* Front Door */}
          <Box sx={{
            position: 'absolute',
            right: 10,
            top: '3%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <MeetingRoom sx={{ fontSize: 40, color: 'text.secondary', transform: 'rotate(90deg)' }} />
            <Typography variant="caption">Front Door</Typography>
          </Box>
          
          {/* Seats Grid */}
<Grid container spacing={2} sx={{ 
  mt: 10,
  ml: -2, 
  mr: 12,
  '& .seat-row': {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    mb: 2
  }
}}>
  {Array.from(new Set(seatLayout.map(seat => seat.row))).map(row => {
    const rowSeats = seatLayout.filter(seat => seat.row === row);
    const rowLetter = String.fromCharCode(65 + row);
    
    return (
      <Grid item xs={12} key={`row-${row}`} className="seat-row">
        <Stack direction="row" spacing={2} justifyContent="center">
          
        {rowSeats.map((seat, index) => {
        const status = getSeatStatus(seat.number);
        const timeLeft = countdowns[seat.number] || 0;

        return (
          <React.Fragment key={seat.id}>
            <Button
              variant={status === 'selected' ? 'contained' : 'outlined'}
              color={
                status === 'selected' ? 'primary' :
                status === 'reserved' ? 'secondary' : 'inherit'
              }
              disabled={status === 'reserved'}
              onClick={() => handleSeatClick(seat.number)}
              sx={{
                minWidth: 80,
                height: 80,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                opacity: status === 'reserved' ? 0.7 : 1
              }}
            >
              <EventSeat sx={{ 
                fontSize: 30,
                color: status === 'available' ? 'action.active' : 'inherit'
              }} />
              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                {seat.number}
              </Typography>
              
              {/* Countdown indicator */}
              {status === 'selected' && timeLeft > 0 && (
                <Box sx={{
                  position: 'absolute',
                  bottom: 4,
                  left: 4,
                  right: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  <AccessTime fontSize="small" />
                  <LinearProgress 
                    variant="determinate" 
                    value={(timeLeft / 120) * 100} 
                    sx={{
                      flexGrow: 1,
                      height: 4,
                      borderRadius: 2
                    }}
                  />
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {timeLeft}s
                  </Typography>
                </Box>
              )}

              {status === 'reserved' && (
                <Box sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 12,
                  height: 12,
                  bgcolor: 'secondary.main',
                  borderRadius: '50%'
                }} />
              )}
            </Button>

            {/* Add aisle spacing after second seat */}
            {index === 1 && (
              <Box sx={{ width: 130 }} />
            )}
          </React.Fragment>
        );
      })}
        </Stack>
      </Grid>
    );
  })}
</Grid>

          
        
        </Box>
        
        {/* Legend */}
        <Box display="flex" justifyContent="center" gap={4} mb={4}>
          <Box display="flex" alignItems="center" gap={1}>
            <EventSeat color="action" sx={{ fontSize: 30 }} />
            <Typography variant="body1">Available</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <EventSeat color="primary" sx={{ fontSize: 30 }} />
            <Typography variant="body1">Selected</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <EventSeat color="secondary" sx={{ fontSize: 30 }} />
            <Typography variant="body1">Reserved</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Booking Summary */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" gutterBottom>
              Booking Summary
            </Typography>
            {selectedSeats.length > 0 ? (
              <Stack direction="row" spacing={1}>
                <Typography>Selected Seats:</Typography>
                {selectedSeats.map(seat => (
                  <Chip key={seat} label={seat} color="primary" />
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                No seats selected yet
              </Typography>
            )}
          </Box>
          
          <Box textAlign="right">
            <Typography variant="h5" color="primary" gutterBottom>
              {travellerType === 'local' 
                ? `${schedule.priceLocal * selectedSeats.length} MMK` 
                : `${schedule.priceForeign * selectedSeats.length} USD`}
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              onClick={handleConfirmBooking}
              disabled={selectedSeats.length === 0}
              sx={{ px: 4, py: 1.5 }}
            >
              Confirm Booking
            </Button>
          </Box>
        </Stack>
      </Paper>
      <Box sx={{ position: 'fixed', top: 16, right: 16 }}>
        <Chip 
          label={isConnected ? "Connected" : "Disconnected"} 
          color={isConnected ? "success" : "error"} 
          variant="outlined"
        />
      </Box>
    </Container>
  );
};

export default SeatSelection;