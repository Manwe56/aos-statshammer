import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { TextField, InputAdornment } from '@material-ui/core';
import clsx from 'clsx';

const useStyles = makeStyles({
  rollInput: {},
});

const RollInput = ({
  label, value, onChange, className, required, allowOnes,
  startAdornment, endAdornment, errorCallback, ...other
}) => {
  const classes = useStyles();
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const min = allowOnes ? 1 : 2;
  const max = 6;

  const inputProps = {};
  if (startAdornment) {
    inputProps.startAdornment = <InputAdornment position="start">{startAdornment}</InputAdornment>;
  }
  if (endAdornment) {
    inputProps.endAdornment = <InputAdornment position="end">{endAdornment}</InputAdornment>;
  }

  const isValid = useCallback((val) => Number(val) <= max && Number(val) >= min, [min, max]);

  const setErrorState = useCallback((errMessage) => {
    setError(true);
    setErrorMessage(errMessage);
  }, []);

  const clearErrorState = useCallback(() => {
    setError(false);
    setErrorMessage(null);
  }, []);

  const validate = useCallback((val) => {
    if (required && (val == null || val === '')) setErrorState('Required');
    else if (!isValid(val)) setErrorState(`Must be between ${min} and ${max}`);
    else clearErrorState();
  }, [clearErrorState, isValid, min, required, setErrorState]);

  useEffect(() => {
    if (value !== undefined) validate(value);
  }, [validate, value]);

  useEffect(() => {
    if (errorCallback) {
      errorCallback(error);
    }
  }, [error, errorCallback]);

  const handleChange = useCallback((event) => {
    const val = event.target.value;
    if (value === undefined) validate(val); // uncontrolled
    if (onChange) onChange(event);
  }, [onChange, validate, value]);

  return (
    <TextField
      label={label}
      value={value}
      type="number"
      className={clsx(classes.rollInput, className)}
      variant="outlined"
      error={Boolean(error)}
      helperText={error ? errorMessage : null}
      onChange={handleChange}
      InputProps={inputProps}
      {...other}
    />
  );
};

RollInput.defaultProps = {
  label: null,
  value: undefined,
  onChange: null,
  className: null,
  required: false,
  allowOnes: false,
  startAdornment: null,
  endAdornment: null,
  errorCallback: null,
};

RollInput.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  className: PropTypes.string,
  required: PropTypes.bool,
  allowOnes: PropTypes.bool,
  startAdornment: PropTypes.node,
  endAdornment: PropTypes.node,
  errorCallback: PropTypes.func,
};

export default RollInput;