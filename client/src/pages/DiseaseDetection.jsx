import React, { useState, useEffect, useRef } from 'react';
import { detectDiseaseFast, enhanceTreatment } from '../api/diseaseApi';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() })),
          'image/jpeg', 0.8
        );
      };
    };
  });
};

// Shimmer skeleton for loading state
const Shimmer = ({ width = '100%', height = '16px', radius = '6px' }) => (
  <div style={{
    width, height, borderRadius: radius,
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
  }} />
);

export default function DiseaseDetection() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [image, setImage]           = useState(null);
  const [preview, setPreview]       = useState(null);
  const [cropType, setCropType]     = useState('Unknown/Other');

  // Stage 1 state
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);
  const [errorType, setErrorType]   = useState(null);

  // Stage 2 (Groq) state
  const [enhancing, setEnhancing]   = useState(false);  // true while Groq is running
  const [enhanced, setEnhanced]     = useState(false);  // true once Groq has responded

  const enhanceAbortRef = useRef(null); // lets us cancel stale enhance calls

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setErrorType(null);
      setEnhancing(false);
      setEnhanced(false);
    }
  };

  const handleUpload = async () => {
    if (!image) return;

    // Cancel any in-flight enhance request from a previous analysis
    if (enhanceAbortRef.current) enhanceAbortRef.current = true;
    const abortToken = { cancelled: false };
    enhanceAbortRef.current = abortToken;

    setLoading(true);
    setResult(null);
    setError(null);
    setErrorType(null);
    setEnhancing(false);
    setEnhanced(false);

    try {
      // ── STAGE 1: instant local result ──────────────────────────────────────
      const compressed = await compressImage(image);
      const res = await detectDiseaseFast(compressed, cropType);
      setResult(res.data);
      setLoading(false);

      // ── STAGE 2: kick off Groq in the background ───────────────────────────
      if (res.data?.predicted_class) {
        setEnhancing(true);
        try {
          const enhanced_res = await enhanceTreatment(
            res.data.predicted_class,
            res.data.confidence,
            cropType
          );
          // Only apply if this call isn't stale (user didn't upload a new image)
          if (!abortToken.cancelled) {
            setResult(prev => ({ ...prev, ...enhanced_res.data }));
            setEnhanced(true);
          }
        } catch (groqErr) {
          console.warn('Groq enhancement failed, keeping local result:', groqErr);
        } finally {
          if (!abortToken.cancelled) setEnhancing(false);
        }
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      const errData = err.response?.data;
      setError(errData?.error || 'Failed to detect disease. Please try again.');
      setErrorType(errData?.error_type || 'server_error');
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .ai-badge-pulse span { animation: pulse-dot 1.2s ease-in-out infinite; }
        .ai-badge-pulse span:nth-child(2) { animation-delay: 0.2s; }
        .ai-badge-pulse span:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Plant Disease Detection 🌿</h1>

            {/* ── Upload card ── */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
              <p className="text-gray-600 mb-4">
                Upload a photo of a sick plant leaf. Our Vision AI will automatically detect
                the disease and recommend the best treatments.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Crop Type</label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full max-w-xs border border-gray-300 rounded-lg p-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="Unknown/Other">Unknown / Other</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Apple">Apple</option>
                  <option value="Potato">Potato</option>
                  <option value="Corn (Maize)">Corn (Maize)</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Grape">Grape</option>
                  <option value="Strawberry">Strawberry</option>
                </select>
              </div>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-green-300 rounded-xl p-8 bg-green-50">
                {preview ? (
                  <img src={preview} alt="Plant Preview" className="h-64 object-cover rounded-lg mb-4 shadow-sm" />
                ) : (
                  <div className="text-6xl mb-4">📸</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full max-w-xs text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-green-100 file:text-green-700
                    hover:file:bg-green-200 cursor-pointer"
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={!image || loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium shadow-sm transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Analyzing…
                    </span>
                  ) : 'Analyze Image'}
                </button>
              </div>
            </div>

            {/* ── Error: not a plant ── */}
            {error && errorType === 'invalid_image' && (
              <div style={{
                background: 'linear-gradient(135deg, #fff7ed 0%, #fff1f2 100%)',
                border: '1.5px solid #fca5a5',
                borderRadius: '16px',
                marginBottom: '24px',
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(239,68,68,0.08)'
              }}>
                <div style={{
                  background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)',
                  padding: '14px 24px',
                  display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <span style={{ fontSize: '22px' }}>🚫</span>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>
                    Image Rejected — Not a Plant
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '20px', padding: '20px 24px', alignItems: 'flex-start' }}>
                  {preview && (
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img src={preview} alt="Rejected"
                        style={{ width: '90px', height: '90px', objectFit: 'cover',
                          borderRadius: '10px', border: '2px solid #fca5a5',
                          opacity: 0.75, filter: 'grayscale(30%)' }}
                      />
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(239,68,68,0.15)'
                      }}>
                        <span style={{ fontSize: '28px' }}>✕</span>
                      </div>
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#b91c1c', fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>
                      {error}
                    </p>
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: '8px',
                      background: '#fff', borderRadius: '10px',
                      padding: '10px 14px', border: '1px solid #fed7aa', marginTop: '10px'
                    }}>
                      <span style={{ fontSize: '18px', marginTop: '1px' }}>💡</span>
                      <div>
                        <p style={{ color: '#92400e', fontWeight: 600, fontSize: '13px', margin: 0 }}>Tip</p>
                        <p style={{ color: '#78350f', fontSize: '13px', margin: '2px 0 0' }}>
                          Take a close-up photo of a single plant leaf in good lighting.
                          Make sure the leaf fills most of the frame.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Error: server error ── */}
            {error && errorType !== 'invalid_image' && (
              <div style={{
                background: '#fef2f2', color: '#b91c1c',
                padding: '14px 18px', borderRadius: '10px',
                marginBottom: '24px', border: '1px solid #fecaca',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <span style={{ fontWeight: 500 }}>{error}</span>
              </div>
            )}

            {/* ── Result card ── */}
            {result && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                style={{ animation: 'fadeInUp 0.35s ease' }}>

                {/* Header */}
                <div style={{
                  background: 'linear-gradient(90deg, #16a34a 0%, #15803d 100%)',
                  padding: '16px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '18px', margin: 0 }}>
                    Diagnosis Result
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Groq status badge */}
                    {enhancing && (
                      <span style={{
                        background: 'rgba(255,255,255,0.18)',
                        color: '#fff', fontSize: '12px', fontWeight: 600,
                        padding: '4px 10px', borderRadius: '99px',
                        display: 'flex', alignItems: 'center', gap: '5px'
                      }} className="ai-badge-pulse">
                        ✨ AI enhancing
                        <span>.</span><span>.</span><span>.</span>
                      </span>
                    )}
                    {enhanced && !enhancing && (
                      <span style={{
                        background: 'rgba(255,255,255,0.18)',
                        color: '#fff', fontSize: '12px', fontWeight: 600,
                        padding: '4px 10px', borderRadius: '99px'
                      }}>
                        ✨ AI Enhanced
                      </span>
                    )}
                    <span style={{
                      background: 'rgba(255,255,255,0.18)',
                      color: '#fff', fontSize: '13px', fontWeight: 600,
                      padding: '4px 12px', borderRadius: '99px'
                    }}>
                      {result.confidence}% Confidence
                    </span>
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  {/* Disease name */}
                  <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280',
                      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                      Detected Condition
                    </p>
                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>
                      {result.disease_name}
                    </p>
                    <p style={{ color: '#4b5563', marginTop: '8px', lineHeight: 1.6 }}>
                      {result.description}
                    </p>
                  </div>

                  {/* Treatment cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                    {/* Organic */}
                    <div style={{
                      background: '#f0fdf4', borderRadius: '12px',
                      border: '1px solid #bbf7d0', padding: '16px'
                    }}>
                      <h3 style={{ color: '#14532d', fontWeight: 700, marginBottom: '10px',
                        display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🌱 Organic Treatment
                      </h3>
                      {enhancing && !enhanced ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <Shimmer width="100%" height="14px" />
                          <Shimmer width="85%" height="14px" />
                          <Shimmer width="92%" height="14px" />
                          <Shimmer width="70%" height="14px" />
                        </div>
                      ) : (
                        <p style={{ color: '#166534', fontSize: '14px', lineHeight: 1.65, margin: 0 }}>
                          {result.organic_treatment}
                        </p>
                      )}
                    </div>

                    {/* Chemical */}
                    <div style={{
                      background: '#eff6ff', borderRadius: '12px',
                      border: '1px solid #bfdbfe', padding: '16px'
                    }}>
                      <h3 style={{ color: '#1e3a8a', fontWeight: 700, marginBottom: '10px',
                        display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🧪 Chemical Treatment
                      </h3>
                      {enhancing && !enhanced ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <Shimmer width="100%" height="14px" />
                          <Shimmer width="78%" height="14px" />
                          <Shimmer width="88%" height="14px" />
                          <Shimmer width="65%" height="14px" />
                        </div>
                      ) : (
                        <p style={{ color: '#1d4ed8', fontSize: '14px', lineHeight: 1.65, margin: 0 }}>
                          {result.chemical_treatment}
                        </p>
                      )}
                    </div>

                  </div>

                  {/* Source tag */}
                  <p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '16px', textAlign: 'right' }}>
                    {enhanced
                      ? 'Treatment enhanced by Groq AI ✨'
                      : enhancing
                        ? 'Local knowledge base · AI enhancement in progress…'
                        : 'Local knowledge base'}
                  </p>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
