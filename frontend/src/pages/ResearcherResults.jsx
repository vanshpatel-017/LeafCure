import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import useTheme from '../hooks/useTheme'

const formatPrediction = (prediction) => {
  if (!prediction) {
    return { plant: 'Unknown', disease: 'Unknown' }
  }

  const [plant = 'Unknown', disease = 'Unknown'] = prediction.split('___')
  return {
    plant: plant.replace(/_/g, ' '),
    disease: disease.replace(/_/g, ' ')
  }
}

const toPercent = (confidence) => `${((confidence || 0) * 100).toFixed(2)}%`

const ResearcherResults = () => {
  const navigate = useNavigate()
  const [selectedModel, setSelectedModel] = useState('best')
  const { isLight, toggleTheme } = useTheme()

  const analysisResults = JSON.parse(localStorage.getItem('batchAnalysisResults') || '{}')
  const resultList = analysisResults.results || []
  const successfulResults = resultList.filter((result) => result && result.success !== false)
  const currentResult = successfulResults[0] || resultList[0] || null

  const modelDetails = useMemo(() => {
    if (!currentResult) return null

    const vitConfidence = Number(currentResult.vit_confidence || 0)
    const swinConfidence = Number(currentResult.swin_confidence || 0)

    const useViT = selectedModel === 'vit'
      ? true
      : selectedModel === 'swin'
        ? false
        : vitConfidence >= swinConfidence

    const activePrediction = useViT ? currentResult.vit_prediction : currentResult.swin_prediction

    return {
      useViT,
      vitConfidence,
      swinConfidence,
      activePrediction,
      plantAndDisease: formatPrediction(activePrediction),
      symptoms: useViT
        ? (currentResult.vit_symptoms || currentResult.symptoms || 'No symptom details available.')
        : (currentResult.swin_symptoms || currentResult.symptoms || 'No symptom details available.'),
      causes: useViT
        ? (currentResult.vit_causes || currentResult.causes || 'No cause details available.')
        : (currentResult.swin_causes || currentResult.causes || 'No cause details available.'),
      treatment: useViT
        ? (currentResult.vit_treatment || currentResult.treatment || [])
        : (currentResult.swin_treatment || currentResult.treatment || []),
      prevention: useViT
        ? (currentResult.vit_prevention || currentResult.prevention || [])
        : (currentResult.swin_prevention || currentResult.prevention || [])
    }
  }, [currentResult, selectedModel])

  if (!currentResult || !modelDetails) {
    return (
      <div className="theme-page min-h-screen flex items-center justify-center px-6">
        <div className="theme-surface text-center border rounded-2xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-3">No Research Results Found</h1>
          <p className="text-green-100/80 mb-6">Run an analysis with Researcher Mode enabled to view detailed outputs.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const heatmapSrc = currentResult.heatmap_base64
    ? `data:image/png;base64,${currentResult.heatmap_base64}`
    : null

  const treatmentSteps = Array.isArray(modelDetails.treatment) ? modelDetails.treatment : []
  const preventionSteps = Array.isArray(modelDetails.prevention) ? modelDetails.prevention : []

  return (
    <div className="theme-page min-h-screen bg-cover bg-center bg-fixed relative" style={{ backgroundImage: 'var(--app-background-image)' }}>
      <div className="theme-overlay absolute inset-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="theme-surface backdrop-blur-xl rounded-2xl border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Researcher Analysis</h1>
              <p className="text-green-200/90 mt-1">Detailed model outputs and Grad-CAM visualization</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle isLight={isLight} onToggle={toggleTheme} />
              <button
                onClick={() => navigate('/results')}
                className="px-4 py-2 rounded-lg border border-green-500/40 text-green-200 hover:bg-green-500/20 transition"
              >
                Standard View
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <div className="theme-surface backdrop-blur-xl rounded-2xl border p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Input Image</h2>
            <img src={currentResult.imagePreview} alt="Uploaded plant" className="w-full h-80 object-cover rounded-xl border border-green-500/30" />
          </div>

          <div className="theme-surface-alt backdrop-blur-xl rounded-2xl border p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Grad-CAM Heatmap</h2>
            {heatmapSrc ? (
              <img src={heatmapSrc} alt="Grad-CAM heatmap" className="w-full h-80 object-cover rounded-xl border border-amber-500/30" />
            ) : (
              <div className="h-80 rounded-xl border border-amber-500/30 bg-black/25 flex items-center justify-center text-center px-6">
                <p className="text-amber-200">Heatmap was not generated for this analysis. Try running researcher mode again.</p>
              </div>
            )}
          </div>
        </div>

        <div className="theme-surface-alt backdrop-blur-xl rounded-2xl border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <h2 className="text-white font-semibold text-lg">Model Comparison</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedModel('best')} className={`px-4 py-2 rounded-lg transition ${selectedModel === 'best' ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-200 hover:bg-white/20'}`}>
                Best
              </button>
              <button onClick={() => setSelectedModel('vit')} className={`px-4 py-2 rounded-lg transition ${selectedModel === 'vit' ? 'bg-violet-500 text-white' : 'bg-white/10 text-gray-200 hover:bg-white/20'}`}>
                ViT
              </button>
              <button onClick={() => setSelectedModel('swin')} className={`px-4 py-2 rounded-lg transition ${selectedModel === 'swin' ? 'bg-sky-500 text-white' : 'bg-white/10 text-gray-200 hover:bg-white/20'}`}>
                Swin
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
              <p className="text-violet-200 text-sm">ViT Confidence</p>
              <p className="text-white text-2xl font-bold mt-1">{toPercent(modelDetails.vitConfidence)}</p>
            </div>
            <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
              <p className="text-sky-200 text-sm">Swin Confidence</p>
              <p className="text-white text-2xl font-bold mt-1">{toPercent(modelDetails.swinConfidence)}</p>
            </div>
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
              <p className="text-green-200 text-sm">Selected Prediction</p>
              <p className="text-white font-bold mt-1">{modelDetails.plantAndDisease.plant} - {modelDetails.plantAndDisease.disease}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6" style={{ backgroundColor: 'rgba(26, 20, 38, 0.9)' }}>
            <h3 className="text-white font-semibold text-lg mb-4">Disease Notes</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-purple-200 font-medium mb-1">Symptoms</h4>
                <p className="text-gray-100/90 text-sm leading-relaxed">{modelDetails.symptoms}</p>
              </div>
              <div>
                <h4 className="text-purple-200 font-medium mb-1">Causes</h4>
                <p className="text-gray-100/90 text-sm leading-relaxed">{modelDetails.causes}</p>
              </div>
              <div>
                <h4 className="text-purple-200 font-medium mb-1">Plant Type (from backend)</h4>
                <p className="text-gray-100/90 text-sm">{currentResult.plant_type || modelDetails.plantAndDisease.plant}</p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl rounded-2xl border border-emerald-500/30 p-6" style={{ backgroundColor: 'rgba(10, 33, 26, 0.9)' }}>
            <h3 className="text-white font-semibold text-lg mb-4">Treatment and Prevention</h3>
            <div className="space-y-5 max-h-[420px] overflow-y-auto pr-2">
              <div>
                <h4 className="text-emerald-200 font-medium mb-2">Treatment Steps</h4>
                {treatmentSteps.length > 0 ? (
                  <ul className="space-y-2 text-sm text-gray-100/90 list-disc pl-5">
                    {treatmentSteps.map((step, index) => (
                      <li key={`treat-${index}`}>{typeof step === 'string' ? step : JSON.stringify(step)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-300">No treatment data available for this prediction.</p>
                )}
              </div>

              <div>
                <h4 className="text-emerald-200 font-medium mb-2">Prevention Steps</h4>
                {preventionSteps.length > 0 ? (
                  <ul className="space-y-2 text-sm text-gray-100/90 list-disc pl-5">
                    {preventionSteps.map((step, index) => (
                      <li key={`prev-${index}`}>{step}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-300">No prevention data available for this prediction.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-green-100/70 text-sm">
          {successfulResults.length} successful result(s) in this batch | Analysis time: {analysisResults.totalTime || 'N/A'}s
        </div>
      </div>
    </div>
  )
}

export default ResearcherResults
