import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { WalletAddress } from '../components/WalletAddress';

describe('WalletAddress', () => {
  const address = 'GABC1234567890DEF1234567890HIJK1234567890LMNO';

  it('shows a truncated address for long values', () => {
    render(<WalletAddress address={address} />);

    expect(
      screen.getByLabelText('Wallet address: GABC12…90LMNO')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Wallet address: GABC12…90LMNO')
    ).toHaveTextContent('GABC12…90LMNO');
  });

  it('shows the full address when it is short enough', () => {
    render(<WalletAddress address="GABC12345" />);

    expect(screen.getAllByText('GABC12345').length).toBeGreaterThan(0);
    expect(
      screen.getByLabelText('Full wallet address: GABC12345')
    ).toBeInTheDocument();
  });

  it('copies the full address when the copy button is clicked', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });

    render(<WalletAddress address={address} />);

    fireEvent.click(
      screen.getByRole('button', { name: /copy wallet address/i })
    );

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(address);
    });

    expect(screen.getByText('Address copied to clipboard')).toBeInTheDocument();
  });

  it('falls back to document.execCommand when clipboard API is unavailable', async () => {
    Object.assign(navigator, {
      clipboard: undefined,
    });

    const execCommand = jest.fn();
    document.execCommand = execCommand;

    render(<WalletAddress address={address} />);

    fireEvent.click(
      screen.getByRole('button', { name: /copy wallet address/i })
    );

    await waitFor(() => {
      expect(execCommand).toHaveBeenCalledWith('copy');
    });
  });
});
