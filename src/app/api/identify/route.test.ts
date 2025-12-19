import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

/**
 * @file route.test.ts
 * @description Unit tests for the cat identification API route.
 * Handles mocking the Gemini API response and testing various edge cases.
 */

// Mock the Gemini API URL and fetch
const MOCK_API_KEY = 'test-key';
process.env.GEMINI_API_KEY = MOCK_API_KEY;

describe('POST /api/identify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  /**
   * @test No image provided
   * @description Verifies that the API returns a 400 error when no image is uploaded.
   */
  it('returns 400 if no image is provided', async () => {
    const req = {
      formData: vi.fn().mockResolvedValue(new FormData()),
    } as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No image provided');
  });

  /**
   * @test Successful identification
   * @description Mocks a successful response from Gemini and verifies correct parsing.
   */
  it('identifies a cat correctly from Gemini response', async () => {
    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  ems_code: 'BRI n 24',
                  detected: true,
                  message: 'British Shorthair Black Spotted Tabby',
                }),
              },
            ],
          },
        },
      ],
    };

    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGeminiResponse),
    });

    const formData = new FormData();
    const file = new File(['mock-image-content'], 'cat.jpg', {
      type: 'image/jpeg',
    });
    // Mock arrayBuffer since it's used in the route
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
    formData.append('image', file);

    const req = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.emsCode).toBe('BRI n 24');
    expect(data.detected).toBe(true);
    expect(data.message).toBe('British Shorthair Black Spotted Tabby');
  });

  /**
   * @test Gemini API failure
   * @description Verifies that the API returns a 500 error when the upstream API fails.
   */
  it('returns 500 if Gemini API request fails', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const formData = new FormData();
    const file = new File(['mock-image-content'], 'cat.jpg', {
      type: 'image/jpeg',
    });
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
    formData.append('image', file);

    const req = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to process image');
  });

  /**
   * @test Robust JSON parsing
   * @description Verifies that the API can handle JSON wrapped in markdown code blocks.
   */
  it('handles JSON response wrapped in markdown', async () => {
    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: '```json\n{"ems_code": "MCO n 03", "detected": true, "message": "Maine Coon bicolor"}\n```',
              },
            ],
          },
        },
      ],
    };

    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGeminiResponse),
    });

    const formData = new FormData();
    const file = new File(['mock-image-content'], 'cat.jpg', {
      type: 'image/jpeg',
    });
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
    formData.append('image', file);

    const req = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as NextRequest;

    const response = await POST(req);
    const data = await response.json();

    expect(data.emsCode).toBe('MCO n 03');
    expect(data.detected).toBe(true);
  });
});
