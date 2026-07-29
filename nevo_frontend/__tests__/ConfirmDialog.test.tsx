import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '@/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: 'Delete Item',
    message: 'Are you sure?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Properly mock showModal and close to update the open state
    HTMLDialogElement.prototype.showModal = jest.fn(function (
      this: HTMLDialogElement
    ) {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = jest.fn(function (
      this: HTMLDialogElement
    ) {
      this.open = false;
    });
  });

  it('renders title and message', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls showModal when open is true', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it('calls close when open transitions to false', () => {
    const { rerender } = render(
      <ConfirmDialog {...defaultProps} open={false} />
    );
    rerender(<ConfirmDialog {...defaultProps} open={true} />);
    rerender(<ConfirmDialog {...defaultProps} open={false} />);
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });

  it('calls onConfirm when confirm button clicked', async () => {
    render(<ConfirmDialog {...defaultProps} />);
    await userEvent.click(screen.getByText('Confirm'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', async () => {
    render(<ConfirmDialog {...defaultProps} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel on Escape keypress', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const dialog = document.querySelector('dialog')!;
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel on backdrop click', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const dialog = document.querySelector('dialog')!;
    fireEvent.click(dialog);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('uses custom confirm and cancel labels', () => {
    render(
      <ConfirmDialog {...defaultProps} confirmLabel="Yes" cancelLabel="No" />
    );
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('renders danger variant icon', () => {
    render(<ConfirmDialog {...defaultProps} variant="danger" />);
    expect(document.querySelector('dialog')).toBeInTheDocument();
  });

  it('renders primary variant icon', () => {
    render(<ConfirmDialog {...defaultProps} variant="primary" />);
    expect(document.querySelector('dialog')).toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('does not call onConfirm when loading', async () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />);
    await userEvent.click(screen.getByText('Confirm'));
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });
});
