import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const ID_TYPES = [
    'Aadhar Card',
    'Pan Card',
    'Passport',
    'Driver\'s License',
    'Passport',
];

const calculateAge = (dobString) => {
    if (!dobString) return 'N/A';

    try {
        const [day, month, year] = dobString.split('/').map(Number);
        const dobDate = new Date(year, month - 1, day);
        const currentDate = new Date();

        let age = currentDate.getFullYear() - dobDate.getFullYear();
        const monthDiff = currentDate.getMonth() - dobDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < dobDate.getDate())) {
            age--;
        }

        return age;
    } catch (error) {
        return error;
    }
};

const App = () => {
    const [step, setStep] = useState(1);
    const [image, setImage] = useState(null);
    const [dob, setDob] = useState('');
    const [country, setCountry] = useState('');
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [selectedIdType, setSelectedIdType] = useState('');
    const [showIdOptions, setShowIdOptions] = useState(false);

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
                                    text: 'Extract the Date of Birth in DD/MM/YYYY format and mention which government document this is.',
                                },
                            ],
                        },
                    ],
                }
            );

            const text = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No text found';
            const dobMatch = text.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
            setDob(dobMatch ? dobMatch[0] : '');
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
                <div className="step-content">
                    <h2>Getting started</h2>
                    <p>We need some information to help us confirm your identity.</p>
                    <button className="button" onClick={() => setStep(2)}>
                        Begin verifying
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="step-content">
                    <h2>Upload a photo ID</h2>
                    <p>We require a photo of a government ID to verify your identity.</p>

                    <div className="id-selection">
                        <div 
                            className="id-type-selector"
                            onClick={() => setShowIdOptions(!showIdOptions)}
                        >
                            {selectedIdType || 'Choose 1 of the following options'}
                            <span className="dropdown-arrow">{showIdOptions ? '▲' : '▼'}</span>
                        </div>

                        {showIdOptions && (
                            <div className="id-options">
                                {ID_TYPES.map((type) => (
                                    <div 
                                        key={type}
                                        className="id-option"
                                        onClick={() => {
                                            setSelectedIdType(type);
                                            setShowIdOptions(false);
                                        }}
                                    >
                                        {type}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedIdType && (
                        <>
                            <p className="instruction-text">
                                Front of {selectedIdType.toLowerCase()}
                                <br />
                                Take a clear photo of the front of your government ID.
                            </p>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageUpload} 
                                className="file-input" 
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="upload-button">
                                Upload a photo
                            </label>
                            {preview && <img src={preview} alt="Uploaded ID" className="preview-image" />}
                            <button 
                                className="button" 
                                onClick={() => setStep(3)}
                                disabled={!preview}
                            >
                                Continue on your device
                            </button>
                        </>
                    )}
                </div>
            )}

            {step === 3 && (
                <div className="step-content">
                    <h2>Extracting Data</h2>
                    <p>Processing the uploaded image...</p>
                    <button 
                        className="button" 
                        onClick={extractData} 
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Extract Details'}
                    </button>
                    {dob && (
                        <p className="result">
                            Age: {calculateAge(dob)} years
                        </p>
                    )}
                    {country && <p className="result">Government: {country}</p>}
                </div>
            )}
        </div>
    );
};

export default App;
