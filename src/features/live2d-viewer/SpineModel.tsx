import { useRef } from 'react';
import { useSpine } from './useSpine';

interface SpineModelProps {
  modelName: 'Arona' | 'Plana';
  setModel: (model: 'Arona' | 'Plana') => void;
  setShowSettings: (show: boolean) => void;
  decorations: boolean;
  setDecorations: (decorations: boolean) => void;
}

const SpineModel = (props: SpineModelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
    useSpine({ ...props, canvasRef });

  return (
    <canvas
      ref={canvasRef}
      className="spine-canvas"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
};

export default SpineModel;