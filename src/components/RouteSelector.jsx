import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Paper, 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio,
  Grid,
  Divider,
  InputAdornment,
  TextField,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import SeatSelection from './SeatSelection';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import { CircularProgress } from '@mui/material';
import ScheduleResults from './ScheduleResults';
import PublicIcon from '@mui/icons-material/Public';
import Place from '@mui/icons-material/Place';
import Flag from '@mui/icons-material/Flag';
import { Polyline } from '@mui/icons-material';

export default function RouteForm() {
  const API_BASE_URL = "https://91ce-172-99-188-104.ngrok-free.app";
  const [fromRegions, setFromRegions] = useState([]);
  const [toRegions, setToRegions] = useState([]);
  const [selectedFromRegion, setSelectedFromRegion] = useState('');
  const [selectedToRegion, setSelectedToRegion] = useState('');
  const [showToRegionError, setShowToRegionError] = useState(false);
  const [seatCount, setSeatCount] = useState(1);
  const [travellerType, setTravellerType] = useState('local');
  const [selectedDate, setSelectedDate] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  
  const handleScheduleSelect = (schedule) => {
    setSelectedSchedule(schedule);
  };
  
  const handleSeatSelectionComplete = (selectedSeats) => {
    console.log('Booking seats:', selectedSeats, 'for schedule:', selectedSchedule);
    setSelectedSchedule(null);
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/AGENCY/nameList`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
      .then(response => {
        setFromRegions(response.data);
      })
      .catch(error => {
        console.error('Error fetching fromRegion data:', error);
      });
  }, []);

  const handleFromRegionChange = (event) => {
    const selectedRegionCode = parseInt(event.target.value, 10);
    setSelectedFromRegion(selectedRegionCode);
    setSelectedToRegion('');
    setShowToRegionError(false);

    if (selectedRegionCode) {
      axios.get(`${API_BASE_URL}/AGENCY/routes/toDestinations/${selectedRegionCode}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
        .then(response => {
          setToRegions(response.data);
        })
        .catch(error => {
          console.error('Error fetching toRegion data:', error);
          setToRegions([]);
        });
    } else {
      setToRegions([]);
    }
  };

  const handleToRegionChange = (event) => {
    setSelectedToRegion(event.target.value);
    setShowToRegionError(false);
  };

  const handleSeatChange = (change) => {
    const newCount = seatCount + change;
    if (newCount >= 1 && newCount <= 4) {
      setSeatCount(newCount);
    }
  };

  const handleNoRegionsClick = () => {
    if (!selectedFromRegion) {
      setShowToRegionError(true);
    }
  };

  const handleTravellerTypeChange = (event) => {
    setTravellerType(event.target.value);
  };

  const [errors, setErrors] = useState({
    fromRegion: false,
    toRegion: false,
    date: false
  });

  const validateForm = () => {
    const newErrors = {
      fromRegion: !selectedFromRegion,
      toRegion: !selectedToRegion,
      date: !selectedDate
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleFocus = (field) => {
    setErrors(prev => ({ ...prev, [field]: false }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/AGENCY/routes/search`, {
        params: {
          fromRegionCode: selectedFromRegion,
          toRegionCode: selectedToRegion,
          travelDate: selectedDate.format('YYYY-MM-DD')
        },
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      setSchedules(response.data);
    } catch (error) {
      console.error('Error searching schedules:', error);
      setSchedules([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ 
      p: 4, 
      maxWidth: 600, 
      mx: 'auto', 
      mt: 5,
      borderRadius: 3,
      boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.1)'
    }}>
      <Typography variant="h5" gutterBottom sx={{ 
        fontWeight: 'bold', 
        mb: 3,
        color: 'primary.main',
        textAlign: 'center'
      }}>
        Plan Your Journey
      </Typography>
      
      <Grid container spacing={3}>
        {/* From/To Region Section */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Box display="flex" alignItems="center" mb={1}>
              <Polyline color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Route Details</Typography>
            </Box>
            <Divider sx={{ 
            
              mb: 2 }} />
            
            <Grid container spacing={2}>
  <Grid item xs={12} sm={6}>
    <FormControl fullWidth sx={{ mt: 2 }}>
      <InputLabel>From Region</InputLabel>
      <Select
        label="From Region"
        value={selectedFromRegion}
        onChange={handleFromRegionChange}
        startAdornment={
          <InputAdornment position="start" sx={{ ml: 1, mr: 0.5 }}>
            <Place 
              fontSize="small" 
              sx={{ color: 'primary.main' }} // Blue color from theme
            />
          </InputAdornment>
        }
      >
        {fromRegions.map((region) => (
          <MenuItem key={region.regionCode} value={region.regionCode}>
            {region.regionName}
          </MenuItem>
        ))}
      </Select>
      {errors.fromRegion && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              Please select a departure region
            </Typography>
          )}
    </FormControl>
    {showToRegionError && (
      <Typography color="error" variant="body2" sx={{ mt: 1 }}>
        Please select 'From Region' first
      </Typography>
    )}
  </Grid>

  <Grid item xs={12} sm={6}>
    <FormControl fullWidth sx={{ mt: 2 }}>
      <InputLabel>To Region</InputLabel>
      {selectedFromRegion ? (
        toRegions.length > 0 ? (
          <Select
            label="To Region"
            value={selectedToRegion}
            onChange={handleToRegionChange}
            startAdornment={
          <InputAdornment position="start" sx={{ ml: 1, mr: 0.5 }}>
            <Flag
              fontSize="small" 
              sx={{ color: 'primary.main' }} // Matching blue color
            />
          </InputAdornment>
        }
          >
            {toRegions.map((region) => (
              <MenuItem key={region.regionCode} value={region.regionCode}>
                {region.regionName}
              </MenuItem>
            ))}
          </Select>
        ) : (
          <Select
            label="To Region"
            value=""
            startAdornment={
              <InputAdornment position="start" sx={{ ml: 1, mr: 0.5 }}>
                <Flag
                  fontSize="small" 
                  sx={{ color: 'primary.main' }} // Matching blue color
                />
              </InputAdornment>
            }
            sx={{ '& .MuiSelect-icon': { display: 'none' } }}
          >
            <MenuItem disabled value="">
              No routes available
            </MenuItem>
          </Select>
          
        )
      ) : (
        <Select
          label="To Region"
          onFocus={handleNoRegionsClick}
          startAdornment={
          <InputAdornment position="start" sx={{ ml: 1, mr: 0.5 }}>
            <Flag
              fontSize="small" 
              sx={{ color: 'primary.main' }} // Matching blue color
            />
          </InputAdornment>
        }
          sx={{ '& .MuiSelect-icon': { display: 'none' } }}
        >
          <MenuItem disabled value="">
            Select From Region first
          </MenuItem>
        </Select>
        
      )}
    </FormControl>
    {errors.toRegion && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              Please select a destination region
            </Typography>
          )}
    {selectedFromRegion && toRegions.length === 0 && (
      <Typography color="error" variant="body2" sx={{ mt: 1 }}>
        No routes found for selected region
      </Typography>
    )}
  </Grid>
</Grid>
          </Paper>
        </Grid>

        {/* Date Picker Section */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Box display="flex" alignItems="center" mb={1}>
              <EventIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Travel Date</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Select your travel date"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                sx={{ width: '100%' }}
                disablePast
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined'
                  }
                }}
              />
            </LocalizationProvider>
            {errors.date && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              Please select a travel date
            </Typography>
          )}
          </Paper>
        </Grid>

        {/* Seat Count Section */}
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e0e0e0', height: '100%' }}>
            <Box display="flex" alignItems="center" mb={1}>
              <PeopleIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Number of seats</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <FormControl fullWidth>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  <IconButton 
                    onClick={() => handleSeatChange(-1)} 
                    disabled={seatCount==1}
                    sx={{ 
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      mr: 3,
                      ml:3
                    }}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <TextField
                    value={seatCount}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      width: 60,
                      '& .MuiOutlinedInput-input': {
                        textAlign: 'center'
                      }
                    }}
                    inputProps={{ min: 1, readOnly: true }}
                  />
                  <IconButton 
                    onClick={() => handleSeatChange(1)} 
                    disabled={seatCount>=4}
                    sx={{ 
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      ml: 3,
                      mr:3
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>
            </FormControl>
          </Paper>
        </Grid>

        {/* Traveller Type Section */}
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e0e0e0', height: '100%' }}>
            <Box display="flex" alignItems="center" mb={1}>
              <PublicIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Traveller Type</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <FormControl fullWidth>
              <RadioGroup row value={travellerType} onChange={handleTravellerTypeChange} sx={{ justifyContent: 'space-between' }}>
                <FormControlLabel 
                  value="local" 
                  control={<Radio color="primary" />} 
                  label="Local" 
                  sx={{
                    border: travellerType === 'local' ? '1px solid #1976d2' : '1px solid #e0e0e0',
                    borderRadius: 1,
                    px: 0.5,
                    mx: 0,
                    flex: 1,
                    mr: 1
                  }}
                />
                <FormControlLabel 
                  value="foreign" 
                  control={<Radio color="primary" />} 
                  label="Foreign" 
                  sx={{
                    border: travellerType === 'foreign' ? '1px solid #1976d2' : '1px solid #e0e0e0',
                    borderRadius: 1,
                    px: 1,
                    mx: 1,
                    flex: 1,
                    ml: 1
                  }}
                />
              </RadioGroup>
            </FormControl>
          </Paper>
        </Grid>
      </Grid>

      <Button 
        variant="contained" 
        color="primary" 
        fullWidth 
        sx={{ 
          mt: 3, 
          py: 1.5,
          borderRadius: 2,
          fontWeight: 'bold',
          fontSize: '1rem'
        }} 
        onClick={handleSubmit}
      >
        Find Available Routes
      </Button>
      {isSearching ? (
  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
    <CircularProgress />
  </Box>
) : (
  <ScheduleResults 
    schedules={schedules} 
    travellerType={travellerType}
    seatCount={seatCount}
    onSelect={handleScheduleSelect}
  />
)}

{selectedSchedule && (
  <SeatSelection 
    schedule={selectedSchedule}
    travellerType={travellerType}
    onClose={() => setSelectedSchedule(null)}
    onConfirm={handleSeatSelectionComplete}
  />
)}
    </Paper>
    
  );
}