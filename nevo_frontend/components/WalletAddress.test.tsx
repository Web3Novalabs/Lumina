import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { WalletAddress } from './WalletAddress';

describe('WalletAddress', () => {
  const address = 'GABC1234567890DEF1234567890HIJK1234567890LMNO';

  it('shows a truncated address for long values', () => {
    render(<WalletAddress address={address} />);

    expect(screen.getByText('GABC1…NO')).toBeInTheDocument();
    expect(screen.getByTitle(address)).toHaveTextContent('GABC1…NO');
  });

  it('shows the full address when it is short enough', () => {
    render(<WalletAddress address="GABC12345" />);

    expect(screen.getByText('GABC12345')).toBeInTheDocument();
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
