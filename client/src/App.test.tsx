import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders invoice digitizer', () => {
  render(<App />);
  const headerElement = screen.getByText(/Framing Invoice Digitizer/i);
  expect(headerElement).toBeTruthy();
});
