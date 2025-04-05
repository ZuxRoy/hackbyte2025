import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [step, setStep] = useState(1);
  const [image, setImage] = useState(null);
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const API_KEY = 'AIzaSyCJiPMh3iLgdHB4MXdzYvIl-wvONCWkdpw';

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
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });

  const extractData = async () => {
    if (!image) {
      alert('Please upload an image first.');
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
                    mimeType: 'image/jpeg',
                    data: base64Image,
                  },
                },
                {
                  text: 'Extract the Date of Birth and mention which government document this is.',
                },
              ],
            },
          ],
        }
      );

      const text = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No text found';
      const dobMatch = text.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
      setDob(dobMatch ? dobMatch[0] : 'DOB not found');
      setCountry(text.includes('Government of India') ? 'India' : 'Not detected');
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to extract data. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {step === 1 && (
        <div>
          <h2>Getting started</h2>
          <p>We need some information to help us confirm your identity.</p>
          <button className="button" onClick={() => setStep(2)}>Begin verifying</button>
        </div>
      )}
      {step === 2 && (
        <div>
          <h2>Upload a photo ID</h2>
          <p>We require a photo of a government ID to verify your identity.</p>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input" />
          {preview && <img src={preview} alt="Uploaded ID" className="preview-image" />}
          <button className="button" onClick={() => setStep(3)}>Next</button>
        </div>
      )}
      {step === 3 && (
        <div>
          <h2>Extracting Data</h2>
          <p>Processing the uploaded image...</p>
          <button className="button" onClick={extractData} disabled={loading}>
            {loading ? 'Processing...' : 'Extract Details'}
          </button>
          {dob && <p className="result">📅 DOB: {dob}</p>}
          {country && <p className="result">🏛️ Government: {country}</p>}
          <button className="button secondary" onClick={() => setStep(4)}>Continue</button>
        </div>
      )}
      {step === 4 && (
        <div>
          <h2>Verify your identity</h2>
          <img src="face-scan.png" alt="Face Scan" className="image" />
          <button className="button">Start Scan</button>
        </div>
      )}
    </div>
  );
};

export default App;
