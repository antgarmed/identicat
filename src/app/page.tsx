"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    emsCode: string | null;
    detected: boolean | null;
    message: string | null;
  } | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleIdentify = async () => {
    if (!selectedImage) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);

      const response = await fetch("/api/identify", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error identifying cat:", error);
      setResult({
        emsCode: null,
        detected: false,
        message: "Error identifying cat. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Indenticat</h1>
      <p className="text-lg mb-8 text-center max-w-2xl">
        Upload a cat image and we&apos;ll identify its EMS code using AI
      </p>

      <div className="w-full max-w-md space-y-4">
        <label className="block w-full">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors">
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
                <p>Click or drag and drop an image here</p>
                <p className="text-sm text-gray-500">
                  Supported formats: JPG, PNG
                </p>
              </div>
            )}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
        </label>

        <button
          onClick={handleIdentify}
          disabled={!selectedImage || loading}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
            selectedImage ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400"
          } transition-colors disabled:cursor-not-allowed`}
        >
          {loading ? "Identicating..." : "IDENTICATE"}
        </button>

        {result && (
          <div className="p-4 bg-blue-100 rounded-lg text-black">
            <h2 className="font-medium mb-2">Result:</h2>
            {result.emsCode ? (
              <>
                <p>EMS Code: {result.emsCode}</p>
                {result.message && <p>{result.message}</p>}
              </>
            ) : (
              <p>
                {result.message || "No cat detected or unable to identify."}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
