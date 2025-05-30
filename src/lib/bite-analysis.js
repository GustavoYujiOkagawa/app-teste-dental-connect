// Implementação de algoritmos para detecção facial e análise de mordida

import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

// Classe principal para análise de mordida com IA
export class BiteAnalyzer {
  constructor() {
    this.detector = null;
    this.isInitialized = false;
  }

  // Inicializar o detector de pontos faciais
  async initialize() {
    try {
      // Carregar o modelo de detecção facial MediaPipe
      this.detector = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 1
        }
      );
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Erro ao inicializar detector facial:', error);
      return false;
    }
  }

  // Analisar imagem para detecção de pontos faciais
  async analyzeFace(imageElement) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Detectar pontos faciais na imagem
      const faces = await this.detector.estimateFaces(imageElement);
      
      if (faces.length === 0) {
        return {
          success: false,
          error: 'Nenhum rosto detectado na imagem'
        };
      }

      // Obter pontos de referência do primeiro rosto
      const face = faces[0];
      const landmarks = face.keypoints;
      
      // Calcular linha média facial
      const midline = this.calculateMidline(landmarks);
      
      // Determinar formato do rosto
      const faceShape = this.determineFaceShape(landmarks);
      
      // Calcular proporções dentárias ideais
      const dentalProportions = this.calculateIdealDentalProportions(landmarks, faceShape);
      
      return {
        success: true,
        midline,
        faceShape,
        dentalProportions,
        landmarks
      };
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      return {
        success: false,
        error: 'Falha ao processar a imagem'
      };
    }
  }

  // Calcular linha média facial
  calculateMidline(landmarks) {
    // Pontos de referência para linha média
    const nasion = landmarks.find(l => l.name === 'noseTip');
    const chin = landmarks.find(l => l.name === 'chin');
    const foreheadCenter = landmarks.find(l => l.name === 'foreheadCenter');
    
    if (!nasion || !chin || !foreheadCenter) {
      // Usar pontos alternativos se os ideais não forem encontrados
      const leftEye = landmarks.filter(l => l.name.includes('leftEye'));
      const rightEye = landmarks.filter(l => l.name.includes('rightEye'));
      const nose = landmarks.filter(l => l.name.includes('nose'));
      const mouth = landmarks.filter(l => l.name.includes('mouth'));
      
      // Calcular pontos médios
      const eyesMidpoint = this.calculateMidpoint(
        this.calculateCentroid(leftEye),
        this.calculateCentroid(rightEye)
      );
      
      const noseMidpoint = this.calculateCentroid(nose);
      const mouthMidpoint = this.calculateCentroid(mouth);
      
      // Calcular linha média usando pontos disponíveis
      return {
        points: [eyesMidpoint, noseMidpoint, mouthMidpoint],
        angle: this.calculateAngle(eyesMidpoint, mouthMidpoint),
        confidence: 0.8 // Confiança reduzida por usar pontos alternativos
      };
    }
    
    // Calcular linha média usando pontos ideais
    return {
      points: [
        { x: foreheadCenter.x, y: foreheadCenter.y },
        { x: nasion.x, y: nasion.y },
        { x: chin.x, y: chin.y }
      ],
      angle: this.calculateAngle(foreheadCenter, chin),
      confidence: 0.95
    };
  }

  // Determinar formato do rosto
  determineFaceShape(landmarks) {
    // Extrair pontos do contorno facial
    const jawline = landmarks.filter(l => l.name.includes('jawline'));
    const forehead = landmarks.filter(l => l.name.includes('forehead'));
    
    if (jawline.length < 5 || forehead.length < 3) {
      return {
        shape: 'unknown',
        confidence: 0
      };
    }
    
    // Calcular largura e altura do rosto
    const faceWidth = this.calculateMaxDistance(jawline, 'x');
    const faceHeight = this.calculateDistance(
      this.calculateCentroid(forehead),
      this.calculateLowestPoint(jawline)
    );
    
    // Calcular proporção largura/altura
    const ratio = faceWidth / faceHeight;
    
    // Determinar formato com base na proporção
    let shape;
    let confidence;
    
    if (ratio > 0.9 && ratio < 1.1) {
      shape = 'round';
      confidence = 0.8;
    } else if (ratio >= 0.8 && ratio <= 0.9) {
      shape = 'oval';
      confidence = 0.9;
    } else if (ratio < 0.8) {
      shape = 'long';
      confidence = 0.85;
    } else {
      shape = 'square';
      confidence = 0.75;
    }
    
    return {
      shape,
      ratio,
      confidence
    };
  }

  // Calcular proporções dentárias ideais com base no formato do rosto
  calculateIdealDentalProportions(landmarks, faceShape) {
    // Extrair pontos relevantes
    const jawline = landmarks.filter(l => l.name.includes('jawline'));
    const lips = landmarks.filter(l => l.name.includes('lips'));
    
    if (jawline.length < 5 || lips.length < 4) {
      return {
        centralIncisorsWidth: 0,
        lateralIncisorsWidth: 0,
        caninesWidth: 0,
        confidence: 0
      };
    }
    
    // Calcular largura da face na altura da boca
    const mouthWidth = this.calculateDistance(
      lips.find(l => l.name === 'lipCornerLeft'),
      lips.find(l => l.name === 'lipCornerRight')
    );
    
    // Calcular largura ideal dos dentes com base no formato do rosto
    let centralIncisorsRatio, lateralIncisorsRatio, caninesRatio;
    
    switch (faceShape.shape) {
      case 'oval':
        // Proporção áurea para rostos ovais
        centralIncisorsRatio = 0.15;
        lateralIncisorsRatio = 0.10;
        caninesRatio = 0.08;
        break;
      case 'round':
        // Dentes mais largos para equilibrar rostos redondos
        centralIncisorsRatio = 0.16;
        lateralIncisorsRatio = 0.11;
        caninesRatio = 0.09;
        break;
      case 'square':
        // Dentes com cantos mais arredondados para rostos quadrados
        centralIncisorsRatio = 0.15;
        lateralIncisorsRatio = 0.10;
        caninesRatio = 0.08;
        break;
      case 'long':
        // Dentes mais largos para equilibrar rostos longos
        centralIncisorsRatio = 0.17;
        lateralIncisorsRatio = 0.12;
        caninesRatio = 0.09;
        break;
      default:
        // Proporções padrão
        centralIncisorsRatio = 0.15;
        lateralIncisorsRatio = 0.10;
        caninesRatio = 0.08;
    }
    
    return {
      centralIncisorsWidth: mouthWidth * centralIncisorsRatio,
      lateralIncisorsWidth: mouthWidth * lateralIncisorsRatio,
      caninesWidth: mouthWidth * caninesRatio,
      confidence: 0.85 * faceShape.confidence // Confiança proporcional à do formato do rosto
    };
  }

  // Analisar plano de cera na imagem
  async analyzeWaxPlane(imageElement, landmarks) {
    // Esta função seria implementada com algoritmos de visão computacional
    // para detectar o plano de cera e analisar marcas de mordida
    
    // Implementação simulada para demonstração
    return {
      detected: true,
      biteMarks: [
        { x: 100, y: 150, pressure: 'high' },
        { x: 150, y: 150, pressure: 'medium' },
        { x: 200, y: 150, pressure: 'high' }
      ],
      alignment: {
        withMidline: 0.8, // 80% alinhado com a linha média
        suggestions: 'Ajustar 2mm para a direita'
      },
      confidence: 0.7
    };
  }

  // Funções auxiliares
  calculateMidpoint(point1, point2) {
    return {
      x: (point1.x + point2.x) / 2,
      y: (point1.y + point2.y) / 2
    };
  }

  calculateCentroid(points) {
    const sum = points.reduce((acc, point) => {
      return { x: acc.x + point.x, y: acc.y + point.y };
    }, { x: 0, y: 0 });
    
    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }

  calculateDistance(point1, point2) {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + 
      Math.pow(point2.y - point1.y, 2)
    );
  }

  calculateMaxDistance(points, axis) {
    if (points.length < 2) return 0;
    
    let min = Infinity;
    let max = -Infinity;
    
    for (const point of points) {
      if (point[axis] < min) min = point[axis];
      if (point[axis] > max) max = point[axis];
    }
    
    return max - min;
  }

  calculateLowestPoint(points) {
    return points.reduce((lowest, point) => {
      return point.y > lowest.y ? point : lowest;
    }, points[0]);
  }

  calculateAngle(point1, point2) {
    return Math.atan2(point2.y - point1.y, point2.x - point1.x) * 180 / Math.PI;
  }
}

// Componente de visualização para renderizar resultados da análise
export class BiteAnalysisVisualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  // Limpar canvas
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Desenhar resultados da análise
  drawAnalysisResults(imageElement, analysisResults) {
    this.clear();
    
    // Desenhar imagem original
    this.ctx.drawImage(imageElement, 0, 0, this.canvas.width, this.canvas.height);
    
    if (!analysisResults || !analysisResults.success) {
      return;
    }
    
    // Desenhar linha média
    this.drawMidline(analysisResults.midline);
    
    // Desenhar pontos de referência facial
    this.drawLandmarks(analysisResults.landmarks);
    
    // Desenhar proporções dentárias ideais
    this.drawDentalProportions(analysisResults.dentalProportions);
    
    // Adicionar texto informativo
    this.drawInfoText(analysisResults);
  }

  // Desenhar linha média facial
  drawMidline(midline) {
    if (!midline || !midline.points || midline.points.length < 2) return;
    
    this.ctx.beginPath();
    this.ctx.moveTo(midline.points[0].x, midline.points[0].y);
    
    for (let i = 1; i < midline.points.length; i++) {
      this.ctx.lineTo(midline.points[i].x, midline.points[i].y);
    }
    
    this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Estender a linha para cima e para baixo
    const first = midline.points[0];
    const last = midline.points[midline.points.length - 1];
    const angle = midline.angle * Math.PI / 180;
    
    this.ctx.beginPath();
    this.ctx.moveTo(first.x - Math.cos(angle) * 50, first.y - Math.sin(angle) * 50);
    this.ctx.lineTo(last.x + Math.cos(angle) * 50, last.y + Math.sin(angle) * 50);
    
    this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  // Desenhar pontos de referência facial
  drawLandmarks(landmarks) {
    if (!landmarks) return;
    
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    
    for (const point of landmarks) {
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      this.ctx.fill();
    }
  }

  // Desenhar proporções dentárias ideais
  drawDentalProportions(proportions) {
    if (!proportions) return;
    
    // Esta função desenharia as proporções dentárias ideais
    // na região da boca, baseado nos cálculos de largura ideal
    
    // Implementação simplificada para demonstração
    const mouthY = this.canvas.height * 0.7;
    const mouthCenterX = this.canvas.width / 2;
    
    // Desenhar central incisors
    const centralWidth = proportions.centralIncisorsWidth;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.fillRect(
      mouthCenterX - centralWidth, 
      mouthY - 20, 
      centralWidth * 2, 
      20
    );
    
    // Desenhar lateral incisors
    const lateralWidth = proportions.lateralIncisorsWidth;
    this.ctx.fillStyle = 'rgba(245, 245, 245, 0.7)';
    this.ctx.fillRect(
      mouthCenterX - centralWidth - lateralWidth, 
      mouthY - 18, 
      lateralWidth, 
      18
    );
    this.ctx.fillRect(
      mouthCenterX + centralWidth, 
      mouthY - 18, 
      lateralWidth, 
      18
    );
    
    // Desenhar canines
    const canineWidth = proportions.caninesWidth;
    this.ctx.fillStyle = 'rgba(235, 235, 235, 0.7)';
    this.ctx.fillRect(
      mouthCenterX - centralWidth - lateralWidth - canineWidth, 
      mouthY - 19, 
      canineWidth, 
      19
    );
    this.ctx.fillRect(
      mouthCenterX + centralWidth + lateralWidth, 
      mouthY - 19, 
      canineWidth, 
      19
    );
    
    // Desenhar contorno
    this.ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      mouthCenterX - centralWidth - lateralWidth - canineWidth, 
      mouthY - 20, 
      (centralWidth + lateralWidth + canineWidth) * 2, 
      20
    );
  }

  // Desenhar texto informativo
  drawInfoText(results) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 300, 100);
    
    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = 'white';
    this.ctx.fillText(`Formato do rosto: ${results.faceShape.shape}`, 20, 30);
    this.ctx.fillText(`Confiança: ${Math.round(results.faceShape.confidence * 100)}%`, 20, 50);
    this.ctx.fillText(`Incisivos centrais: ${results.dentalProportions.centralIncisorsWidth.toFixed(1)}mm`, 20, 70);
    this.ctx.fillText(`Incisivos laterais: ${results.dentalProportions.lateralIncisorsWidth.toFixed(1)}mm`, 20, 90);
  }
}

// Exportar funções auxiliares para uso no componente React
export const BiteAnalysisUtils = {
  // Converter resultado da análise para formato de armazenamento
  formatAnalysisForStorage(analysisResults) {
    if (!analysisResults || !analysisResults.success) {
      return null;
    }
    
    return {
      midline: {
        angle: analysisResults.midline.angle,
        confidence: analysisResults.midline.confidence
      },
      faceShape: {
        shape: analysisResults.faceShape.shape,
        ratio: analysisResults.faceShape.ratio,
        confidence: analysisResults.faceShape.confidence
      },
      dentalProportions: {
        centralIncisorsWidth: analysisResults.dentalProportions.centralIncisorsWidth,
        lateralIncisorsWidth: analysisResults.dentalProportions.lateralIncisorsWidth,
        caninesWidth: analysisResults.dentalProportions.caninesWidth,
        confidence: analysisResults.dentalProportions.confidence
      },
      timestamp: new Date().toISOString()
    };
  },
  
  // Gerar recomendações baseadas na análise
  generateRecommendations(analysisResults) {
    if (!analysisResults || !analysisResults.success) {
      return [];
    }
    
    const recommendations = [];
    
    // Recomendações baseadas no formato do rosto
    switch (analysisResults.faceShape.shape) {
      case 'round':
        recommendations.push('Para rostos redondos, dentes anteriores mais longos e retangulares criam ilusão de alongamento facial.');
        break;
      case 'square':
        recommendations.push('Para rostos quadrados, dentes com cantos arredondados suavizam as linhas faciais.');
        break;
      case 'long':
        recommendations.push('Para rostos longos, dentes mais largos e menos alongados equilibram as proporções faciais.');
        break;
      case 'oval':
        recommendations.push('Para rostos ovais, manter proporções áureas entre os dentes anteriores para harmonia facial.');
        break;
    }
    
    // Recomendações baseadas na linha média
    if (Math.abs(analysisResults.midline.angle) > 2) {
      recommendations.push(`Linha média facial com inclinação de ${analysisResults.midline.angle.toFixed(1)}°. Considerar ajuste na orientação dos dentes anteriores.`);
    }
    
    // Recomendações gerais
    recommendations.push(`Largura ideal para incisivos centrais: ${analysisResults.dentalProportions.centralIncisorsWidth.toFixed(1)}mm.`);
    recommendations.push(`Largura ideal para incisivos laterais: ${analysisResults.dentalProportions.lateralIncisorsWidth.toFixed(1)}mm.`);
    
    return recommendations;
  }
};
