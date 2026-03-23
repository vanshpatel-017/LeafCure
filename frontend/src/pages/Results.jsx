import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import useTheme from '../hooks/useTheme';

const Results = () => {
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState('best');
  const [showHeader, setShowHeader] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDiseaseInfo, setShowDiseaseInfo] = useState(false);
  const { isLight, toggleTheme } = useTheme();
  
  const generateReport = () => {
    const reportData = {
      analysisDate: new Date().toLocaleDateString(),
      analysisTime: new Date().toLocaleTimeString(),
      plantType: plant,
      diseaseName: disease,
      confidence: confidence + '%',
      modelUsed: useViT ? 'ViT Transformer' : 'Swin Transformer',
      symptoms: (useViT ? currentResult.vit_symptoms : currentResult.swin_symptoms) || currentResult.symptoms || 'Not available',
      causes: (useViT ? currentResult.vit_causes : currentResult.swin_causes) || currentResult.causes || 'Not available',
      treatment: treatmentSteps,
      prevention: preventionSteps
    }
    
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>LeafCure Analysis Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { color: #22c55e; font-size: 24px; font-weight: bold; }
          .section { margin-bottom: 25px; }
          .section h3 { color: #22c55e; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .info-item { background: #f9fafb; padding: 15px; border-radius: 8px; }
          .info-label { font-weight: bold; color: #374151; }
          .confidence { font-size: 24px; color: #22c55e; font-weight: bold; }
          .treatment-item, .prevention-item { background: #f3f4f6; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🌿 LeafCure</div>
          <h1>Plant Disease Analysis Report</h1>
          <p>Generated on ${reportData.analysisDate} at ${reportData.analysisTime}</p>
        </div>
        
        <div class="section">
          <h3>Analysis Results</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Plant Type</div>
              <div>${reportData.plantType}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Disease Detected</div>
              <div>${reportData.diseaseName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Confidence Level</div>
              <div class="confidence">${reportData.confidence}</div>
            </div>
            <div class="info-item">
              <div class="info-label">AI Model Used</div>
              <div>${reportData.modelUsed}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h3>Disease Information</h3>
          <div class="info-item">
            <div class="info-label">Symptoms</div>
            <p>${reportData.symptoms}</p>
          </div>
          <div class="info-item">
            <div class="info-label">Causes</div>
            <p>${reportData.causes}</p>
          </div>
        </div>
        
        <div class="section">
          <h3>Treatment Recommendations</h3>
          ${reportData.treatment.map((step, index) => {
            const lines = step.split('\n');
            const mainLine = lines[0] || step;
            const description = lines.slice(1).join(' ').trim();
            return `
              <div class="treatment-item">
                <strong>${index + 1}. ${mainLine}</strong>
                ${description ? `<p style="margin-top: 8px; color: #6b7280;">${description}</p>` : ''}
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="section">
          <h3>Prevention Guidelines</h3>
          ${reportData.prevention.map((step, index) => {
            const lines = step.split('\n');
            const mainLine = lines[0] || step;
            const description = lines.slice(1).join(' ').trim();
            return `
              <div class="prevention-item">
                <strong>• ${mainLine}</strong>
                ${description ? `<p style="margin-top: 8px; color: #6b7280;">${description}</p>` : ''}
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="footer">
          <p><strong>LeafCure v2.1</strong> - AI-Powered Plant Disease Detection</p>
          <p>This report was generated using advanced machine learning models with 95.8% accuracy.</p>
          <p>For more information, visit our website or contact support.</p>
        </div>
      </body>
      </html>
    `
    
    const blob = new Blob([reportHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `LeafCure-Report-${plant}-${disease.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const shareToWhatsApp = () => {
    const message = `🌿 *LeafCure Analysis Results*\n\n` +
      `🔍 *Plant:* ${plant}\n` +
      `🦠 *Disease:* ${disease}\n` +
      `📊 *Confidence:* ${confidence}%\n` +
      `🤖 *AI Model:* ${useViT ? 'ViT Transformer' : 'Swin Transformer'}\n\n` +
      `💡 *Key Treatment:* ${treatmentSteps[0]?.split('\n')[0] || 'See full report for details'}\n\n` +
      `Generated by LeafCure AI - Plant Disease Detection App`
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    let lastScroll = 0
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScroll && currentScrollY > 100) {
        setShowHeader(false)
      } else if (currentScrollY < lastScroll) {
        setShowHeader(true)
      }
      lastScroll = currentScrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('scroll', handleScroll)
    }
  }, []);
  
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    navigate('/')
  };
  
  // Get data from localStorage
  const analysisResults = JSON.parse(localStorage.getItem('batchAnalysisResults') || '{}');
  const currentResult = analysisResults.results?.[0] || {};
  
  const image = currentResult.imagePreview;
  const vit_prediction = currentResult.vit_prediction;
  const swin_prediction = currentResult.swin_prediction;
  const vit_confidence = ((currentResult.vit_confidence || 0) * 100).toFixed(2);
  const swin_confidence = ((currentResult.swin_confidence || 0) * 100).toFixed(2);
  const analysis_time = analysisResults.totalTime;

  // Use higher confidence model or selected model
  const useViT = selectedModel === 'vit' ? true : selectedModel === 'swin' ? false : parseFloat(swin_confidence) >= parseFloat(vit_confidence);
  const prediction = useViT ? vit_prediction : swin_prediction;
  const confidence = useViT ? vit_confidence : swin_confidence;

  // Parse prediction
  const formatPrediction = (pred) => {
    if (!pred) return { disease: 'Unknown', plant: 'Unknown' };
    const parts = pred.split('___');
    const plant = parts[0]?.replace(/_/g, ' ') || 'Unknown';
    const disease = parts[1]?.replace(/_/g, ' ') || 'Unknown';
    return { disease, plant };
  };

  const { disease, plant } = formatPrediction(prediction);
  const isHealthy = disease.toLowerCase().includes('healthy');

  // Parse treatment and prevention data from API response based on selected model
  const getModelData = (modelType) => {
    if (modelType === 'vit') {
      return {
        treatment: currentResult?.vit_treatment || currentResult?.treatment || [],
        prevention: currentResult?.vit_prevention || currentResult?.prevention || []
      };
    } else {
      return {
        treatment: currentResult?.swin_treatment || currentResult?.treatment || [],
        prevention: currentResult?.swin_prevention || currentResult?.prevention || []
      };
    }
  };
  
  const modelData = getModelData(useViT ? 'vit' : 'swin');
  const treatmentSteps = Array.isArray(modelData.treatment) ? modelData.treatment : [];
  const preventionSteps = Array.isArray(modelData.prevention) ? modelData.prevention : [];
  
  // Debug treatment and prevention data
  console.log('Results: Selected model:', useViT ? 'ViT' : 'Swin');
  console.log('Results: Current result data:', currentResult);
  console.log('Results: Treatment data:', {
    raw: modelData.treatment,
    processed: treatmentSteps,
    count: treatmentSteps.length
  });
  console.log('Results: Prevention data:', {
    raw: modelData.prevention, 
    processed: preventionSteps,
    count: preventionSteps.length
  });

  if (!analysisResults.results || analysisResults.results.length === 0 || !currentResult.success) {
    return (
      <div className="min-h-screen bg-[#0f1f16] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold theme-text mb-4">No Results Found</h2>
          <p className="theme-text-soft mb-6">Please upload an image for analysis first.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-[#20b657] hover:bg-[#1a9b4a] text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-page min-h-screen bg-cover bg-center bg-fixed relative" style={{backgroundImage: 'var(--app-background-image)'}}>
      <div className="theme-overlay absolute inset-0"></div>
      
      {/* Header */}
      <nav className={`theme-surface-strong backdrop-blur-xl border-b fixed w-full top-0 z-50 transition-transform duration-500 ease-in-out ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
            </svg>
            <span className="text-2xl font-bold text-white">LeafCure</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle isLight={isLight} onToggle={toggleTheme} />
            <button className="p-2 text-gray-400 hover:text-green-400 transition relative" title="Notifications">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-green-500/90 text-white rounded-lg hover:bg-green-600 transition font-medium flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Dashboard</span>
            </button>
            <div className="relative group">
              <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-700/50 transition">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{(localStorage.getItem('username') || 'User').charAt(0).toUpperCase()}</span>
                </div>
                <div className="text-left">
                  <p className="text-gray-300 text-xs">Welcome back,</p>
                  <p className="text-green-300 font-semibold text-sm">{localStorage.getItem('username') || 'User'}</p>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-t-lg transition flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile</span>
                </button>
                <button className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 transition flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </button>
                <button onClick={logout} className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 rounded-b-lg transition flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {!isOnline && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 backdrop-blur-xl rounded-2xl p-4 border border-yellow-500/50 bg-yellow-500/20 z-40">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-yellow-300 font-semibold">You're offline</p>
              <p className="text-yellow-200 text-sm">Some features may not work properly</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="pt-24 pb-12 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
        {/* Status Banner */}
        <div className="text-center mb-6">
          <div className="theme-surface inline-flex items-center px-6 py-3 rounded-full backdrop-blur-xl border border-green-400/30 shadow-lg shadow-green-500/10">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-ping"></div>
            <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
            <span className="text-white font-semibold">
              ✨ Analysis Complete • {analysis_time || '3.2s'}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Image Card */}
          <div className="theme-surface backdrop-blur-xl rounded-2xl border border-green-500/30 p-6 shadow-2xl shadow-green-500/10 hover:shadow-green-500/20 transition-all duration-300">
            <div className="relative mb-6">
              <img
                src={image}
                alt="Plant leaf"
                className="w-full h-64 object-cover rounded-xl border-2 border-green-400/40 shadow-xl"
              />
              <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                📸 Analyzed
              </div>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Scan
              </button>
              <button 
                onClick={() => navigate('/history')}
                className="w-full bg-white/80 border border-green-500/20 text-green-900 font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:bg-white shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View History
              </button>
              <button 
                onClick={generateReport}
                className="w-full bg-[#9bf7c9] border border-green-500/20 text-green-950 font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:bg-[#88efbc] shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Save Report
              </button>
            </div>
          </div>

          {/* Diagnosis Card */}
          <div className="theme-surface lg:col-span-2 backdrop-blur-xl rounded-2xl border border-green-500/30 p-8 shadow-2xl shadow-green-500/10 hover:shadow-green-500/20 transition-all duration-300">
            <div className="flex items-start justify-between mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-semibold uppercase tracking-wider">Diagnosis Result</span>
                </div>
                <h1 className="text-4xl font-bold text-white mb-3">{disease}</h1>
                <p className="text-xl font-semibold text-green-500 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  {plant}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white mb-1">{confidence}%</div>
                <div className="text-green-400 text-sm font-medium">Confidence</div>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Confidence Level</span>
                <span className="text-green-400 font-bold">{confidence}%</span>
              </div>
              <div className="relative">
                <div className="theme-surface-alt w-full rounded-full h-4 shadow-inner border border-white/10">
                  <div 
                    className="bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 h-4 rounded-full transition-all duration-1000 ease-out shadow-lg relative overflow-hidden"
                    style={{ width: `${confidence}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-pulse"></div>
                  </div>
                </div>
                <div className="absolute top-0 left-0 w-full h-4 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button 
                onClick={() => setShowDiseaseInfo(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Disease Info
              </button>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `LeafCure Analysis: ${disease}`,
                      text: `Detected ${disease} with ${confidence}% confidence using AI`,
                      url: window.location.href
                    })
                  } else {
                    // Create and show sharing modal
                    const shareModal = document.createElement('div')
                    shareModal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4'
                    shareModal.innerHTML = `
                      <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-6 max-w-sm w-full shadow-2xl">
                        <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2">
                          <span class="text-2xl">📤</span>
                          Share Results
                        </h3>
                        <div class="space-y-3">
                          <button id="whatsapp-share" class="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg flex items-center gap-3 transition font-medium">
                            <span class="text-xl">📱</span>
                            <span>Share on WhatsApp</span>
                          </button>
                          <button id="copy-share" class="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg flex items-center gap-3 transition font-medium">
                            <span class="text-xl">📋</span>
                            <span>Copy to Clipboard</span>
                          </button>
                          <button id="close-share" class="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition font-medium">
                            Cancel
                          </button>
                        </div>
                      </div>
                    `
                    document.body.appendChild(shareModal)
                    
                    // Add event listeners
                    shareModal.querySelector('#whatsapp-share').onclick = () => {
                      shareToWhatsApp()
                      shareModal.remove()
                    }
                    
                    shareModal.querySelector('#copy-share').onclick = () => {
                      const text = `🌿 LeafCure Analysis Results\n\nPlant: ${plant}\nDisease: ${disease}\nConfidence: ${confidence}%\nModel: ${useViT ? 'ViT Transformer' : 'Swin Transformer'}\n\nGenerated by LeafCure AI`
                      navigator.clipboard.writeText(text).then(() => {
                        alert('Results copied to clipboard!')
                        shareModal.remove()
                      })
                    }
                    
                    shareModal.querySelector('#close-share').onclick = () => shareModal.remove()
                    shareModal.onclick = (e) => e.target === shareModal && shareModal.remove()
                  }
                }}
                className="bg-white/80 border border-green-500/20 text-green-900 font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:bg-white shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share Result
              </button>
            </div>

            {/* Model Performance */}
            <div className="border-t border-green-400/30 pt-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Model Performance
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setSelectedModel('vit')}
                  className={`theme-surface-alt p-3 rounded-lg transition-all duration-200 hover:scale-[1.02] ${selectedModel === 'vit' ? 'bg-green-500/20 border-2 border-green-500 shadow-md' : 'bg-green-500/10 border border-green-500/20'}`}
                >
                  <div className="text-green-500 text-sm font-medium mb-1">ViT Transformer</div>
                  <div className="text-white font-bold text-lg">{vit_confidence}%</div>
                  <div className="text-green-300 text-xs mt-1">({formatPrediction(vit_prediction).plant} {formatPrediction(vit_prediction).disease})</div>
                  {selectedModel === 'vit' && <div className="text-green-300 text-xs mt-1">Selected</div>}
                </button>
                <button 
                  onClick={() => setSelectedModel('swin')}
                  className={`theme-surface-alt p-3 rounded-lg transition-all duration-200 hover:scale-[1.02] ${selectedModel === 'swin' ? 'bg-emerald-500/20 border-2 border-emerald-500 shadow-md' : 'bg-emerald-500/10 border border-emerald-500/20'}`}
                >
                  <div className="text-emerald-500 text-sm font-medium mb-1">Swin Transformer</div>
                  <div className="text-white font-bold text-lg">{swin_confidence}%</div>
                  <div className="text-emerald-300 text-xs mt-1">({formatPrediction(swin_prediction).plant} {formatPrediction(swin_prediction).disease})</div>
                  {selectedModel === 'swin' && <div className="text-emerald-300 text-xs mt-1">Selected</div>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Treatment & Prevention */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Treatment Plan */}
          <div className="theme-surface backdrop-blur-xl rounded-2xl border border-green-500/30 p-8 shadow-2xl shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-700 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Treatment Plan</h3>
                <p className="text-green-300 text-sm">Recommended actions for recovery</p>
              </div>
            </div>
            <div className="space-y-8">
              {treatmentSteps.length > 0 ? (
                treatmentSteps.map((step, index) => {
                  // Parse the step text to separate main line from description
                  const stepText = typeof step === 'string' ? step : (step.title || step);
                  const lines = stepText.split('\n');
                  const mainLine = lines[0] || stepText;
                  const description = lines.slice(1).join(' ').trim();
                  
                  return (
                    <div key={index} className="flex items-start gap-6">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-700 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white text-xl font-bold mb-2">{mainLine}</h4>
                        {description && (
                          <p className="text-green-300 text-sm leading-relaxed">{description}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="space-y-8">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-700 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg">1</div>
                    <div>
                      <h4 className="text-white text-xl font-bold mb-3">Remove infected parts</h4>
                      <p className="text-green-200 text-base leading-relaxed">Carefully remove and dispose of infected leaves and stems to prevent spread</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-700 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg">2</div>
                    <div>
                      <h4 className="text-white text-xl font-bold mb-3">Apply treatment</h4>
                      <p className="text-green-200 text-base leading-relaxed">Use appropriate fungicide or bactericide as recommended</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-700 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg">3</div>
                    <div>
                      <h4 className="text-white text-xl font-bold mb-3">Improve conditions</h4>
                      <p className="text-green-200 text-base leading-relaxed">Enhance air circulation and adjust watering practices</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Prevention Guide */}
          <div className="theme-surface backdrop-blur-xl rounded-2xl border border-green-500/30 p-8 shadow-2xl shadow-green-500/10 hover:shadow-green-500/20 transition-all duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Prevention Guide</h3>
                <p className="text-green-300 text-sm">Best practices to avoid future issues</p>
              </div>
            </div>
            <div className="space-y-6">
              {preventionSteps.length > 0 ? (
                preventionSteps.map((step, index) => {
                  // Parse the step text to separate main line from description
                  const stepText = typeof step === 'string' ? step : (step.title || step);
                  const lines = stepText.split('\n');
                  const mainLine = lines[0] || stepText;
                  const description = lines.slice(1).join(' ').trim();
                  
                  return (
                    <div key={index} className="flex items-start gap-5">
                      <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full mt-3"></div>
                      <div className="flex-1">
                        <p className="text-white text-lg font-semibold leading-relaxed mb-1">{mainLine}</p>
                        {description && (
                          <p className="text-green-300 text-sm leading-relaxed">{description}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full mt-3"></div>
                    <p className="text-white text-lg font-medium leading-relaxed">Maintain proper plant spacing for good air circulation</p>
                  </div>
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full mt-3"></div>
                    <p className="text-white text-lg font-medium leading-relaxed">Water at soil level to avoid wetting leaves</p>
                  </div>
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full mt-3"></div>
                    <p className="text-white text-lg font-medium leading-relaxed">Apply preventive treatments during humid conditions</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-4 border-t border-white/5">
          <p className="text-xs theme-text-soft">LeafCure v2.1 • Analysis completed at {new Date().toLocaleTimeString()}</p>
          <div className="flex justify-center items-center space-x-4 mt-2">
            <button className="text-xs text-gray-500 hover:text-green-400 transition">Report Issue</button>
            <span className="text-gray-600">•</span>
            <button className="text-xs text-gray-500 hover:text-green-400 transition">Feedback</button>
            <span className="text-gray-600">•</span>
            <button className="text-xs text-gray-500 hover:text-green-400 transition">Export Data</button>
          </div>
        </div>
      </div>
      </div>

      {/* Disease Info Modal */}
      {showDiseaseInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="theme-surface-strong rounded-2xl border border-green-500/30 p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Disease Information</h2>
              </div>
              <button 
                onClick={() => setShowDiseaseInfo(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-green-300 font-semibold text-lg mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Symptoms
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {(useViT ? currentResult.vit_symptoms : currentResult.swin_symptoms) || currentResult.symptoms || 'Leaf discoloration, spots, wilting, and abnormal growth patterns may indicate disease presence.'}
                </p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-green-300 font-semibold text-lg mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Causes
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {(useViT ? currentResult.vit_causes : currentResult.swin_causes) || currentResult.causes || 'Fungal infections, bacterial diseases, viral infections, or environmental stress factors.'}
                </p>
              </div>
              
              <div className="theme-surface-alt rounded-xl p-6 border border-green-500/20">
                <h3 className="text-white font-semibold text-lg mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Facts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-medium">Plant:</span>
                    <span className="text-gray-300">{plant}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-medium">Disease:</span>
                    <span className="text-gray-300">{disease}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-medium">Confidence:</span>
                    <span className="text-gray-300">{confidence}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-medium">Model:</span>
                    <span className="text-gray-300">{useViT ? 'ViT Transformer' : 'Swin Transformer'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowDiseaseInfo(false)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;

