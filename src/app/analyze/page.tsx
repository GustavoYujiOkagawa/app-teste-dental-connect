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

  // --- Analysis Logic (Integrate DeepSeek in Step 6) ---
  const analyzeImage = async () => {
    if (!image || !user) return;

    setAnalyzing(true);
    setError(null);
    setApiKeyMissingError(false);
    setResults(null);

    try {
      // 1. Call the backend API (Update this in Step 6 for DeepSeek)
      console.log("Chamando API /api/analyze-dental-color...");
      const response = await fetch("/api/analyze-dental-color", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: image.split(",")[1] }),
      });

      const analysisResult = await response.json();

      if (!response.ok) {
        // Check for specific API key error (Update error message for DeepSeek)
        if (
          analysisResult.error &&
          (analysisResult.error.includes(
            "Chave da API OpenAI não configurada"
          ) ||
            analysisResult.error.includes(
              "Chave da API DeepSeek não configurada"
            ))
        ) {
          setApiKeyMissingError(true);
          setError(
            "A análise por IA não está configurada. Verifique a chave da API no servidor."
          );
          setAnalyzing(false);
          return;
        }
        // Check for model deprecation error (Update for DeepSeek if needed)
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
        throw new Error(
          analysisResult.error ||
            `Falha na análise de cor (HTTP ${response.status})`
        );
      }

      console.log("Resultado da análise de cor:", analysisResult);

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
        .from("dental_images") // Ensure this bucket exists
        .upload(filePath, imageBlob, { upsert: true });

      if (uploadError)
        throw new Error(`Erro no upload da imagem: ${uploadError.message}`);

      // 3. Get public URL of the uploaded image
      const { data: urlData } = supabase.storage
        .from("dental_images")
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

  // --- Sharing Logic (Implement in Step 10) ---
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
                          className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600"
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
                      {/* Switch Camera Button (only if multiple cameras detected) */}
                      {hasMultipleCameras && (
                        <button
                          onClick={switchCamera}
                          className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors duration-200 ring-1 ring-gray-400"
                          aria-label="Alternar câmera"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-10 min-h-[240px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mb-3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                      />
                    </svg>
                    <p className="text-xs sm:text-sm text-center text-gray-500 mb-4">
                      Clique ou arraste uma imagem aqui (Max 5MB)
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 text-sm"
                    >
                      Selecionar Arquivo
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/jpeg, image/png, image/webp"
                      className="hidden"
                      aria-label="Selecionar imagem para upload"
                    />
                  </div>
                )}
              </div>
              <p className="text-center text-xs sm:text-sm text-gray-500">
                Posicione o rosto centralizado e com boa iluminação.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Review and Analyze */}
        {image && !results && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                2. Revisar e Analisar
              </h2>
              <div className="bg-gray-100 rounded-lg overflow-hidden mb-4 sm:mb-6 max-w-md mx-auto border border-gray-200">
                <Image
                  src={image}
                  alt="Imagem para análise"
                  width={640}
                  height={480}
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={resetAnalysis}
                  disabled={analyzing}
                  className="w-full sm:w-auto bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors duration-200 text-sm disabled:opacity-50"
                >
                  Voltar
                </button>
                <button
                  onClick={analyzeImage}
                  disabled={analyzing || apiKeyMissingError}
                  className="w-full sm:w-auto bg-blue-600 text-white py-2 px-5 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
                >
                  {analyzing ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Analisando...
                    </div>
                  ) : (
                    "Analisar Cor (IA)"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Results and Actions */}
        {image && results && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                3. Resultados da Análise
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Image Column */}
                <div className="bg-gray-100 rounded-lg overflow-hidden relative border border-gray-200">
                  <Image
                    src={results.image_url || image}
                    alt="Imagem analisada"
                    width={640}
                    height={480}
                    className="w-full h-auto object-contain rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = image || "/placeholder-image.png";
                    }}
                  />
                </div>

                {/* Results Column */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                      Cor do Dente (IA)
                    </h3>
                    <div className="flex items-center bg-gray-50 p-2 sm:p-3 rounded-md border border-gray-200">
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-md mr-2 sm:mr-3 border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: results.tooth_color.hex }}
                        title={results.tooth_color.hex}
                      ></div>
                      <div>
                        <p className="text-sm sm:text-base font-semibold">
                          {results.tooth_color.code}
                        </p>
                        <p className="text-xs text-gray-500">
                          {results.tooth_color.hex}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                      Cor da Gengiva (IA)
                    </h3>
                    <div className="flex items-center bg-gray-50 p-2 sm:p-3 rounded-md border border-gray-200">
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-md mr-2 sm:mr-3 border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: results.gum_color.hex }}
                        title={results.gum_color.hex}
                      ></div>
                      <div>
                        <p className="text-sm sm:text-base font-semibold">
                          {results.gum_color.code}
                        </p>
                        <p className="text-xs text-gray-500">
                          {results.gum_color.hex}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-center gap-3">
                    <button
                      onClick={resetAnalysis}
                      className="w-full sm:w-auto bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors duration-200 text-sm"
                    >
                      Nova Análise
                    </button>
                    <button
                      onClick={shareToFeed}
                      className="w-full sm:w-auto bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 text-sm"
                    >
                      Compartilhar no Feed
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
