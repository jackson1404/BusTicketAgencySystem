import React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

const DropdownSelector = ({ label, value, options, onChange, onFocus}) => {
  return (
    <Box sx={{ minWidth: 120, mt: 2 }}>
      <FormControl fullWidth>
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          label={label}
          onChange={onChange}
          onFocus={onFocus}
        >
          {options.map((option) => (
            <MenuItem key={option.regionCode} value={option.regionCode}>
              {option.regionName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default DropdownSelector;