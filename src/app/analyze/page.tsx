"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import { supabase } from "@/lib/supabase"; // Assuming this client is correctly configured for browser usage
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
  const [image, setImage] = useState<string | null>(null); // Stores base64 image
  const [imageFile, setImageFile] = useState<File | null>(null); // Stores the actual File object for upload
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

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession(); // Checks if a session exists (e.g., from cookies/localStorage)
      if (!session) {
        console.log("No active session found, redirecting to login.");
        router.push("/login");
        return;
      }
      console.log("Active session found for user:", session.user.id);
      setUser(session.user); // Store user object
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
        const aspectRatio = window.innerWidth < 768 ? 9 / 16 : 16 / 9;
        const calculatedHeight = containerWidth / aspectRatio;
        const finalWidth = Math.max(containerWidth, 320);
        const finalHeight = Math.max(calculatedHeight, 240);
        setWebcamDimensions({ width: finalWidth, height: finalHeight });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [captureMode]);

  // --- Image Handling ---

  // Capture image from webcam
  const captureImage = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot(); // Gets base64 string
      if (imageSrc) {
        setImage(imageSrc); // Store base64 for display
        // Convert base64 to File object for upload
        try {
          const blob = await fetch(imageSrc).then((res) => res.blob());
          const file = new File([blob], `webcam-${Date.now()}.jpeg`, {
            type: "image/jpeg",
          });
          setImageFile(file); // Store File object
          console.log("Webcam image captured and File object created.");
        } catch (fetchError) {
          console.error("Error converting webcam base64 to Blob:", fetchError);
          setError("Erro ao processar imagem da webcam.");
          setImageFile(null);
          return;
        }
        setResults(null);
        setError(null);
        setApiKeyMissingError(false);
      } else {
        setError("Não foi possível capturar a imagem da webcam.");
        setImageFile(null);
      }
    }
  }, []);

  // Handle file upload from input
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        setImage(null);
        setImageFile(null);
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Por favor, selecione um arquivo de imagem.");
        setImage(null);
        setImageFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Arquivo muito grande. O limite é 5MB.");
        setImage(null);
        setImageFile(null);
        return;
      }

      setImageFile(file); // Store the File object directly
      console.log("File selected for upload:", file.name);

      // Read the file as base64 for display purposes
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string); // Store base64 for display
          setResults(null);
          setError(null);
          setApiKeyMissingError(false);
        } else {
          setError(
            "Não foi possível ler o arquivo de imagem para visualização."
          );
          setImage(null);
          setImageFile(null);
        }
      };
      reader.onerror = () => {
        setError("Erro ao ler o arquivo de imagem para visualização.");
        setImage(null);
        setImageFile(null);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Function to switch camera
  const switchCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  // --- Analysis and Upload Logic ---
  const analyzeAndUploadImage = async () => {
    // Ensure we have the actual File object for upload, and the user is authenticated
    if (!imageFile || !user) {
      setError("Nenhuma imagem selecionada ou usuário não autenticado.");
      console.error("Attempted analysis without image file or user session.", {
        hasImageFile: !!imageFile,
        hasUser: !!user,
      });
      return;
    }
    // Also ensure we have the base64 for the OpenAI API call
    if (!image) {
      setError("Pré-visualização da imagem não disponível para análise.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setApiKeyMissingError(false);
    setResults(null);

    try {
      // Step 1: Call the backend API for OpenAI analysis (using base64)
      console.log(
        "Chamando API /api/analyze-dental-color para análise OpenAI..."
      );
      const response = await fetch("/api/analyze-dental-color", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: image.split(",")[1] }), // Send only base64 part
      });

      const analysisResult = await response.json();

      if (!response.ok) {
        // Handle specific errors from the backend API (OpenAI key, etc.)
        if (
          analysisResult.error?.includes(
            "Chave da API da OpenAI não configurada"
          )
        ) {
          setApiKeyMissingError(true);
          setError(
            "A análise por IA não está configurada. Verifique a chave da API OpenAI no servidor."
          );
        } else if (analysisResult.error?.includes("deprecated")) {
          setError(
            "O modelo de IA configurado está desatualizado. Contate o suporte."
          );
        } else {
          setError(
            analysisResult.error ||
              `Falha na análise de cor (HTTP ${response.status})`
          );
        }
        console.error(
          "Erro retornado pela API de análise:",
          analysisResult.error || response.status
        );
        setAnalyzing(false);
        return; // Stop the process if analysis fails
      }

      console.log("Resultado da análise OpenAI recebido:", analysisResult);
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

      // Step 2: Upload the original image FILE to Supabase Storage
      // This is where the RLS policy "Permitir upload autenticado em dental-images" is checked.
      // The `supabase` client instance MUST have the authenticated user's context/token.
      // In a browser context with the standard Supabase client, this usually happens automatically
      // if the user session was established correctly (as checked in useEffect).
      console.log(
        `Fazendo upload do arquivo '${imageFile.name}' para o Supabase Storage...`
      );
      const fileExt = imageFile.name.split(".").pop() || "jpeg"; // Get extension from original file name
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`; // Path within the bucket

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("dental-images") // Target bucket
        .upload(filePath, imageFile, {
          // Upload the File object directly
          cacheControl: "3600",
          upsert: false, // Set to true if you want to overwrite, false to prevent
        });

      if (uploadError) {
        // *** THIS IS LIKELY WHERE THE RLS ERROR OCCURS ***
        // If you get "new row violates row-level security policy" here, it means
        // the supabase client performing the upload wasn't recognized as authenticated,
        // even though getSession() worked earlier.
        console.error("Erro no upload para Supabase Storage:", uploadError);
        // Provide a more specific error message to the user
        if (uploadError.message.includes("security policy")) {
          setError(
            "Erro de permissão ao salvar a imagem. Verifique se sua sessão está ativa e tente novamente."
          );
        } else {
          setError(`Erro no upload da imagem: ${uploadError.message}`);
        }
        setAnalyzing(false);
        return; // Stop the process if upload fails
      }

      console.log("Upload para Supabase concluído:", uploadData);

      // Step 3: Get public URL of the uploaded image
      console.log("Obtendo URL pública da imagem...");
      const { data: urlData } = supabase.storage
        .from("dental-images")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        // Handle case where URL is not immediately available (though usually it is)
        console.error(
          "Não foi possível obter a URL pública imediatamente após o upload."
        );
        setError("Não foi possível obter o link da imagem salva.");
        // Consider: maybe proceed without public URL or try again?
        setAnalyzing(false);
        return;
      }
      const publicUrl = urlData.publicUrl;
      console.log("URL pública da imagem:", publicUrl);

      // Step 4: Save the analysis results (from OpenAI) and the image URL to the database
      console.log("Salvando resultados da análise no banco de dados...");
      const { data: savedAnalysis, error: dbError } = await supabase
        .from("dental_analyses") // Ensure this table exists and RLS allows inserts for authenticated users
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          tooth_color_code: analyzedResultsData.tooth_color.code,
          tooth_color_hex: analyzedResultsData.tooth_color.hex,
          gum_color_code: analyzedResultsData.gum_color.code,
          gum_color_hex: analyzedResultsData.gum_color.hex,
          // Add any other relevant fields from analysisResult if needed
        })
        .select() // Select the newly inserted row
        .single(); // Expect a single row back

      if (dbError) {
        console.error("Erro ao salvar análise no banco de dados:", dbError);
        setError(`Erro ao salvar resultados: ${dbError.message}`);
        // Consider: Should we delete the uploaded image if DB save fails?
        setAnalyzing(false);
        return; // Stop if DB save fails
      }

      console.log(
        "Análise salva no banco de dados com sucesso:",
        savedAnalysis
      );

      // Step 5: Update the state with the final combined results (analysis + DB info)
      setResults({
        ...analyzedResultsData,
        id: savedAnalysis.id, // Include the ID from the database
        image_url: publicUrl,
        created_at: savedAnalysis.created_at,
      });
      console.log("Estado atualizado com os resultados finais.");
    } catch (error: any) {
      // Catch any unexpected errors during the process
      console.error(
        "Erro geral durante o processo de análise e upload:",
        error
      );
      if (!apiKeyMissingError && !error?.message?.includes("upload")) {
        // Avoid overwriting specific errors already set
        setError(error.message || "Ocorreu um erro inesperado.");
      }
    } finally {
      setAnalyzing(false); // Ensure loading state is turned off
    }
  };

  // --- Navigation and Reset ---

  const goToDashboard = () => {
    router.push("/dashboard");
  };

  const resetAnalysis = () => {
    setImage(null);
    setImageFile(null); // Also reset the file object
    setResults(null);
    setError(null);
    setApiKeyMissingError(false);
    setAnalyzing(false);
    // Reset the file input visually
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    console.log("Análise resetada.");
  };

  // --- Sharing Logic ---
  const shareToFeed = async () => {
    if (!results?.id || !user || !results.image_url) {
      setError("Análise ou imagem não encontrada para compartilhar.");
      return;
    }
    console.log("Preparando para compartilhar no feed:", results);
    let description = `Análise de cor dental realizada! Dente: ${results.tooth_color.code} (${results.tooth_color.hex}), Gengiva: ${results.gum_color.code} (${results.gum_color.hex}).`;

    try {
      // Ensure the 'posts' table exists and has appropriate RLS (e.g., user can insert their own posts)
      const { error: postError } = await supabase.from("posts").insert({
        user_id: user.id,
        dental_analysis_id: results.id, // Link to the analysis
        image_url: results.image_url, // Include image URL in the post
        description: description,
      });
      if (postError) throw postError;
      console.log("Post criado com sucesso! Redirecionando para o feed...");
      router.push("/feed");
    } catch (error: any) {
      console.error("Erro ao criar post no feed:", error);
      setError(error.message || "Não foi possível compartilhar no feed.");
    }
  };

  // --- Render Logic ---

  const videoConstraints = {
    width: webcamDimensions.width,
    height: webcamDimensions.height,
    facingMode: facingMode,
  };

  // Loading state while checking auth
  if (!user && !router.pathname?.includes("/login")) {
    // Avoid showing loading if already redirecting
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Verificando autenticação...</p>
        {/* Add a spinner here if desired */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {" "}
      {/* Added padding-bottom */}
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

        {/* Step 1: Capture or Upload Image */}
        {!image && !analyzing && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                1. Capturar ou Enviar Imagem
              </h2>
              {/* Mode Switcher */}
              <div className="flex border border-gray-300 rounded-md overflow-hidden mb-4 sm:mb-6 max-w-xs mx-auto">
                <button
                  onClick={() => {
                    setCaptureMode("camera");
                    setImage(null);
                    setImageFile(null);
                    setError(null);
                  }}
                  className={`flex-1 py-2 px-3 text-center text-xs sm:text-sm transition-colors duration-200 ${
                    captureMode === "camera"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Câmera
                </button>
                <button
                  onClick={() => {
                    setCaptureMode("upload");
                    setImage(null);
                    setImageFile(null);
                    setError(null);
                  }}
                  className={`flex-1 py-2 px-3 text-center text-xs sm:text-sm transition-colors duration-200 ${
                    captureMode === "upload"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Upload
                </button>
              </div>

              {/* Camera or Upload UI */}
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
                      videoConstraints={videoConstraints}
                      width={webcamDimensions.width}
                      height={webcamDimensions.height}
                      className="block w-full h-auto rounded-lg"
                      mirrored={facingMode === "user"}
                      key={facingMode} // Force re-render on camera switch
                      onUserMediaError={(err) =>
                        setError(`Erro ao acessar câmera: ${err.message}`)
                      }
                      onUserMedia={() => setError(null)} // Clear error on success
                    />
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                      {/* Capture Button */}
                      <button
                        onClick={captureImage}
                        className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors duration-200 ring-2 ring-blue-500 disabled:opacity-50"
                        aria-label="Capturar foto"
                        disabled={!!error} // Disable if there's a camera error
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
                            className="w-6 h-6 text-gray-600"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.696v4.992h4.992m0 0-3.181-3.183a8.25 8.25 0 0 0-11.667 0L2.985 16.95m4.992-2.696h-4.992m0 0v-4.992m0 0h4.992M9 4.5l3.181 3.183a8.25 8.25 0 0 1 0 11.667l-3.181 3.183"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  // Upload Mode UI
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
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
                        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Clique para enviar</span>{" "}
                      ou arraste e solte
                    </p>
                    <p className="text-xs text-gray-500">
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
                      className="mt-4 cursor-pointer rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Selecionar Arquivo
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Display Image and Analyze Button */}
        {image && !results && !analyzing && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                2. Imagem Selecionada
              </h2>
              <div className="mb-4 relative group">
                <Image
                  src={image}
                  alt="Imagem dental selecionada"
                  width={webcamDimensions.width} // Use consistent dimensions
                  height={webcamDimensions.height}
                  className="rounded-lg object-contain mx-auto border border-gray-200"
                  style={{ maxHeight: "60vh" }} // Limit height
                />
                {/* Overlay button to change image */}
                <button
                  onClick={resetAnalysis} // Use reset to go back to selection
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"
                >
                  Trocar Imagem
                </button>
              </div>
              <button
                onClick={analyzeAndUploadImage} // Changed function name
                disabled={analyzing}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {analyzing ? "Analisando..." : "Analisar Cor e Salvar"}
              </button>
            </div>
          </div>
        )}

        {/* Loading Indicator during Analysis */}
        {analyzing && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-700">Analisando e salvando a imagem...</p>
            {/* Optional: Add a more visual spinner */}
            <div className="mt-4 w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto"></div>
          </div>
        )}

        {/* Step 3: Display Results */}
        {results && !analyzing && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                3. Resultados da Análise
              </h2>
              <div className="mb-4">
                {results.image_url && (
                  <Image
                    src={results.image_url} // Display the uploaded image URL
                    alt="Imagem dental analisada"
                    width={webcamDimensions.width}
                    height={webcamDimensions.height}
                    className="rounded-lg object-contain mx-auto border border-gray-200 mb-4"
                    style={{ maxHeight: "60vh" }}
                  />
                )}
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Cor do Dente (Código):</dt>
                    <dd className="text-gray-900 font-medium">
                      {results.tooth_color.code}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-500">Cor do Dente (Visual):</dt>
                    <dd>
                      <span
                        className="inline-block w-5 h-5 rounded border border-gray-300"
                        style={{ backgroundColor: results.tooth_color.hex }}
                      ></span>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Cor da Gengiva (Código):</dt>
                    <dd className="text-gray-900 font-medium">
                      {results.gum_color.code}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-500">Cor da Gengiva (Visual):</dt>
                    <dd>
                      <span
                        className="inline-block w-5 h-5 rounded border border-gray-300"
                        style={{ backgroundColor: results.gum_color.hex }}
                      ></span>
                    </dd>
                  </div>
                  {/* Add notes or other results if available */}
                  {results.notes && (
                    <div className="pt-2">
                      <dt className="text-gray-500 mb-1">Notas:</dt>
                      <dd className="text-gray-900">{results.notes}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                <button
                  onClick={shareToFeed}
                  className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Compartilhar no Feed
                </button>
                <button
                  onClick={resetAnalysis}
                  className="flex-1 inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Analisar Outra Imagem
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
