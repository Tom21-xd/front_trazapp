import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Limpia el DOM entre tests para que no haya estado residual
afterEach(() => {
  cleanup();
});
