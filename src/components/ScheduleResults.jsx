import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button
} from '@mui/material';
import {
  AccessTime,
  DirectionsBus,
  EventSeat,
  MonetizationOn,
  CalendarToday
} from '@mui/icons-material';

const ScheduleResults = ({ schedules = [], travellerType = 'local', seatCount = 1, onSelect = () => {} }) => {
  if (!schedules || schedules.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 3, mt: 3, textAlign: 'center' }}>
        <Typography variant="h6">No schedules found</Typography>
        <Typography variant="body1" color="text.secondary">
          Please try different search criteria
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Available Schedules ({schedules.length})
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <List>
        {schedules.map((schedule) => {
          // Safely access nested properties
          const fromRegion = schedule.route?.fromRegion?.regionName || 'Unknown';
          const toRegion = schedule.route?.toRegion?.regionName || 'Unknown';
          const busType = schedule.bus?.busType || 'Standard';
          const departureTime = schedule.departureTime ? new Date(schedule.departureTime) : new Date();
          const arrivalTime = schedule.arrivalTime ? new Date(schedule.arrivalTime) : new Date();
          const priceLocal = schedule.priceLocal || 0;
          const priceForeign = schedule.priceForeign || 0;
          const availableSeats = schedule.availableSeats || 0;

          return (
            <Paper key={schedule.scheduleId} elevation={2} sx={{ mb: 2 }}>
              <ListItem>
                <ListItemIcon>
                  <DirectionsBus color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="subtitle1">
                        {fromRegion} → {toRegion}
                      </Typography>
                      <Chip 
                        label={busType} 
                        size="small" 
                        color="secondary" 
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Box display="flex" alignItems="center" gap={2} mt={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AccessTime fontSize="small" />
                          <Typography variant="body2">
                            {departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <EventSeat fontSize="small" />
                          <Typography variant="body2">
                            {availableSeats} seats available
                          </Typography>
                        </Box>
                      </Box>
                      <Box display="flex" alignItems="center" gap={2} mt={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <MonetizationOn fontSize="small" />
                          <Typography variant="body2" fontWeight="bold">
                            {travellerType === 'local' 
                              ? `${priceLocal * seatCount} MMK` 
                              : `${priceForeign * seatCount} USD`}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarToday fontSize="small" />
                          <Typography variant="body2">
                            {departureTime.toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  }
                />
                <Button 
                  variant="contained" 
                  onClick={() => onSelect(schedule)}
                  sx={{ ml: 2 }}
                >
                  Select
                </Button>
              </ListItem>
            </Paper>
          );
        })}
      </List>
    </Paper>
  );
};

export default ScheduleResults;