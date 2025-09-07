import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMagicBall } from '../lib/stores/useMagicBall';
import { useAudio } from '../lib/stores/useAudio';
import { useKeyboardControls } from '@react-three/drei';
import ThreeBall from './ThreeBall';

interface Magic8BallProps {
  size?: number;
}

const Magic8Ball: React.FC<Magic8BallProps> = ({
  size = 320
}) => {
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const ballRef = useRef<HTMLDivElement>(null);
  
  const { isShaking, response, isLoading, startShake, stopShake, fetchResponse, resetBall } = useMagicBall();
  const { playHit, playSuccess } = useAudio();
  const [subscribe] = useKeyboardControls();

  // Simple handleShake that doesn't queue multiple API calls
  const handleShake = useCallback(async () => {
    if (isShaking || isLoading) return;
    
    setIsAnswerVisible(false);
    startShake();
    playHit();
    
    // Call API immediately, don't queue it with setTimeout
    await fetchResponse();
    
    // Stop shaking and show response
    stopShake();
    playSuccess();
    setIsAnswerVisible(true);
  }, [isShaking, isLoading, startShake, playHit, fetchResponse, stopShake, playSuccess]);

  // Visibility logic for answer text
  useEffect(() => {
    if (response && !isLoading && !isShaking) {
      const t = setTimeout(() => {
        setIsAnswerVisible(true);
      }, 700);
      return () => clearTimeout(t);
    }
    setIsAnswerVisible(false);
  }, [response, isLoading, isShaking]);

  useEffect(() => {
    const isEditableElementActive = () => {
      const el = (document.activeElement as HTMLElement | null);
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      return tag === 'input' || tag === 'textarea' || el.isContentEditable;
    };

    const unsubscribeShake = subscribe(
      (state) => state.shake,
      (pressed) => {
        if (!pressed) return;
        if (isEditableElementActive()) return;
        handleShake(); // handleShake already checks isShaking and isLoading
      }
    );
    const unsubscribeReset = subscribe(
      (state) => state.reset,
      (pressed) => pressed && resetBall()
    );
    return () => {
      unsubscribeShake();
      unsubscribeReset();
    };
  }, [subscribe, handleShake, resetBall]);

  const handleClick = useCallback(() => {
    handleShake();
  }, [handleShake]);

  const ballStyle = {
    width: size,
    height: size,
    background: `
      radial-gradient(circle at 30% 20%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 15%, transparent 40%),
      radial-gradient(circle at 70% 80%, rgba(255,255,255,0.1) 0%, transparent 30%),
      linear-gradient(135deg, #1a1a1a 0%, #000000 50%, #0a0a0a 100%)
    `,
    borderRadius: "50%",
    boxShadow: `
      inset 0 0 ${size * 0.1}px rgba(255,255,255,0.1),
      inset 0 ${size * 0.05}px ${size * 0.1}px rgba(255,255,255,0.2),
      0 ${size * 0.1}px ${size * 0.2}px rgba(0,0,0,0.8),
      0 ${size * 0.05}px ${size * 0.15}px rgba(0,0,0,0.6)
    `,
    position: "relative" as const,
    cursor: "pointer",
    userSelect: "none" as const,
  };

  const viewportStyle = {
    width: size * 0.4,
    height: size * 0.4,
    background: `
      radial-gradient(circle at center, #001122 0%, #000811 70%, #000000 100%)
    `,
    borderRadius: "50%",
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    boxShadow: `
      inset 0 0 ${size * 0.05}px rgba(0,0,0,0.9),
      inset 0 ${size * 0.02}px ${size * 0.04}px rgba(0,0,0,0.8)
    `,
    overflow: "hidden",
  };

  const liquidStyle = {
    position: "absolute" as const,
    inset: 0,
    background: `
      radial-gradient(circle at 40% 30%, rgba(0,50,100,0.8) 0%, rgba(0,20,50,0.6) 50%, rgba(0,10,30,0.9) 100%)
    `,
    borderRadius: "50%",
    filter: "blur(1px)",
  };

  const icosahedronStyle = {
    width: size * 0.25,
    height: size * 0.25,
    background: `
      linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)
    `,
    borderRadius: "20%",
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    boxShadow: `
      inset 0 0 ${size * 0.02}px rgba(255,255,255,0.1),
      0 ${size * 0.01}px ${size * 0.02}px rgba(0,0,0,0.8)
    `,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
  };

  const answerTextStyle = {
    color: "#ffffff",
    fontSize: size * 0.04,
    fontWeight: "bold" as const,
    textAlign: "center" as const,
    padding: size * 0.02,
    textShadow: "0 0 10px rgba(255,255,255,0.5)",
    lineHeight: 1.2,
    maxWidth: "100%",
    wordWrap: "break-word" as const,
  };

  const useGL = true;

  return (
    <motion.div
      ref={ballRef}
      style={ballStyle}
      onClick={handleClick}
      animate={isLoading ? {
        x: [-5, 5, -5, 5, -3, 3, -3, 3, -1, 1, 0],
        y: [-3, 3, -3, 3, -2, 2, -2, 2, -1, 1, 0],
        rotate: [-2, 2, -2, 2, -1, 1, -1, 1, 0],
      } : {}}
      transition={{
        duration: isLoading ? 2 : 0.3,
        ease: "easeInOut"
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onPointerEnter={() => (document.body.style.cursor = 'pointer')}
      onPointerLeave={() => (document.body.style.cursor = 'default')}
    >
      <div style={viewportStyle}>
        {useGL && (
          <ThreeBall isShaking={isShaking} response={response} isAnswerVisible={isAnswerVisible} />
        )}
        {!useGL && (
          <AnimatePresence mode="wait">
            {!isAnswerVisible ? (
              <motion.div
                key="icosahedron"
                style={icosahedronStyle}
                initial={{ y: 0, opacity: 1, scale: 1 }}
                animate={(isLoading || (response && !isAnswerVisible)) ? {
                  y: -size * 0.3,
                  opacity: 0,
                  scale: 0.8,
                  rotateX: 180,
                } : {
                  y: 0,
                  opacity: 1,
                  scale: 1,
                  rotateX: 0,
                }}
                exit={{
                  y: -size * 0.3,
                  opacity: 0,
                  scale: 0.8,
                  rotateX: 180,
                }}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut"
                }}
              />
            ) : (
              <motion.div
                key="answer"
                style={{
                  position: "absolute" as const,
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: size * 0.03,
                }}
                initial={{ 
                  y: size * 0.3, 
                  opacity: 0, 
                  scale: 0.8,
                  rotateX: -180 
                }}
                animate={{ 
                  y: 0, 
                  opacity: 1, 
                  scale: 1,
                  rotateX: 0 
                }}
                transition={{
                  duration: 1.2,
                  ease: "easeOut",
                  delay: 0.3
                }}
              >
                <div style={answerTextStyle}>
                  {response}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Glossy highlight overlay */}
      <div
        style={{
          position: "absolute",
          top: size * 0.1,
          left: size * 0.15,
          width: size * 0.3,
          height: size * 0.2,
          background: "radial-gradient(ellipse, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
          borderRadius: "50%",
          filter: "blur(2px)",
          pointerEvents: "none",
        }}
      />
    </motion.div>
  );
};

export default Magic8Ball;