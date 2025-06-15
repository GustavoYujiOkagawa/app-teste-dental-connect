"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Camera modes for the selector
const CAMERA_MODES = ["Foto", "Vídeo", "Retrato", "Noite"];

function App() {
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [webcamDimensions, setWebcamDimensions] = useState({
    width: 640,
    height: 480,
  });
  const [facingMode, setFacingMode] = useState("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // New states for camera interface
  const [currentMode, setCurrentMode] = useState(0);
  const [showPopupMenu, setShowPopupMenu] = useState(false);
  const [flashMode, setFlashMode] = useState("auto");
  const [lastCapturedImage, setLastCapturedImage] = useState(null);
  const [captureMode, setCaptureMode] = useState("camera");

  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Check for multiple cameras
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      const videoInputs = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setHasMultipleCameras(videoInputs.length > 1);
    });
  }, []);

  // Initialize camera
  useEffect(() => {
    if (captureMode === "camera") {
      initializeCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, captureMode]);

  // Adjust webcam dimensions based on container
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = window.innerHeight;
        const finalWidth = Math.max(containerWidth, 320);
        const finalHeight = Math.max(containerHeight - 200, 400);
        setWebcamDimensions({ width: finalWidth, height: finalHeight });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [captureMode]);

  const initializeCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: webcamDimensions.width },
          height: { ideal: webcamDimensions.height },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError(null);
    } catch (err) {
      setError(`Erro ao acessar câmera: ${err.message}`);
    }
  };

  // Camera Header Component
  const CameraHeader = () => (
    <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
      {/* Flash/Settings Icon */}
      <button
        onClick={() => {
          const modes = ["auto", "on", "off"];
          const currentIndex = modes.indexOf(flashMode);
          const nextIndex = (currentIndex + 1) % modes.length;
          setFlashMode(modes[nextIndex]);
        }}
        className="p-2 rounded-full bg-black/30 backdrop-blur-sm"
      >
        {flashMode === "auto" && (
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        )}
        {flashMode === "on" && (
          <svg
            className="w-6 h-6 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
        {flashMode === "off" && (
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3l18 18"
            />
          </svg>
        )}
      </button>

      {/* Menu/Settings Icon */}
      <button
        onClick={() => setShowPopupMenu(!showPopupMenu)}
        className="p-2 rounded-full bg-black/30 backdrop-blur-sm"
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>
    </div>
  );

  // Camera Mode Selector Component
  const CameraModeSelector = () => (
    <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20">
      <div className="flex space-x-2">
        {CAMERA_MODES.map((mode, index) => (
          <button
            key={mode}
            onClick={() => setCurrentMode(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentMode === index
                ? "bg-white scale-125"
                : "bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
      <div className="text-center mt-2">
        <span className="text-white text-sm font-medium">
          {CAMERA_MODES[currentMode]}
        </span>
      </div>
    </div>
  );

  // Camera Controls Component
  const CameraControls = () => (
    <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center items-center px-8">
      <div className="flex justify-between items-center w-full max-w-xs">
        {/* Gallery Button */}
        <button
          onClick={() => {
            if (lastCapturedImage) {
              setImage(lastCapturedImage);
            }
          }}
          className="w-12 h-12 rounded-lg border-2 border-white/50 overflow-hidden bg-black/30 backdrop-blur-sm"
        >
          {lastCapturedImage ? (
            <img
              src={lastCapturedImage}
              alt="Last captured"
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="w-6 h-6 text-white mx-auto mt-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>

        {/* Capture Button */}
        <button
          onClick={captureImage}
          className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 shadow-lg hover:scale-105 transition-transform duration-200 flex items-center justify-center"
          disabled={!!error}
        >
          <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200"></div>
        </button>

        {/* Switch Camera Button */}
        <button
          onClick={switchCamera}
          className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>
  );

  // Popup Menu Component
  const CameraPopupMenu = () => {
    if (!showPopupMenu) return null;

    const menuItems = [
      { icon: "🎨", label: "Filtros" },
      { icon: "⚙️", label: "Config" },
      { icon: "📊", label: "Análise" },
      { icon: "🔄", label: "Upload" },
    ];

    return (
      <div className="absolute top-16 right-4 z-30 bg-black/80 backdrop-blur-md rounded-2xl p-4 min-w-[200px]">
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                if (item.label === "Upload") {
                  setCaptureMode("upload");
                  setShowPopupMenu(false);
                } else if (item.label === "Análise" && image) {
                  analyzeImage();
                  setShowPopupMenu(false);
                }
              }}
              className="flex flex-col items-center p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors duration-200"
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-white text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Capture image from webcam
  const captureImage = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      const imageSrc = canvas.toDataURL("image/jpeg");

      setImage(imageSrc);
      setLastCapturedImage(imageSrc);
      setResults(null);
      setError(null);
    }
  }, []);

  // Handle file upload from input
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImage(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem.");
      setImage(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Arquivo muito grande. O limite é 5MB.");
      setImage(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImage(event.target.result);
        setLastCapturedImage(event.target.result);
        setResults(null);
        setError(null);
      } else {
        setError("Não foi possível ler o arquivo de imagem para visualização.");
        setImage(null);
      }
    };
    reader.onerror = () => {
      setError("Erro ao ler o arquivo de imagem para visualização.");
      setImage(null);
    };
    reader.readAsDataURL(file);
  }, []);

  // Function to switch camera
  const switchCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  // Analysis function (simplified for demo)
  const analyzeImage = async () => {
    if (!image) {
      setError("Nenhuma imagem selecionada.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResults(null);

    // Simulate analysis for demo
    setTimeout(() => {
      setResults({
        tooth_color: { code: "A2", hex: "#F5F5DC" },
        gum_color: { code: "P1", hex: "#FFB6C1" },
        notes: "Análise simulada para demonstração",
      });
      setAnalyzing(false);
    }, 2000);
  };

  const resetAnalysis = () => {
    setImage(null);
    setResults(null);
    setError(null);
    setAnalyzing(false);
    setLastCapturedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Camera Interface */}
      {captureMode === "camera" && !image && (
        <div ref={containerRef} className="relative w-full h-screen">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
          />

          {/* Camera UI Overlays */}
          <CameraHeader />
          <CameraModeSelector />
          <CameraControls />
          <CameraPopupMenu />
        </div>
      )}

      {/* Upload Mode */}
      {captureMode === "upload" && !image && (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-white text-xl font-semibold mb-6 text-center">
              Enviar Imagem
            </h2>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-600 rounded-xl bg-gray-700/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 text-gray-400 mb-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="mb-4 text-sm text-gray-300 text-center">
                <span className="font-semibold">Clique para enviar</span> ou
                arraste e solte
              </p>
              <p className="text-xs text-gray-400 mb-4">
                PNG, JPG, GIF até 5MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors duration-200"
              >
                Selecionar Arquivo
              </label>
            </div>
            <button
              onClick={() => setCaptureMode("camera")}
              className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              ← Voltar para Câmera
            </button>
          </div>
        </div>
      )}

      {/* Image Preview and Analysis */}
      {image && !results && !analyzing && (
        <div className="min-h-screen bg-gray-900 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-2xl overflow-hidden">
              <div className="relative">
                <img
                  src={image}
                  alt="Imagem capturada"
                  className="w-full h-auto object-contain"
                />
                <button
                  onClick={resetAnalysis}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors duration-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-white text-lg font-semibold mb-4">
                  Imagem Capturada
                </h3>
                <button
                  onClick={analyzeImage}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Analisar Imagem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Loading */}
      {analyzing && (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Analisando imagem...</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="min-h-screen bg-gray-900 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-2xl p-6">
              <h3 className="text-white text-xl font-semibold mb-6">
                Resultados da Análise
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">Cor do Dente:</span>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-500"
                      style={{ backgroundColor: results.tooth_color.hex }}
                    ></div>
                    <span className="text-white font-medium">
                      {results.tooth_color.code}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">Cor da Gengiva:</span>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-500"
                      style={{ backgroundColor: results.gum_color.hex }}
                    ></div>
                    <span className="text-white font-medium">
                      {results.gum_color.code}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={resetAnalysis}
                className="w-full mt-6 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Nova Análise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute top-4 left-4 right-4 z-50">
          <div className="bg-red-600 text-white p-4 rounded-lg shadow-lg">
            <div className="flex justify-between items-start">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-white hover:text-gray-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
