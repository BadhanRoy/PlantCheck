import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import SmartAgroBot from '../smartagro/SmartAgroBot.jsx';
import '../smartagro/styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';
const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8001';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const formatPredictionLabel = (label) => {
  if (!label) return 'Unknown plant condition';

  const cleaned = label
    .replace(/___/g, ' - ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const getStatusFromLabel = (label) => {
  if (!label) return 'Needs Attention';
  return label.toLowerCase().includes('healthy') ? 'Healthy' : 'Needs Attention';
};

function DiagnosePage() {
  const { user } = useAuthStore();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  // Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', text: 'Hello! I am your plant assistant. Ask me anything about plant care.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const handleSendMessageRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isChatOpen]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(transcript);
        handleSendMessageRef.current?.(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  handleSendMessageRef.current = handleSendMessage;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please choose a JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      alert('That image is larger than 10 MB. Please choose a smaller file.');
      return;
    }

    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('file', image);

      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || 'Prediction failed');
      }

      const predictionLabel = data?.label || 'Unknown plant condition';
      const confidence = Number(data?.confidence || 0);

      if (data?.supported === false) {
        const unsupportedResult = {
          plantName: 'Unsupported image',
          status: 'Unsupported',
          confidence,
          issues: [data.reason || 'This image is outside the supported disease dataset.'],
          recommendations: [
            'Upload a clear close-up photo of a single leaf.',
            'Use a clear leaf image from one of the crops represented in the PlantWild dataset.',
            'Make sure the leaf fills most of the image and has visible detail.',
          ],
          alternatives: [],
        };
        setResult(unsupportedResult);

        const unsupportedHistory = new FormData();
        unsupportedHistory.append('plantName', 'Unsupported image');
        unsupportedHistory.append('diagnosis', 'Unsupported image');
        unsupportedHistory.append('status', 'Unsupported');
        unsupportedHistory.append('confidence', String(confidence));
        unsupportedHistory.append('issues', JSON.stringify(unsupportedResult.issues));
        unsupportedHistory.append('recommendations', JSON.stringify(unsupportedResult.recommendations));
        unsupportedHistory.append('treatment', 'null');
        unsupportedHistory.append('explainability', 'null');
        unsupportedHistory.append('image', image);
        await fetch(`${API_URL}/api/diagnoses`, {
          method: 'POST',
          credentials: 'include',
          body: unsupportedHistory,
        });
        return;
      }

      const plantName = formatPredictionLabel(predictionLabel);
      const status = getStatusFromLabel(predictionLabel);
      const alternatives = Array.isArray(data?.alternatives)
        ? data.alternatives.slice(1).map((alternative) => ({
            label: formatPredictionLabel(alternative.label),
            confidence: Number(alternative.confidence || 0),
          }))
        : [];

      const diagnosisResult = {
        plantName,
        status,
        confidence,
        issues: [
          status === 'Healthy'
            ? 'Plant looks healthy based on the model prediction.'
            : `Detected condition: ${plantName}.`
        ],
        recommendations: [
          status === 'Healthy'
            ? 'Keep regular watering and sunlight monitoring.'
            : 'Inspect the plant closely for stress, nutrient imbalance, or pest activity.',
          `Model confidence: ${confidence.toFixed(2)}%`,
          'Continue monitoring the plant and compare with visible symptoms.'
        ],
        alternatives,
        explainability: data?.explainability || null,
        treatment: data?.treatment || null,
      };

      setResult(diagnosisResult);

      const historyFormData = new FormData();
      historyFormData.append('plantName', plantName);
      historyFormData.append('diagnosis', plantName);
      historyFormData.append('status', status);
      historyFormData.append('confidence', String(confidence));
      historyFormData.append('issues', JSON.stringify(diagnosisResult.issues));
      historyFormData.append('recommendations', JSON.stringify(diagnosisResult.recommendations));
      historyFormData.append('treatment', JSON.stringify(diagnosisResult.treatment || null));
      historyFormData.append('explainability', JSON.stringify(
        diagnosisResult.explainability
          ? { ...diagnosisResult.explainability, heatmap: undefined }
          : null
      ));
      historyFormData.append('image', image);

      await fetch(`${API_URL}/api/diagnoses`, {
        method: 'POST',
        credentials: 'include',
        body: historyFormData,
      });
    } catch (error) {
      console.error('Prediction error:', error);
      setResult({
        plantName: 'Prediction failed',
        status: 'Needs Attention',
        issues: ['Unable to analyze this image with the model.'],
        recommendations: [
          error.message || 'Try a clearer plant photo with good lighting.',
          'Make sure the Python prediction service is running on port 8000.',
        ]
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!result) return;

    const escapeHtml = (str) =>
      String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const issuesHtml = (result.issues || [])
      .map((issue) => `<li>${escapeHtml(issue)}</li>`)
      .join('');

    const recommendationsHtml = (result.recommendations || [])
      .map((rec) => `<li>${escapeHtml(rec)}</li>`)
      .join('');

    const treatmentHtml = result.treatment
      ? `
        <h2>Suggested Treatment</h2>
        <p><strong>Summary:</strong> ${escapeHtml(result.treatment.summary || '')}</p>
        <ul>${(result.treatment.steps || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
        ${result.treatment.caution ? `<p class="caution"><strong>Caution:</strong> ${escapeHtml(result.treatment.caution)}</p>` : ''}
      `
      : '';

    const alternativesHtml = result.alternatives?.length
      ? `
        <h2>Other Possible Matches</h2>
        <ul>
          ${result.alternatives
            .map((alt) => `<li>${escapeHtml(alt.label)} — ${alt.confidence.toFixed(2)}%</li>`)
            .join('')}
        </ul>
      `
      : '';

    const confidenceHtml =
      typeof result.confidence === 'number'
        ? `<p><strong>Confidence:</strong> ${result.confidence.toFixed(2)}%</p>`
        : '';

    const heatmapHtml = result.explainability?.heatmap
      ? `
        <h2>AI Explanation (Grad-CAM)</h2>
        <img src="${result.explainability.heatmap}" alt="Grad-CAM heatmap" style="max-width:100%;border:1px solid #ccc;border-radius:6px;" />
        ${result.explainability.target ? `<p>${escapeHtml(result.explainability.target)}</p>` : ''}
        ${result.explainability.note ? `<p class="note">${escapeHtml(result.explainability.note)}</p>` : ''}
      `
      : '';

    const previewHtml = preview
      ? `<h2>Uploaded Image</h2><img src="${preview}" alt="Uploaded plant" style="max-width:100%;max-height:320px;border:1px solid #ccc;border-radius:6px;" />`
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>PlantCheck Diagnosis Report</title>
          <style>
            body { font-family: Arial, sans-serif; color: #222; padding: 24px; }
            h1 { color: #16a34a; margin-bottom: 4px; }
            h2 { color: #15803d; margin-top: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
            p { margin: 6px 0; }
            ul { margin: 6px 0 6px 20px; }
            .meta { color: #555; font-size: 13px; margin-bottom: 16px; }
            .status { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 13px; font-weight: bold; }
            .status-healthy { background: #dcfce7; color: #166534; }
            .status-attention { background: #fee2e2; color: #991b1b; }
            .status-unsupported { background: #fef9c3; color: #854d0e; }
            .caution { color: #b45309; font-size: 13px; }
            .note { color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>🌱 PlantCheck Diagnosis Report</h1>
          <p class="meta">
            Generated: ${new Date().toLocaleString()}<br />
            User: ${escapeHtml(user?.name || 'User')}
          </p>

          <h2>Diagnosis Summary</h2>
          <p><strong>Plant:</strong> ${escapeHtml(result.plantName)}</p>
          <p><strong>Status:</strong>
            <span class="status ${
              result.status === 'Healthy'
                ? 'status-healthy'
                : result.status === 'Unsupported'
                ? 'status-unsupported'
                : 'status-attention'
            }">${escapeHtml(result.status)}</span>
          </p>
          ${confidenceHtml}

          ${previewHtml}

          <h2>Issues Identified</h2>
          <ul>${issuesHtml}</ul>

          <h2>Recommendations</h2>
          <ul>${recommendationsHtml}</ul>

          ${treatmentHtml}
          ${alternativesHtml}
          ${heatmapHtml}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to download the PDF report.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  async function handleSendMessage(text) {
    const message = text || chatInput;
    if (!message.trim()) return;

    const history = chatMessages
      .filter((chatMessage) => chatMessage.role !== 'system')
      .map((chatMessage) => ({
        role: chatMessage.role === 'user' ? 'user' : 'assistant',
        content: chatMessage.text,
      }));

    setChatMessages(prev => [...prev, { role: 'user', text: message }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const formData = new FormData();
      formData.append('text', message.trim());
      formData.append('history_json', JSON.stringify(history));

      if (image && ['image/jpeg', 'image/png'].includes(image.type)) {
        formData.append('image', image);
      }

      const response = await fetch(`${CHATBOT_API_URL}/api/chat`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || 'Chatbot request failed');
      }

      setChatMessages(prev => [...prev, {
        role: 'bot',
        text: data.reply || 'I could not generate a response. Please try again.',
      }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setChatMessages(prev => [...prev, {
        role: 'bot',
        text: 'SmartAgro Bot is unavailable right now. Please restart the PlantCheck server and try again.',
      }]);
    } finally {
      setIsChatLoading(false);
    }
  }

  const toggleVoiceRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Voice recognition error:', error);
        alert('Please allow microphone access to use voice input.');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-sans transition-colors duration-200">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 md:px-8 h-16 flex items-center transition-colors duration-200">
        <div className="max-w-7xl w-full mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <span className="font-semibold text-lg text-gray-900 dark:text-white">PlantCheck</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md transition-colors text-sm"
            >
              💬 Chatbot
            </button>
            <Link
              to="/dashboard"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <div className="pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plant Diagnosis</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Upload a photo to diagnose your plant issue</p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {user?.name || 'User'}
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-200">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Plant Photo</h2>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            {preview ? (
              <div className="space-y-4">
                <img src={preview} alt="Plant preview" className="max-h-64 mx-auto rounded-md" />
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setImage(null);
                      setPreview(null);
                      setResult(null);
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm transition-colors"
                  >
                    Remove Image
                  </button>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm transition-colors"
                  >
                    Change Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-4xl">📸</div>
                <p className="text-gray-600 dark:text-gray-400">Drag & drop your plant photo here</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">or</p>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors"
                >
                  Browse Files
                </button>
                <p className="text-gray-400 dark:text-gray-500 text-xs">Supports JPG, PNG, WEBP (Max 10MB)</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {image && !result && (
            <div className="mt-4">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze Plant'
                )}
              </button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6 transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Diagnosis Results</h3>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
                  title="Download diagnosis report as PDF"
                >
                  ⬇️ Download PDF
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Plant:</span>
                  <span className="text-gray-900 dark:text-white">{result.plantName}</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.status === 'Healthy'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : result.status === 'Unsupported'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {result.status}
                  </span>
                </div>

                {typeof result.confidence === 'number' && (
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Confidence:</span>
                    <span className="text-gray-900 dark:text-white">{result.confidence.toFixed(2)}%</span>
                  </div>
                )}

                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">Issues Identified:</span>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    {result.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">Recommendations:</span>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    {result.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>

                {result.explainability?.heatmap && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">AI explanation (Grad-CAM)</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Model attention map</span>
                    </div>
                    <img
                      src={result.explainability.heatmap}
                      alt="Grad-CAM heatmap showing the image regions used by the model"
                      className="w-full max-w-xl rounded-md border border-gray-200 dark:border-gray-700"
                    />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {result.explainability.target}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      {result.explainability.note}
                    </p>
                  </div>
                )}

                {result.treatment && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">Suggested treatment</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{result.treatment.summary}</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      {result.treatment.steps?.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                      {result.treatment.caution}
                    </p>
                  </div>
                )}

                {result.alternatives?.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">Other possible matches:</span>
                    <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                      {result.alternatives.map((alternative) => (
                        <li key={alternative.label} className="flex justify-between gap-4 text-sm">
                          <span>{alternative.label}</span>
                          <span>{alternative.confidence.toFixed(2)}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => {
                    setImage(null);
                    setPreview(null);
                    setResult(null);
                  }}
                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm transition-colors"
                >
                  Analyze Another Plant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== CHATBOT MODAL ===== */}
      {isChatOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 p-0"
          onClick={() => setIsChatOpen(false)}
        >
          <div
            className="h-full w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <SmartAgroBot />
          </div>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-8 px-4 md:px-8 max-w-7xl mx-auto transition-colors duration-200">
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <span>&copy; {new Date().getFullYear()} PlantCheck. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

export default DiagnosePage;