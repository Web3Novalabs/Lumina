import React from 'react';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonVariant } from '@/components/Skeleton';

describe('Skeleton', () => {
  it('renders text variant by default', () => {
    render(<Skeleton />);
    const container = document.querySelector('.space-y-2');
    expect(container).toBeInTheDocument();
  });

  it('renders text variant with custom line count', () => {
    render(<Skeleton variant="text" lines={5} />);
    const lines = document.querySelectorAll('.h-4');
    expect(lines.length).toBeGreaterThanOrEqual(5);
  });

  it('renders card variant', () => {
    render(<Skeleton variant="card" />);
    const card = document.querySelector('.rounded-lg.border');
    expect(card).toBeInTheDocument();
  });

  it('renders image variant with default dimensions', () => {
    render(<Skeleton variant="image" />);
    const imageSkeleton = document.querySelector('.rounded-md');
    expect(imageSkeleton).toBeInTheDocument();
  });

  it('applies custom width and height to image variant', () => {
    render(<Skeleton variant="image" width="100px" height="200px" />);
    const imageSkeleton = document.querySelector('.rounded-md');
    expect(imageSkeleton).toHaveStyle({ width: '100px', height: '200px' });
  });

  it('applies custom className', () => {
    render(<Skeleton className="custom-class" />);
    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('has accessibility attributes', () => {
    render(<Skeleton />);
    const elements = document.querySelectorAll('[aria-hidden="true"]');
    expect(elements.length).toBeGreaterThan(0);
  });
});