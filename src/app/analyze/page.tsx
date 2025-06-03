"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";

// Define structure for analysis results
interface AnalysisResults {
  id?: string;
  created_at?: string;
  image_url?: string;
  tooth_color: { code: string; hex: string };
  gum_color: { code: string; hex: string };
  notes?: string;
}

// Define available camera facing modes
type FacingMode = "user" | "environment";

export default function AnalyzePage() {
  const [captureMode, setCaptureMode] = useState<"camera" | "upload">("camera");
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [webcamDimensions, setWebcamDimensions] = useState({
    width: 640,
    height: 480,
  });
  const [apiKeyMissingError, setApiKeyMissingError] = useState(false);
  const [facingMode, setFacingMode] = useState<FacingMode>("user"); // State for camera facing mode
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
    };
    checkAuth();
  }, [router]);

  // Check for multiple cameras
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      const videoInputs = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setHasMultipleCameras(videoInputs.length > 1);
    });
  }, []);

  // Adjust webcam dimensions based on container
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // Use a common aspect ratio, adjust if needed
        const aspectRatio = window.innerWidth < 768 ? 9 / 16 : 16 / 9; // Portrait on mobile, landscape on desktop
        const calculatedHeight = containerWidth / aspectRatio;
        const finalWidth = Math.max(containerWidth, 320);
        const finalHeight = Math.max(calculatedHeight, 240);
        setWebcamDimensions({ width: finalWidth, height: finalHeight });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [captureMode]); // Re-run when capture mode changes

  // --- Image Handling ---

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setImage(imageSrc);
        setResults(null);
        setError(null);
        setApiKeyMissingError(false);
      } else {
        setError("Não foi possível capturar a imagem da webcam.");
      }
    }
  }, []);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Por favor, selecione um arquivo de imagem.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // Limit upload size (e.g., 5MB)
        setError("Arquivo muito grande. O limite é 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
          setResults(null);
          setError(null);
          setApiKeyMissingError(false);
        } else {
          setError("Não foi possível ler o arquivo de imagem.");
        }
      };
      reader.onerror = () => {
        setError("Erro ao ler o arquivo de imagem.");
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Function to switch camera
  const switchCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  // --- Analysis Logic ---
  const analyzeImage = async () => {
    if (!image || !user) return;

    setAnalyzing(true);
    setError(null);
    setApiKeyMissingError(false);
    setResults(null);

    try {
      // 1. Call the backend API (which now uses OpenAI)
      console.log("Chamando API /api/analyze-dental-color...");
      const response = await fetch("/api/analyze-dental-color", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: image.split(",")[1] }), // Send only base64 part
      });

      const analysisResult = await response.json();

      if (!response.ok) {
        // Check for specific API key error from the backend (OpenAI)
        if (
          analysisResult.error &&
          analysisResult.error.includes(
            "Chave da API da OpenAI não configurada"
          )
        ) {
          setApiKeyMissingError(true);
          setError(
            "A análise por IA não está configurada. Verifique a chave da API OpenAI no servidor."
          );
          setAnalyzing(false);
          return;
        }
        // Check for model deprecation or other specific errors from backend
        if (
          analysisResult.error &&
          analysisResult.error.includes("deprecated")
        ) {
          setError(
            "O modelo de IA configurado está desatualizado. Contate o suporte."
          );
          setAnalyzing(false);
          return;
        }
        // General error from backend
        throw new Error(
          analysisResult.error ||
            `Falha na análise de cor (HTTP ${response.status})`
        );
      }

      console.log(
        "Resultado da análise de cor (OpenAI via backend):",
        analysisResult
      );

      const analyzedResultsData: AnalysisResults = {
        tooth_color: {
          code: analysisResult.toothColorCode,
          hex: analysisResult.toothColorHex,
        },
        gum_color: {
          code: analysisResult.gumColorCode,
          hex: analysisResult.gumColorHex,
        },
      };

      // 2. Upload the original image to Supabase Storage
      console.log("Fazendo upload da imagem para o Supabase...");
      const imageBlob = await fetch(image).then((res) => res.blob());
      const fileExt = imageBlob.type.split("/")[1] || "jpg";
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("dental-images") // Ensure this bucket exists
        .upload(filePath, imageBlob, { upsert: true });

      if (uploadError)
        throw new Error(`Erro no upload da imagem: ${uploadError.message}`);

      // 3. Get public URL of the uploaded image
      const { data: urlData } = supabase.storage
        .from("dental-images")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl)
        throw new Error("Não foi possível obter a URL pública da imagem.");
      const publicUrl = urlData.publicUrl;
      console.log("URL pública da imagem:", publicUrl);

      // 4. Save the analysis results to the database
      console.log("Salvando análise no banco de dados...");
      const { data: savedAnalysis, error: analysisError } = await supabase
        .from("dental_analyses")
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          tooth_color_code: analyzedResultsData.tooth_color.code,
          tooth_color_hex: analyzedResultsData.tooth_color.hex,
          gum_color_code: analyzedResultsData.gum_color.code,
          gum_color_hex: analyzedResultsData.gum_color.hex,
        })
        .select()
        .single();

      if (analysisError)
        throw new Error(`Erro ao salvar análise: ${analysisError.message}`);

      console.log("Análise salva com sucesso:", savedAnalysis);

      // 5. Update the state with the final results
      setResults({
        ...analyzedResultsData,
        id: savedAnalysis.id,
        image_url: publicUrl,
        created_at: savedAnalysis.created_at,
      });
    } catch (error: any) {
      console.error("Erro durante o processo de análise:", error);
      if (!apiKeyMissingError) {
        // Avoid overwriting the specific API key error
        setError(
          error.message || "Ocorreu um erro inesperado durante a análise."
        );
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // --- Navigation and Reset ---

  const goToDashboard = () => {
    router.push("/dashboard");
  };

  const resetAnalysis = () => {
    setImage(null);
    setResults(null);
    setError(null);
    setApiKeyMissingError(false);
    setAnalyzing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // --- Sharing Logic ---
  const shareToFeed = async () => {
    if (!results?.id || !user || !results.image_url) {
      setError("Análise ou imagem não encontrada para compartilhar.");
      return;
    }
    console.log("Preparando para compartilhar no feed:", results);
    let description = `Análise de cor: Dente ${results.tooth_color.code}, Gengiva ${results.gum_color.code}.`;

    try {
      const { error: postError } = await supabase.from("posts").insert({
        user_id: user.id,
        dental_analysis_id: results.id,
        image_url: results.image_url,
        description: description,
      });
      if (postError) throw postError;
      console.log("Post criado com sucesso!");
      router.push("/feed");
    } catch (error: any) {
      console.error("Erro ao criar post:", error);
      setError(error.message || "Não foi possível compartilhar no feed.");
    }
  };

  // --- Render Logic ---

  // Dynamic video constraints based on facingMode
  const videoConstraints = {
    width: webcamDimensions.width,
    height: webcamDimensions.height,
    facingMode: facingMode,
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-6">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">
            Análise Dental
          </h1>
          <button
            onClick={goToDashboard}
            className="text-gray-600 hover:text-gray-800 p-1"
            aria-label="Fechar análise"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error/Info Messages */}
        {error && (
          <div
            className={`border text-sm px-4 py-3 rounded relative mb-6 ${
              apiKeyMissingError
                ? "bg-yellow-100 border-yellow-400 text-yellow-700"
                : "bg-red-100 border-red-400 text-red-700"
            }`}
            role="alert"
          >
            <strong className="font-bold">
              {apiKeyMissingError ? "Aviso:" : "Erro:"}{" "}
            </strong>
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => {
                setError(null);
                setApiKeyMissingError(false);
              }}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              aria-label="Fechar"
            >
              <svg
                className={`fill-current h-6 w-6 ${
                  apiKeyMissingError ? "text-yellow-500" : "text-red-500"
                }`}
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <title>Fechar</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </button>
          </div>
        )}

        {/* Step 1: Capture or Upload */}
        {!image && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                1. Capturar ou Enviar Imagem
              </h2>
              <div className="flex border border-gray-300 rounded-md overflow-hidden mb-4 sm:mb-6 max-w-xs mx-auto">
                <button
                  onClick={() => setCaptureMode("camera")}
                  className={`flex-1 py-2 px-3 text-center text-xs sm:text-sm transition-colors duration-200 ${
                    captureMode === "camera"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Câmera
                </button>
                <button
                  onClick={() => setCaptureMode("upload")}
                  className={`flex-1 py-2 px-3 text-center text-xs sm:text-sm transition-colors duration-200 ${
                    captureMode === "upload"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Upload
                </button>
              </div>

              <div ref={containerRef} className="mb-4 sm:mb-6">
                {captureMode === "camera" ? (
                  <div
                    className="bg-black rounded-lg overflow-hidden relative mx-auto border border-gray-300"
                    style={{ maxWidth: `${webcamDimensions.width}px` }}
                  >
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={videoConstraints} // Use dynamic constraints
                      width={webcamDimensions.width}
                      height={webcamDimensions.height}
                      className="block w-full h-auto rounded-lg"
                      mirrored={facingMode === "user"} // Mirror only front camera
                      key={facingMode} // Force re-render on camera switch
                    />

                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                      {/* Capture Button */}
                      <button
                        onClick={captureImage}
                        className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors duration-200 ring-2 ring-blue-500"
                        aria-label="Capturar foto"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6 text-blue-600"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                          />
                        </svg>
                      </button>
                      {/* Switch Camera Button (only if multiple cameras) */}
                      {hasMultipleCameras && (
                        <button
                          onClick={switchCamera}
                          className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors duration-200"
                          aria-label="Trocar câmera"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6 text-gray-700"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-4.992-3.182-3.182a8.25 8.25 0 0 0-11.667 0L2.985 14.652m13.038-4.992v4.992m0 0-4.992 0m4.992 0-3.181-3.183a8.25 8.25 0 0 0-11.667 0l-3.181 3.183"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-12 text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-12 h-12 text-gray-400 mb-3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      Arraste e solte uma imagem ou
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                    >
                      <span>Clique para selecionar</span>
                      <input
                        ref={fileInputRef}
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                    </button>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, GIF até 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview and Analyze Button */}
        {image && !results && (
          <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
            <div className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                2. Pré-visualização e Análise
              </h2>
              <div className="mb-4 sm:mb-6 relative">
                <Image
                  src={image}
                  alt="Imagem capturada/enviada"
                  width={webcamDimensions.width} // Use consistent dimensions
                  height={webcamDimensions.height}
                  className="rounded-lg border border-gray-300 w-full h-auto object-contain max-h-[60vh]"
                />
                <button
                  onClick={resetAnalysis}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1.5 hover:bg-opacity-75 transition-opacity"
                  aria-label="Remover imagem"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <button
                onClick={analyzeImage}
                disabled={analyzing}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Analisando...
                  </>
                ) : (
                  "Analisar Cor Dental"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {results && (
          <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
            <div className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                3. Resultados da Análise
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Image Preview */}
                <div className="relative">
                  {results.image_url && (
                    <Image
                      src={results.image_url}
                      alt="Imagem analisada"
                      width={webcamDimensions.width / 2} // Smaller preview
                      height={webcamDimensions.height / 2}
                      className="rounded-lg border border-gray-300 w-full h-auto object-contain max-h-[40vh]"
                    />
                  )}
                </div>
                {/* Color Results */}
                <div>
                  <dl className="space-y-3">
                    {/* Tooth Color */}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Cor do Dente (VITA)
                      </dt>
                      <dd className="mt-1 flex items-center">
                        <span
                          className="inline-block h-5 w-5 rounded-full border border-gray-300 mr-2"
                          style={{ backgroundColor: results.tooth_color.hex }}
                        ></span>
                        <span className="text-sm text-gray-900">
                          {results.tooth_color.code} ({results.tooth_color.hex})
                        </span>
                      </dd>
                    </div>
                    {/* Gum Color */}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Cor da Gengiva
                      </dt>
                      <dd className="mt-1 flex items-center">
                        <span
                          className="inline-block h-5 w-5 rounded-full border border-gray-300 mr-2"
                          style={{ backgroundColor: results.gum_color.hex }}
                        ></span>
                        <span className="text-sm text-gray-900">
                          {results.gum_color.code} ({results.gum_color.hex})
                        </span>
                      </dd>
                    </div>
                    {/* Analysis Date */}
                    {results.created_at && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Data da Análise
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(results.created_at).toLocaleString("pt-BR")}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={resetAnalysis}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Analisar Outra Imagem
                </button>
                <button
                  onClick={shareToFeed}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Compartilhar no Feed
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
