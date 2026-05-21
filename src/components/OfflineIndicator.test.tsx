import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { OfflineIndicator } from './OfflineIndicator';

describe('<OfflineIndicator>', () => {
  beforeEach(() => {
    // Reset navigator.onLine entre tests
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  it('no renderiza nada cuando hay conexión', () => {
    const { container } = render(<OfflineIndicator />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza el banner "Sin conexión" cuando navigator.onLine es false', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    render(<OfflineIndicator />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Sin conexión/i)).toBeInTheDocument();
  });

  it('reacciona al evento "offline" del window', () => {
    render(<OfflineIndicator />);
    // Estado inicial: online, sin banner
    expect(screen.queryByRole('status')).toBeNull();

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('oculta el banner cuando vuelve la conexión', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    render(<OfflineIndicator />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByRole('status')).toBeNull();
  });
});
