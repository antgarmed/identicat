import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from './page';

/**
 * @file page.test.tsx
 * @description Unit tests for the Indenticat Home component.
 * We test the initial rendering, image selection, and the identification process.
 */

// Mock URL.createObjectURL since it's not available in jsdom
global.URL.createObjectURL = vi.fn(() => 'mock-url');

describe('Home Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global fetch mock
    global.fetch = vi.fn();
  });

  /**
   * @test Initial rendering
   * @description Checks if the main heading and the upload instructions are present.
   */
  it('renders the initial state correctly', () => {
    render(<Home />);
    expect(screen.getByText('Indenticat')).toBeInTheDocument();
    expect(
      screen.getByText(/Click or drag and drop an image here/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /IDENTICATE/i })).toBeDisabled();
  });

  /**
   * @test Image selection
   * @description Simulates selecting an image file and verifies the button becomes enabled.
   */
  it('enables the button when an image is selected', async () => {
    render(<Home />);
    const file = new File(['hello'], 'cat.png', { type: 'image/png' });
    const dropzone = screen.getByText(/Click or drag and drop an image here/i)
      .parentElement!;

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
        items: [
          {
            kind: 'file',
            type: 'image/png',
            getAsFile: () => file,
          },
        ],
        types: ['Files'],
      },
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /IDENTICATE/i })
      ).not.toBeDisabled();
    });
  });

  /**
   * @test Cat identification success
   * @description Mocks a successful API call to /api/identify and checks if the EMS code is displayed.
   */
  it('displays the result after successful identification', async () => {
    const mockResponse = {
      emsCode: 'PER n 22',
      detected: true,
      message: 'A beautiful black blotched tabby Persian cat.',
    };

    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(<Home />);
    const file = new File(['hello'], 'cat.png', { type: 'image/png' });
    const dropzone = screen.getByText(/Click or drag and drop an image here/i)
      .parentElement!;

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => file }],
        types: ['Files'],
      },
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /IDENTICATE/i })
      ).not.toBeDisabled();
    });

    const identifyButton = screen.getByRole('button', { name: /IDENTICATE/i });
    fireEvent.click(identifyButton);

    await waitFor(() => {
      expect(screen.getByText('PER')).toBeInTheDocument();
      expect(screen.getByText('n')).toBeInTheDocument();
      expect(screen.getByText('22')).toBeInTheDocument();
      expect(
        screen.getByText('A beautiful black blotched tabby Persian cat.')
      ).toBeInTheDocument();
    });
  });

  /**
   * @test Error handling
   * @description Simulates an API failure and verifies the error message is displayed.
   */
  it('shows an error message when identification fails', async () => {
    (global.fetch as Mock).mockRejectedValue(new Error('API Error'));

    render(<Home />);
    const file = new File(['hello'], 'cat.png', { type: 'image/png' });
    const dropzone = screen.getByText(/Click or drag and drop an image here/i)
      .parentElement!;

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => file }],
        types: ['Files'],
      },
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /IDENTICATE/i })
      ).not.toBeDisabled();
    });

    const identifyButton = screen.getByRole('button', { name: /IDENTICATE/i });
    fireEvent.click(identifyButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Error identifying cat. Please try again./i)
      ).toBeInTheDocument();
    });
  });
});
