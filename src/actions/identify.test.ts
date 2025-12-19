import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { identifyCat } from './identify';

/**
 * @file identify.test.ts
 * @description Unit tests for the cat identification Server Action.
 * Handles mocking the Gemini API response and testing various edge cases.
 */

// Mock the Gemini API URL and fetch
const MOCK_API_KEY = 'test-key';
process.env.GEMINI_API_KEY = MOCK_API_KEY;

describe('identifyCat Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  /**
   * @test No image provided
   * @description Verifies that the action returns an error when no image is uploaded.
   */
  it('returns error if no image is provided', async () => {
    const formData = new FormData();
    const result = await identifyCat(formData);

    expect(result.error).toBe('No image provided');
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
                  confidence: 0.95,
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
    // Mock arrayBuffer since it's used in the action
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
    formData.append('image', file);

    const result = await identifyCat(formData);

    expect(result.emsCode).toBe('BRI n 24');
    expect(result.detected).toBe(true);
    expect(result.message).toBe('British Shorthair Black Spotted Tabby');
    expect(result.confidence).toBe(95);
  });

  /**
   * @test Gemini API failure
   * @description Verifies that the action returns an error when the upstream API fails.
   */
  it('returns error if Gemini API request fails', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    const formData = new FormData();
    const file = new File(['mock-image-content'], 'cat.jpg', {
      type: 'image/jpeg',
    });
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
    formData.append('image', file);

    const result = await identifyCat(formData);

    expect(result.error).toBe('Failed to process image');
  });

  /**
   * @test Robust JSON parsing
   * @description Verifies that the action can handle JSON wrapped in markdown code blocks.
   */
  it('handles JSON response wrapped in markdown', async () => {
    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: '```json\n{"ems_code": "MCO n 03", "detected": true, "message": "Maine Coon bicolor", "confidence": 100}\n```',
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

    const result = await identifyCat(formData);

    expect(result.emsCode).toBe('MCO n 03');
    expect(result.detected).toBe(true);
  });
});
