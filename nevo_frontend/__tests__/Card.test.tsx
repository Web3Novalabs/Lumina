import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
} from '@/components/Card';

describe('Card compound component', () => {
  // ---------------------------------------------------------------------------
  // Card (root)
  // ---------------------------------------------------------------------------
  describe('Card', () => {
    it('renders its children', () => {
      render(<Card>card content</Card>);
      expect(screen.getByText('card content')).toBeInTheDocument();
    });

    it('accepts and applies a custom className', () => {
      render(<Card className="custom-card">content</Card>);
      expect(
        screen.getByText('content').closest('[data-slot="card"]')
      ).toHaveClass('custom-card');
    });

    it('renders with data-slot="card"', () => {
      render(<Card>slot check</Card>);
      expect(document.querySelector('[data-slot="card"]')).toBeInTheDocument();
    });

    it.each(['elevated', 'outlined', 'flat'] as const)(
      'renders variant "%s" without error',
      (variant) => {
        render(<Card variant={variant}>v</Card>);
        expect(
          document.querySelector('[data-slot="card"]')
        ).toBeInTheDocument();
      }
    );

    it('applies hoverable styles when hoverable is true', () => {
      render(<Card hoverable>hover me</Card>);
      const el = document.querySelector('[data-slot="card"]') as HTMLElement;
      expect(el.className).toContain('cursor-pointer');
    });
  });

  // ---------------------------------------------------------------------------
  // CardHeader
  // ---------------------------------------------------------------------------
  describe('CardHeader', () => {
    it('renders its children', () => {
      render(<CardHeader>header text</CardHeader>);
      expect(screen.getByText('header text')).toBeInTheDocument();
    });

    it('accepts and applies a custom className', () => {
      render(<CardHeader className="custom-header">header</CardHeader>);
      expect(document.querySelector('[data-slot="card-header"]')).toHaveClass(
        'custom-header'
      );
    });

    it('renders with data-slot="card-header"', () => {
      render(<CardHeader>slot</CardHeader>);
      expect(
        document.querySelector('[data-slot="card-header"]')
      ).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // CardTitle
  // ---------------------------------------------------------------------------
  describe('CardTitle', () => {
    it('renders its children', () => {
      render(<CardTitle>My Title</CardTitle>);
      expect(screen.getByText('My Title')).toBeInTheDocument();
    });

    it('accepts and applies a custom className', () => {
      render(<CardTitle className="custom-title">title</CardTitle>);
      expect(document.querySelector('[data-slot="card-title"]')).toHaveClass(
        'custom-title'
      );
    });

    it('renders as an h3 element', () => {
      render(<CardTitle>H3 check</CardTitle>);
      expect(
        screen.getByRole('heading', { level: 3, name: 'H3 check' })
      ).toBeInTheDocument();
    });

    it('renders with data-slot="card-title"', () => {
      render(<CardTitle>slot</CardTitle>);
      expect(
        document.querySelector('[data-slot="card-title"]')
      ).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // CardDescription
  // ---------------------------------------------------------------------------
  describe('CardDescription', () => {
    it('renders its children', () => {
      render(<CardDescription>Some description</CardDescription>);
      expect(screen.getByText('Some description')).toBeInTheDocument();
    });

    it('accepts and applies a custom className', () => {
      render(<CardDescription className="custom-desc">desc</CardDescription>);
      expect(
        document.querySelector('[data-slot="card-description"]')
      ).toHaveClass('custom-desc');
    });

    it('renders with data-slot="card-description"', () => {
      render(<CardDescription>slot</CardDescription>);
      expect(
        document.querySelector('[data-slot="card-description"]')
      ).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // CardBody
  // ---------------------------------------------------------------------------
  describe('CardBody', () => {
    it('renders its children', () => {
      render(<CardBody>body content</CardBody>);
      expect(screen.getByText('body content')).toBeInTheDocument();
    });

    it('accepts and applies a custom className', () => {
      render(<CardBody className="custom-body">body</CardBody>);
      expect(document.querySelector('[data-slot="card-body"]')).toHaveClass(
        'custom-body'
      );
    });

    it('renders with data-slot="card-body"', () => {
      render(<CardBody>slot</CardBody>);
      expect(
        document.querySelector('[data-slot="card-body"]')
      ).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // CardFooter
  // ---------------------------------------------------------------------------
  describe('CardFooter', () => {
    it('renders its children', () => {
      render(<CardFooter>footer content</CardFooter>);
      expect(screen.getByText('footer content')).toBeInTheDocument();
    });

    it('accepts and applies a custom className', () => {
      render(<CardFooter className="custom-footer">footer</CardFooter>);
      expect(document.querySelector('[data-slot="card-footer"]')).toHaveClass(
        'custom-footer'
      );
    });

    it('renders with data-slot="card-footer"', () => {
      render(<CardFooter>slot</CardFooter>);
      expect(
        document.querySelector('[data-slot="card-footer"]')
      ).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Composition — full card assembled from all sub-components
  // ---------------------------------------------------------------------------
  describe('full composition', () => {
    it('renders all sub-components together', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Pool Alpha</CardTitle>
            <CardDescription>A test pool</CardDescription>
          </CardHeader>
          <CardBody>body area</CardBody>
          <CardFooter>footer area</CardFooter>
        </Card>
      );

      expect(
        screen.getByRole('heading', { level: 3, name: 'Pool Alpha' })
      ).toBeInTheDocument();
      expect(screen.getByText('A test pool')).toBeInTheDocument();
      expect(screen.getByText('body area')).toBeInTheDocument();
      expect(screen.getByText('footer area')).toBeInTheDocument();
    });
  });
});
