import '@testing-library/jest-dom';
import { vi } from 'vitest';

/**
 * @file setup.ts
 * @description Global setup for Vitest environment.
 */

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: { alt?: string; [key: string]: unknown }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt || ''} {...props} />;
  },
}));
