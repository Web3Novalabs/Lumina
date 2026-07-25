import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DonateModal } from '@/components/DonateModal';
import type { Pool } from '@/src/store/poolsStore';

jest.mock('@/src/store/walletStore', () => ({
  useWalletStore: () => ({
    publicKey: 'wallet-address',
    balances: { xlm: '10', usdc: '5' },
  }),
}));

jest.mock('@/src/store/donationsStore', () => ({
  useDonationsStore: () => ({ addDonation: jest.fn() }),
}));

jest.mock('@/lib/contract-service', () => ({
  contractService: {
    buildDonateTransaction: jest.fn(),
  },
}));

jest.mock('@/lib/errors', () => ({
  parseApiError: (error: unknown) => String(error),
}));

jest.mock('@stellar/freighter-api', () => ({
  signTransaction: jest.fn(),
}));

jest.mock('@stellar/stellar-sdk', () => ({
  Networks: { TESTNET: 'Test SDF Network ; September 2015' },
  Transaction: class {},
  TransactionBuilder: {
    fromXDR: jest.fn(),
  },
}));

jest.mock('@stellar/stellar-sdk/rpc', () => ({
  Server: jest.fn(),
}));

const pool: Pool = {
  id: '1',
  title: 'Community Pool',
  description: 'A community pool for local initiatives',
  category: 'Community',
  raised: 100,
  target: 1000,
  status: 'Active',
  imageColor: '#123456',
};

describe('DonateModal', () => {
  it('keeps focus inside the modal when tabbing through focusable elements', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Open donate</button>
        <DonateModal pool={pool} onClose={jest.fn()} />
      </>
    );

    const closeButton = screen.getByRole('button', {
      name: /close donation modal/i,
    });
    const trigger = screen.getByRole('button', { name: /open donate/i });

    closeButton.focus();
    await user.tab();

    expect(trigger).not.toHaveFocus();
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement);
  });

  it('restores focus to the triggering button when the modal closes', () => {
    const onClose = jest.fn();
    render(
      <>
        <button type="button">Open donate</button>
        <DonateModal pool={pool} onClose={onClose} />
      </>
    );

    const trigger = screen.getByRole('button', { name: /open donate/i });
    trigger.focus();

    const closeButton = screen.getByRole('button', {
      name: /close donation modal/i,
    });
    closeButton.click();

    expect(trigger).toHaveFocus();
  });
});
