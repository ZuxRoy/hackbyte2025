import React, { useState, useEffect } from "react";
import axios from "axios";

const AadhaarOCR = () => {
  const [image, setImage] = useState(null);
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const API_KEY = "AIzaSyCJiPMh3iLgdHB4MXdzYvIl-wvONCWkdpw";

  useEffect(() => {
    if (image) {
      const objectUrl = URL.createObjectURL(image);
      setPreview(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [image]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const getBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]); 
      reader.onerror = (error) => reject(error);
    });

  const extractData = async () => {
    if (!image) {
      alert("Please upload an image first.");
      return;
    }

    setLoading(true);

    try {
      const base64Image = await getBase64(image);

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Image,
                  },
                },
                {
                  text: "Extract the Date of Birth and mention which government's document this is.",
                },
              ],
            },
          ],
        }
      );

      const text = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No text found";

      const dobMatch = text.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
      setDob(dobMatch ? dobMatch[0] : "DOB not found");

      setCountry(text.includes("Government of India") ? "India" : "Not detected");
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to extract data. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-6 rounded-lg shadow-md w-96 text-center">
        <h2 className="text-xl font-semibold">Aadhaar OCR Extraction</h2>
        <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-4" />
        {preview && <img src={preview} alt="Uploaded Aadhaar" className="mt-4 w-full rounded-md" />}
        <button
          onClick={extractData}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md"
          disabled={loading}
        >
          {loading ? "Processing..." : "Extract Details"}
        </button>
        {dob && <p className="mt-4 text-lg">📅 DOB: {dob}</p>}
        {country && <p className="mt-2 text-lg">🏛️ Government: {country}</p>}
      </div>
    </div>
  );
};

export default AadhaarOCR;