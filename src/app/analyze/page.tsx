'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';
import { supabase } from '@/lib/supabase';
import { BiteAnalyzer, BiteAnalysisVisualizer, BiteAnalysisUtils } from '@/lib/bite-analysis';

export default function AnalyzePage() {
  const [captureMode, setCaptureMode] = useState<'camera' | 'upload'>('camera');
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showBiteAnalysis, setShowBiteAnalysis] = useState(false);
  const [biteAnalysisResults, setBiteAnalysisResults] = useState<any>(null);
  const [biteAnalyzing, setBiteAnalyzing] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const biteAnalyzerRef = useRef<BiteAnalyzer | null>(null);
  const biteVisualizerRef = useRef<BiteAnalysisVisualizer | null>(null);
  
  const router = useRouter();

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
    };

    checkAuth();
  }, [router]);

  // Inicializar analisador de mordida
  useEffect(() => {
    if (showBiteAnalysis && !biteAnalyzerRef.current) {
      const initBiteAnalyzer = async () => {
        const analyzer = new BiteAnalyzer();
        await analyzer.initialize();
        biteAnalyzerRef.current = analyzer;
      };
      
      initBiteAnalyzer();
    }
    
    if (showBiteAnalysis && canvasRef.current && !biteVisualizerRef.current) {
      biteVisualizerRef.current = new BiteAnalysisVisualizer(canvasRef.current);
    }
  }, [showBiteAnalysis]);

  // Capturar foto da webcam
  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImage(imageSrc);
    }
  };

  // Lidar com upload de arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Analisar imagem para cor dental
  const analyzeImage = async () => {
    if (!image) return;
    
    setAnalyzing(true);
    setError(null);
    
    try {
      // Simular análise de cor dental
      // Em produção, isso seria uma chamada API para processamento de imagem
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Resultados simulados
      const simulatedResults = {
        tooth_color: {
          code: 'A2',
          hex: '#E8D9B0'
        },
        gum_color: {
          code: 'TG-3',
          hex: '#E58E8E'
        }
      };
      
      setResults(simulatedResults);
      
      // Upload da imagem para o Supabase Storage
      const imageFile = await fetch(image).then(res => res.blob());
      const fileExt = 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dental_images')
        .upload(filePath, imageFile);
        
      if (uploadError) throw uploadError;
      
      // Obter URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('dental_images')
        .getPublicUrl(filePath);
      
      // Salvar análise no banco de dados
      const { data: analysisData, error: analysisError } = await supabase
        .from('dental_analyses')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          tooth_color_code: simulatedResults.tooth_color.code,
          tooth_color_hex: simulatedResults.tooth_color.hex,
          gum_color_code: simulatedResults.gum_color.code,
          gum_color_hex: simulatedResults.gum_color.hex,
          notes: ''
        })
        .select()
        .single();
        
      if (analysisError) throw analysisError;
      
      // Atualizar resultados com dados do banco
      setResults({
        ...simulatedResults,
        id: analysisData.id,
        created_at: analysisData.created_at
      });
      
    } catch (error: any) {
      console.error('Erro ao analisar imagem:', error);
      setError('Não foi possível analisar a imagem. Tente novamente.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Analisar mordida com IA
  const analyzeBite = async () => {
    if (!image || !biteAnalyzerRef.current) return;
    
    setBiteAnalyzing(true);
    setError(null);
    
    try {
      // Criar elemento de imagem para análise
      const imgElement = new Image();
      imgElement.src = image;
      
      // Esperar carregamento da imagem
      await new Promise((resolve) => {
        imgElement.onload = resolve;
      });
      
      // Analisar imagem com detector facial
      const analysisResults = await biteAnalyzerRef.current.analyzeFace(imgElement);
      
      if (!analysisResults.success) {
        throw new Error(analysisResults.error || 'Falha na análise facial');
      }
      
      // Visualizar resultados no canvas
      if (biteVisualizerRef.current) {
        biteVisualizerRef.current.drawAnalysisResults(imgElement, analysisResults);
      }
      
      // Formatar resultados para armazenamento
      const formattedResults = BiteAnalysisUtils.formatAnalysisForStorage(analysisResults);
      const recommendations = BiteAnalysisUtils.generateRecommendations(analysisResults);
      
      setBiteAnalysisResults({
        ...formattedResults,
        recommendations
      });
      
      // Se já existe uma análise dental, salvar e vincular análise de mordida
      if (results && results.id) {
        // Upload da imagem de análise de mordida (captura do canvas)
        const canvasImage = canvasRef.current?.toDataURL('image/jpeg');
        if (canvasImage) {
          const imageFile = await fetch(canvasImage).then(res => res.blob());
          const fileName = `bite_${Date.now()}.jpg`;
          const filePath = `${user.id}/${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('dental_images')
            .upload(filePath, imageFile);
            
          if (uploadError) throw uploadError;
          
          // Obter URL pública da imagem
          const { data: { publicUrl } } = supabase.storage
            .from('dental_images')
            .getPublicUrl(filePath);
          
          // Salvar análise de mordida no banco de dados
          const { data: biteData, error: biteError } = await supabase
            .from('bite_analyses')
            .insert({
              user_id: user.id,
              image_url: publicUrl,
              midline_angle: formattedResults?.midline?.angle || 0,
              midline_confidence: formattedResults?.midline?.confidence || 0,
              face_shape: formattedResults?.faceShape?.shape || 'unknown',
              face_shape_confidence: formattedResults?.faceShape?.confidence || 0,
              central_incisors_width: formattedResults?.dentalProportions?.centralIncisorsWidth || 0,
              lateral_incisors_width: formattedResults?.dentalProportions?.lateralIncisorsWidth || 0,
              canines_width: formattedResults?.dentalProportions?.caninesWidth || 0,
              proportions_confidence: formattedResults?.dentalProportions?.confidence || 0,
              recommendations: recommendations || []
            })
            .select()
            .single();
            
          if (biteError) throw biteError;
          
          // Vincular análise de mordida à análise dental
          const { error: linkError } = await supabase
            .from('dental_analyses')
            .update({ bite_analysis_id: biteData.id })
            .eq('id', results.id);
            
          if (linkError) throw linkError;
          
          // Atualizar resultados com ID da análise
          setBiteAnalysisResults({
            ...formattedResults,
            recommendations,
            id: biteData.id
          });
        }
      }
      
    } catch (error: any) {
      console.error('Erro ao analisar mordida:', error);
      setError('Não foi possível analisar a mordida. Tente novamente.');
    } finally {
      setBiteAnalyzing(false);
    }
  };

  // Compartilhar no feed
  const shareToFeed = async () => {
    if (!results) return;
    
    try {
      // Criar post no feed
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          dental_analysis_id: results.id,
          bite_analysis_id: biteAnalysisResults?.id,
          image_url: image,
          description: `Análise dental: ${results.tooth_color.code} (dente), ${results.gum_color.code} (gengiva)${
            biteAnalysisResults ? `, formato do rosto: ${biteAnalysisResults.faceShape.shape}` : ''
          }`
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Redirecionar para o feed
      router.push('/feed');
      
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      setError('Não foi possível compartilhar no feed. Tente novamente.');
    }
  };

  // Voltar para o dashboard
  const goToDashboard = () => {
    router.push('/dashboard');
  };

  // Reiniciar análise
  const resetAnalysis = () => {
    setImage(null);
    setResults(null);
    setBiteAnalysisResults(null);
    setShowBiteAnalysis(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Cabeçalho */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Análise Dental</h1>
          <button 
            onClick={goToDashboard}
            className="text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {!image ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Capturar Imagem</h2>
              
              {/* Seleção de modo de captura */}
              <div className="flex border border-gray-300 rounded-md overflow-hidden mb-6">
                <button
                  onClick={() => setCaptureMode('camera')}
                  className={`flex-1 py-2 px-4 text-center ${
                    captureMode === 'camera' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Usar Câmera
                </button>
                <button
                  onClick={() => setCaptureMode('upload')}
                  className={`flex-1 py-2 px-4 text-center ${
                    captureMode === 'upload' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Enviar Foto
                </button>
              </div>
              
              {/* Câmera ou upload */}
              {captureMode === 'camera' ? (
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      facingMode: "user"
                    }}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={captureImage}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-3 shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                  </button>
                  
                  {/* Botão de análise de mordida */}
                  <button
                    onClick={() => setShowBiteAnalysis(true)}
                    className="absolute top-4 right-4 bg-blue-600 text-white rounded-full p-2 shadow-lg"
                    title="Análise de Mordida"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400 mb-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-sm text-gray-500 mb-4">Clique para selecionar uma imagem ou arraste e solte aqui</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Selecionar Arquivo
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              )}
              
              <div className="mt-6 text-center text-sm text-gray-500">
                Posicione o paciente com iluminação adequada para melhores resultados
              </div>
            </div>
          </div>
        ) : !results ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Revisar Imagem</h2>
              
              <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
                <img
                  src={image}
                  alt="Imagem capturada"
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={resetAnalysis}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Capturar Novamente
                </button>
                <button
                  onClick={analyzeImage}
                  disabled={analyzing}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {analyzing ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Analisando...
                    </div>
                  ) : (
                    'Analisar Foto'
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Resultados da Análise</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                    {!showBiteAnalysis ? (
                      <img
                        src={image}
                        alt="Imagem analisada"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <canvas
                        ref={canvasRef}
                        className="w-full h-full"
                        width={640}
                        height={480}
                      />
                    )}
                  </div>
                  
                  {!showBiteAnalysis ? (
                    <button
                      onClick={() => setShowBiteAnalysis(true)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                      </svg>
                      Analisar Mordida e Linha Média
                    </button>
                  ) : !biteAnalysisResults ? (
                    <button
                      onClick={analyzeBite}
                      disabled={biteAnalyzing}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center"
                    >
                      {biteAnalyzing ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Analisando...
                        </div>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                          </svg>
                          Confirmar Análise
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowBiteAnalysis(false)}
                      className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                      </svg>
                      Voltar para Análise de Cor
                    </button>
                  )}
                </div>
                
                <div>
                  {!showBiteAnalysis || (showBiteAnalysis && biteAnalysisResults) ? (
                    <div className="space-y-6">
                      {!showBiteAnalysis ? (
                        <>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Cor do Dente (Escala Vita)</h3>
                            <div className="flex items-center">
                              <div 
                                className="w-12 h-12 rounded-md mr-3" 
                                style={{ backgroundColor: results.tooth_color.hex }}
                              ></div>
                              <div>
                                <p className="text-lg font-bold">{results.tooth_color.code}</p>
                                <p className="text-sm text-gray-500">{results.tooth_color.hex}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Cor da Gengiva (Escala Thomas Gomes)</h3>
                            <div className="flex items-center">
                              <div 
                                className="w-12 h-12 rounded-md mr-3" 
                                style={{ backgroundColor: results.gum_color.hex }}
                              ></div>
                              <div>
                                <p className="text-lg font-bold">{results.gum_color.code}</p>
                                <p className="text-sm text-gray-500">{results.gum_color.hex}</p>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Formato do Rosto</h3>
                            <p className="text-lg font-bold capitalize">{biteAnalysisResults.faceShape.shape}</p>
                            <p className="text-sm text-gray-500">
                              Confiança: {Math.round(biteAnalysisResults.faceShape.confidence * 100)}%
                            </p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Linha Média</h3>
                            <p className="text-lg font-bold">
                              {biteAnalysisResults.midline.angle.toFixed(1)}° de inclinação
                            </p>
                            <p className="text-sm text-gray-500">
                              Confiança: {Math.round(biteAnalysisResults.midline.confidence * 100)}%
                            </p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Proporções Dentárias Ideais</h3>
                            <ul className="space-y-1">
                              <li className="flex justify-between">
                                <span>Incisivos centrais:</span>
                                <span className="font-medium">{biteAnalysisResults.dentalProportions.centralIncisorsWidth.toFixed(1)}mm</span>
                              </li>
                              <li className="flex justify-between">
                                <span>Incisivos laterais:</span>
                                <span className="font-medium">{biteAnalysisResults.dentalProportions.lateralIncisorsWidth.toFixed(1)}mm</span>
                              </li>
                              <li className="flex justify-between">
                                <span>Caninos:</span>
                                <span className="font-medium">{biteAnalysisResults.dentalProportions.caninesWidth.toFixed(1)}mm</span>
                              </li>
                            </ul>
                          </div>
                          
                          {biteAnalysisResults.recommendations && (
                            <div>
                              <h3 className="text-sm font-medium text-gray-500 mb-2">Recomendações</h3>
                              <ul className="space-y-1 text-sm">
                                {biteAnalysisResults.recommendations.map((rec: string, index: number) => (
                                  <li key={index} className="bg-blue-50 p-2 rounded-md">
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}
                      
                      <div className="pt-4 border-t border-gray-200 flex justify-between">
                        <button
                          onClick={resetAnalysis}
                          className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                          Nova Análise
                        </button>
                        <button
                          onClick={shareToFeed}
                          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Compartilhar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400 mb-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                      </svg>
                      <p className="text-gray-500 mb-2">Análise de Mordida e Linha Média</p>
                      <p className="text-sm text-gray-400 text-center mb-4">
                        Detecta a linha média facial e sugere o tamanho ideal dos dentes com base no formato do rosto
                      </p>
                      <p className="text-sm text-gray-400 text-center">
                        Clique em &quot;Confirmar Análise&quot; para iniciar
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Navegação inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-around">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex flex-col items-center text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="text-xs mt-1">Perfil</span>
          </button>
          <button
            onClick={() => router.push('/feed')}
            className="flex flex-col items-center text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
            </svg>
            <span className="text-xs mt-1">Feed</span>
          </button>
          <button
            onClick={() => {}}
            className="flex flex-col items-center text-blue-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
            <span className="text-xs mt-1">Analisar</span>
          </button>
          <button
            onClick={() => router.push('/chats')}
            className="flex flex-col items-center text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
            <span className="text-xs mt-1">Chat</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
