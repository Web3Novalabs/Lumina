import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../components/Pagination';

describe('Pagination', () => {
  describe('page-range rendering with ellipses', () => {
    it('renders all pages without ellipses when total pages <= maxVisiblePages', () => {
      render(<Pagination totalItems={50} itemsPerPage={10} />);

      // totalPages = 5, maxVisiblePages default = 7 → no ellipses
      expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 3')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 4')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 5')).toBeInTheDocument();

      // No ellipsis elements
      const ellipses = screen.queryAllByText('…');
      expect(ellipses.length).toBe(0);
    });

    it('renders ellipses when total pages is large', () => {
      render(<Pagination totalItems={500} itemsPerPage={10} defaultPage={1} />);

      // totalPages = 50, current = 1 → should see ellipsis before last page
      const ellipses = screen.queryAllByText('…');
      expect(ellipses.length).toBeGreaterThan(0);
    });

    it('shows first and last page when there are many pages', () => {
      render(
        <Pagination totalItems={500} itemsPerPage={10} defaultPage={25} />
      );

      // totalPages = 50, current = 25
      expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 50')).toBeInTheDocument();
    });

    it('shows ellipsis on both sides when current page is in the middle', () => {
      render(
        <Pagination totalItems={500} itemsPerPage={10} defaultPage={25} />
      );

      // Should have two ellipsis elements (before first chunk, after last chunk)
      const ellipses = screen.queryAllByText('…');
      expect(ellipses.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('items-per-page change resets to page 1', () => {
    it('resets to page 1 when items-per-page is changed', async () => {
      const onPageChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Pagination
          totalItems={200}
          itemsPerPage={10}
          defaultPage={5}
          onPageChange={onPageChange}
          showItemsPerPage={true}
          itemsPerPageOptions={[10, 25, 50]}
        />
      );

      // Start at page 5
      expect(onPageChange).not.toHaveBeenCalled();

      // Change items per page to 25
      const select = screen.getByLabelText('Per page:');
      await user.selectOptions(select, '25');

      // Should call onPageChange with page 1
      expect(onPageChange).toHaveBeenCalledWith(1);
    });
  });

  describe('go-to-page input clamping', () => {
    it('clamps input above totalPages to last page', () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          totalItems={100}
          itemsPerPage={10}
          defaultPage={1}
          onPageChange={onPageChange}
          showGoToPage={true}
        />
      );

      // totalPages = 10
      const goToInput = screen.getByLabelText(/Go to page/);
      fireEvent.change(goToInput, { target: { value: '999' } });
      fireEvent.blur(goToInput);

      expect(onPageChange).toHaveBeenCalledWith(10);
    });

    it('clamps input below 1 to page 1', () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          totalItems={100}
          itemsPerPage={10}
          defaultPage={5}
          onPageChange={onPageChange}
          showGoToPage={true}
        />
      );

      const goToInput = screen.getByLabelText(/Go to page/);
      fireEvent.change(goToInput, { target: { value: '0' } });
      fireEvent.blur(goToInput);

      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('navigates to valid page number on Enter', () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          totalItems={100}
          itemsPerPage={10}
          defaultPage={1}
          onPageChange={onPageChange}
          showGoToPage={true}
        />
      );

      const goToInput = screen.getByLabelText(/Go to page/);
      fireEvent.change(goToInput, { target: { value: '7' } });
      fireEvent.keyDown(goToInput, { key: 'Enter' });

      expect(onPageChange).toHaveBeenCalledWith(7);
    });

    it('does nothing on Enter when input is empty', () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          totalItems={100}
          itemsPerPage={10}
          defaultPage={1}
          onPageChange={onPageChange}
          showGoToPage={true}
        />
      );

      const goToInput = screen.getByLabelText(/Go to page/);
      fireEvent.keyDown(goToInput, { key: 'Enter' });

      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('clamps negative page to 1 on blur', () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          totalItems={100}
          itemsPerPage={10}
          defaultPage={3}
          onPageChange={onPageChange}
          showGoToPage={true}
        />
      );

      const goToInput = screen.getByLabelText(/Go to page/);
      fireEvent.change(goToInput, { target: { value: '-5' } });
      fireEvent.blur(goToInput);

      expect(onPageChange).toHaveBeenCalledWith(1);
    });
  });

  describe('navigation buttons', () => {
    it('disables previous and first buttons on page 1', () => {
      render(<Pagination totalItems={100} itemsPerPage={10} defaultPage={1} />);

      expect(screen.getByLabelText('First page')).toBeDisabled();
      expect(screen.getByLabelText('Previous page')).toBeDisabled();
      expect(screen.getByLabelText('Next page')).not.toBeDisabled();
    });

    it('disables next and last buttons on last page', () => {
      render(
        <Pagination totalItems={100} itemsPerPage={10} defaultPage={10} />
      );

      expect(screen.getByLabelText('Next page')).toBeDisabled();
      expect(screen.getByLabelText('Last page')).toBeDisabled();
      expect(screen.getByLabelText('Previous page')).not.toBeDisabled();
    });

    it('calls onPageChange when navigating to next page', async () => {
      const onPageChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Pagination
          totalItems={100}
          itemsPerPage={10}
          defaultPage={1}
          onPageChange={onPageChange}
        />
      );

      await user.click(screen.getByLabelText('Next page'));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange when navigating to previous page', async () => {
      const onPageChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Pagination
          totalItems={100}
          itemsPerPage={10}
          defaultPage={5}
          onPageChange={onPageChange}
        />
      );

      await user.click(screen.getByLabelText('Previous page'));
      expect(onPageChange).toHaveBeenCalledWith(4);
    });
  });

  describe('edge cases', () => {
    it('returns null when totalItems is 0', () => {
      const { container } = render(<Pagination totalItems={0} />);
      expect(container.firstChild).toBeNull();
    });

    it('shows only one page when totalItems is less than itemsPerPage', () => {
      render(<Pagination totalItems={5} itemsPerPage={10} />);

      expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
      expect(screen.queryByLabelText('Page 2')).not.toBeInTheDocument();
      expect(screen.getByLabelText('First page')).toBeDisabled();
      expect(screen.getByLabelText('Last page')).toBeDisabled();
    });

    it('shows go-to-page input only when totalPages > 5', () => {
      const { container } = render(
        <Pagination totalItems={30} itemsPerPage={10} showGoToPage={true} />
      );
      // totalPages = 3, should not show go-to-page
      expect(screen.queryByLabelText(/Go to page/)).not.toBeInTheDocument();
    });
  });
});
