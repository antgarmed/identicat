'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    emsCode: string | null;
    detected: boolean | null;
    message: string | null;
    confidence: number | null;
  } | null>(null);

  const handleIdentify = async () => {
    if (!selectedImage) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch('/api/identify', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error identifying cat:', error);
      setResult({
        emsCode: null,
        detected: false,
        message: 'Error identifying cat. Please try again.',
        confidence: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // useCallback is used to memoize the function, preventing unnecessary re-renders
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  }, []);

  // useDropzone hook to handle drag and drop functionality
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg'],
    },
    multiple: false, // Only allow single file upload
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Indenticat</h1>
      <p className="text-lg mb-8 text-center max-w-2xl">
        Upload a cat image and we&apos;ll identify its EMS code using AI
      </p>

      <div className="w-full max-w-md space-y-4">
        <div
          {...getRootProps()}
          className={`block w-full ${
            isDragActive ? 'border-blue-500' : 'border-gray-300'
          } border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors`}
        >
          <input {...getInputProps()} />
          {preview ? (
            <div className="relative w-full aspect-square">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <p>
                {isDragActive
                  ? 'Drop the image here...'
                  : 'Click or drag and drop an image here'}
              </p>
              <p className="text-sm text-gray-500">
                Supported formats: JPG, PNG
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleIdentify}
          disabled={!selectedImage || loading}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
            selectedImage ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'
          } transition-colors disabled:cursor-not-allowed`}
        >
          {loading ? 'Identicating...' : 'IDENTICATE'}
        </button>

        {result && (
          <div className="p-4 bg-blue-100 rounded-lg text-black">
            {result.detected ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex flex-wrap gap-2">
                    {result.emsCode?.split(' ').map((code, index) => (
                      <span
                        key={index}
                        className="inline-block bg-blue-500 text-white text-sm font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                  {result.confidence !== null && (
                    <span className="text-sm font-bold text-blue-800">
                      {result.confidence}%
                    </span>
                  )}
                </div>
                {result.message && (
                  <p className="mt-2 text-sm">{result.message}</p>
                )}
              </>
            ) : (
              <p>
                {result.message || 'No cat detected or unable to identify.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
