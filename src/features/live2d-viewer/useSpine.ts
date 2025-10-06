import { useEffect, useRef } from 'react';


declare global {
  interface Window {
    spine: any;
  }
}

interface SpineParams {
  modelName: 'Arona' | 'Plana';
  canvasRef: React.RefObject<HTMLCanvasElement>;
  setModel: (model: 'Arona' | 'Plana') => void;
  setShowSettings: (show: boolean) => void;
  decorations: boolean;
  setDecorations: (decorations: boolean) => void;
}

export const useSpine = ({ modelName, canvasRef, setModel, setShowSettings, decorations, setDecorations }: SpineParams) => {
  const animationFrameId = useRef<number>();
  const spineData = useRef<any>(null);

  // Interaction refs
  const TPoint = useRef<any>(null);
  const TEye = useRef<any>(null);
  const PPointX = useRef<number>(0);
  const PPointY = useRef<number>(0);
  const EPointX = useRef<number>(0);
  const EPointY = useRef<number>(0);
  const mouseSelect = useRef<number>(-1);
  const acceptingClick = useRef<boolean>(true);
  const trackerID = useRef<any>(-1);
  const untrackerID = useRef<any>(-1);
  const unpetID = useRef<any>(-1);
  const mousePos = useRef({ x: 0, y: 0 });



  const HEADPAT_CLAMP = 30;
  const EYE_CLAMP_X = 200;
  const EYE_CLAMP_Y = EYE_CLAMP_X * (9 / 16);
  const HEADPAT_STEP = 5;
  const EYE_STEP = 10;

  const clamp = (num: number, min: number, max: number) => {
    return Math.min(Math.max(num, min), max);
  }

  useEffect(() => {
    let isCancelled = false;

    if (!canvasRef.current || !window.spine) return;

    const canvas = canvasRef.current;
    const modelPath = modelName === 'Arona' ? 'arona' : 'plana';
    const modelFile = modelName === 'Arona' ? 'arona_spr' : 'NP0035_spr';
    const atlasPath = `/models/${modelPath}/${modelFile}.atlas`;
    const skelPath = `/models/${modelPath}/${modelFile}.skel`;

    let gl: WebGLRenderingContext | null = null;
    let shader: any, batcher: any, mvp: any, skeletonRenderer: any;
    let lastFrameTime = Date.now() / 1000;
    let assetManager: any;

    const loadSpine = async () => {
      try {
        gl = (canvas.getContext('webgl', { alpha: true }) || canvas.getContext('experimental-webgl', { alpha: true })) as WebGLRenderingContext;
        if (!gl || isCancelled) return;

        shader = window.spine.webgl.Shader.newTwoColoredTextured(gl);
        batcher = new window.spine.webgl.PolygonBatcher(gl);
        mvp = new window.spine.webgl.Matrix4();
        skeletonRenderer = new window.spine.webgl.SkeletonRenderer(gl);
        assetManager = new window.spine.webgl.AssetManager(gl);

        assetManager.loadTextureAtlas(atlasPath);
        assetManager.loadBinary(skelPath);

        await new Promise<void>((resolve, reject) => {
            const checkLoading = () => {
                if (isCancelled) {
                    reject(new Error('Component unmounted'));
                    return;
                }
                if (assetManager.isLoadingComplete()) {
                    resolve();
                } else {
                    requestAnimationFrame(checkLoading);
                }
            };
            checkLoading();
        });

        const atlas = assetManager.get(atlasPath);
        const atlasLoader = new window.spine.AtlasAttachmentLoader(atlas);
        const skeletonBinary = new window.spine.SkeletonBinary(atlasLoader);
        const skeletonData = skeletonBinary.readSkeletonData(assetManager.get(skelPath));
        const skeleton = new window.spine.Skeleton(skeletonData);
        const animationStateData = new window.spine.AnimationStateData(skeletonData);
        const animationState = new window.spine.AnimationState(animationStateData);

        const calculateSetupPoseBounds = (skeleton: any) => {
            skeleton.setToSetupPose();
            skeleton.updateWorldTransform();
            const offset = new window.spine.Vector2();
            const size = new window.spine.Vector2();
            skeleton.getBounds(offset, size, []);
            return { offset, size };
        };

        const bounds = calculateSetupPoseBounds(skeleton);

        const idleAnimation = skeletonData.animations.find((anim: any) => anim.name.includes('Idle')) || skeletonData.animations[0];
        animationState.setAnimation(0, idleAnimation.name, true);

        spineData.current = { skeleton, animationState, bounds };

        TPoint.current = skeleton.findBone('Touch_Point');
        TEye.current = skeleton.findBone('Touch_Eye');
        if (TPoint.current) {
          PPointX.current = TPoint.current.x;
          PPointY.current = TPoint.current.y;
        }
        if (TEye.current) {
          EPointX.current = TEye.current.x;
          EPointY.current = TEye.current.y;
        }

        requestAnimationFrame(render);
      } catch (error) {
        if (!isCancelled) console.error('Error loading spine model:', error);
      }
    };

    const render = () => {
      if (isCancelled || !gl || !spineData.current) return;

      const now = Date.now() / 1000;
      const delta = now - lastFrameTime;
      lastFrameTime = now;

      resize();

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const { skeleton, animationState, bounds } = spineData.current;

      // Auto-scaling and centering logic
      // Calculate the optimal scale to fit the model within the canvas while maintaining aspect ratio.
      const scale = Math.min(canvas.width / bounds.size.x, canvas.height / bounds.size.y) * 0.9;
      skeleton.scaleX = scale;
      skeleton.scaleY = scale;

      // Center the model on the canvas.
      skeleton.x = canvas.width / 2 - (bounds.offset.x + bounds.size.x / 2) * scale;
      skeleton.y = canvas.height / 2 - (bounds.offset.y + bounds.size.y / 2) * scale;
      animationState.update(delta);
      animationState.apply(skeleton);
      skeleton.updateWorldTransform();

      shader.bind();
      shader.setUniformi(window.spine.webgl.Shader.SAMPLER, 0);
      shader.setUniform4x4f(window.spine.webgl.Shader.MVP_MATRIX, mvp.values);

      batcher.begin(shader);
      skeletonRenderer.draw(batcher, skeleton);
      batcher.end();

      shader.unbind();

      animationFrameId.current = requestAnimationFrame(render);
    };

    const resize = () => {
      if (isCancelled || !gl || !canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      mvp.ortho2d(0, 0, canvas.width, canvas.height);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    /**
     * Converts screen coordinates (e.g., from a mouse click) to the Spine model's local coordinates.
     * This is essential for accurate hit detection and interaction.
     * @param x The x-coordinate on the screen.
     * @param y The y-coordinate on the screen.
     * @returns The corresponding {x, y} coordinates within the Spine model's coordinate system.
     */
    const t = (x: number, y: number) => {
      if (!canvas || !spineData.current) return { x: 0, y: 0 };
      const { skeleton } = spineData.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = skeleton.scaleX;
      const scaleY = skeleton.scaleY;

      // 1. Adjust for canvas position and model's origin.
      const canvasX = (x - rect.left) - skeleton.x;
      const canvasY = (y - rect.top) - skeleton.y;

      // 2. Invert the scaling to get coordinates in the model's original, unscaled space.
      const originalX = canvasX / scaleX;
      // The y-axis is inverted between the browser and WebGL.
      const originalY = (canvas.height - canvasY) / scaleY;

      return { x: originalX, y: originalY };
    };

    const trackMouse = () => {
      if (isCancelled || !TEye.current || !canvas) return;
      let adjX = (mousePos.current.x / canvas.width) - 0.5;
      let adjY = (mousePos.current.y / canvas.height) - 0.5;

      const targetY = EPointY.current - (adjX * EYE_CLAMP_X);
      const targetX = EPointX.current - (adjY * EYE_CLAMP_Y);

      const lerpFactor = 0.1;
      TEye.current.y += (targetY - TEye.current.y) * lerpFactor;
      TEye.current.x += (targetX - TEye.current.x) * lerpFactor;

      TEye.current.y = clamp(TEye.current.y, EPointY.current - EYE_CLAMP_X, EPointY.current + EYE_CLAMP_X);
      TEye.current.x = clamp(TEye.current.x, EPointX.current - EYE_CLAMP_Y, EPointX.current + EYE_CLAMP_Y);

      if (trackerID.current !== -1) {
        trackerID.current = requestAnimationFrame(trackMouse);
      }
    };
    
    const untrackMouse = () => {
      if (isCancelled || !TEye.current) return;
      if (Math.abs(TEye.current.y - EPointY.current) <= EYE_STEP && Math.abs(TEye.current.x - EPointX.current) <= EYE_STEP) {
        if (untrackerID.current !== -1) {
          TEye.current.y = EPointY.current;
          TEye.current.x = EPointX.current;
          clearInterval(untrackerID.current);
          untrackerID.current = -1;
          setTimeout(() => { if (!isCancelled) acceptingClick.current = true; }, 500);
        }
        return;
      }
      if (TEye.current.y > EPointY.current) TEye.current.y -= EYE_STEP;
      else if (TEye.current.y < EPointY.current) TEye.current.y += EYE_STEP;
      if (TEye.current.x > EPointX.current) TEye.current.x -= EYE_STEP;
      else if (TEye.current.x < EPointX.current) TEye.current.x += EYE_STEP;
    };

    const unpet = () => {
      if (isCancelled || !TPoint.current) return;
      if (Math.abs(TPoint.current.x - PPointX.current) <= HEADPAT_STEP && Math.abs(TPoint.current.y - PPointY.current) <= HEADPAT_STEP) {
        if (unpetID.current !== -1) {
          TPoint.current.x = PPointX.current;
          TPoint.current.y = PPointY.current;
          clearInterval(unpetID.current);
          unpetID.current = -1;
          setTimeout(() => { if (!isCancelled) acceptingClick.current = true; }, 500);
        }
        return;
      }
      if (TPoint.current.y > PPointY.current) TPoint.current.y -= HEADPAT_STEP;
      else if (TPoint.current.y < PPointY.current) TPoint.current.y += HEADPAT_STEP;
      if (TPoint.current.x > PPointX.current) TPoint.current.x -= HEADPAT_STEP;
      else if (TPoint.current.x < PPointX.current) TPoint.current.x += HEADPAT_STEP;
    };

    const pressedMouse = (x: number, y: number) => {
      if (isCancelled || !spineData.current) return;
      const { animationState } = spineData.current;
      const { x: tx, y: ty } = t(x, y);

      if (mouseSelect.current <= 0 && TPoint.current) {
        const headpatBone = TPoint.current;
        const distance = Math.sqrt(Math.pow(tx - headpatBone.worldX, 2) + Math.pow(ty - headpatBone.worldY, 2));
        if (distance < 150) {
          animationState.setAnimation(1, 'Pat_01_M', false);
          if (modelName === 'Arona') animationState.setAnimation(2, 'Pat_01_A', false);
          mouseSelect.current = 1;
          return;
        }
      }
      
      if (trackerID.current === -1) {
        trackerID.current = requestAnimationFrame(trackMouse);
      }
      animationState.setEmptyAnimation(1, 0);
      if (modelName === 'Arona') animationState.setEmptyAnimation(2, 0);
      const eyetracking = animationState.addAnimation(1, 'Look_01_M', false, 0);
      eyetracking.mixDuration = 0.2;
      if (modelName === 'Arona') {
        const eyetracking2 = animationState.addAnimation(2, 'Look_01_A', false, 0);
        eyetracking2.mixDuration = 0.2;
      }
      mousePos.current = { x, y };
      mouseSelect.current = 3;
    };

    const movedMouse = (x: number, y: number, deltaX: number, deltaY: number) => {
        if (isCancelled || !canvas) return;
        switch (mouseSelect.current) {
            case 1:
              if (!TPoint.current) return;
              if ((y < canvas.height / 2 && deltaY < 0) || (x >= canvas.width / 2 && deltaX > 0)) {
                TPoint.current.y = clamp(TPoint.current.y - HEADPAT_STEP, PPointY.current - HEADPAT_CLAMP, PPointY.current + HEADPAT_CLAMP);
              } else if ((y >= canvas.height / 2 && deltaY > 0) || (x < canvas.width / 2 && deltaX < 0)) {
                TPoint.current.y = clamp(TPoint.current.y + HEADPAT_STEP, PPointY.current - HEADPAT_CLAMP, PPointY.current + HEADPAT_CLAMP);
              }
              break;
            case 2:
              mouseSelect.current = -1;
              acceptingClick.current = true;
              break;
            case 3:
              mousePos.current = { x, y };
              break;
        }
    };

    const releasedMouse = () => {
      if (isCancelled || !spineData.current) return;
      const { animationState } = spineData.current;

      switch (mouseSelect.current) {
        case 1:
          if (unpetID.current === -1) unpetID.current = setInterval(unpet, 20);
          animationState.setAnimation(1, 'PatEnd_01_M', false);
          if (modelName === 'Arona') animationState.setAnimation(2, 'PatEnd_01_A', false);
          animationState.addEmptyAnimation(1, 0.5, 0);
          if (modelName === 'Arona') animationState.addEmptyAnimation(2, 0.5, 0);
          break;
        case 2:
          animationState.setAnimation(1, 'Touch_01_M', false);
          if (modelName === 'Arona') animationState.setAnimation(2, 'Touch_01_A', false);
          setTimeout(() => {
            if (isCancelled) return;
            animationState.addEmptyAnimation(1, 0.5, 0);
            if (modelName === 'Arona') animationState.addEmptyAnimation(2, 0.5, 0);
            acceptingClick.current = true;
          }, 1000);
          break;
        case 3:
          if (trackerID.current !== -1) {
            cancelAnimationFrame(trackerID.current);
            trackerID.current = -1;
          }
          if (untrackerID.current === -1) untrackerID.current = setInterval(untrackMouse, 20);
          const eyetracking = animationState.setAnimation(1, 'LookEnd_01_M', false);
          eyetracking.mixDuration = 0;
          if (modelName === 'Arona') {
             const eyetracking2 = animationState.setAnimation(2, 'LookEnd_01_A', false);
             eyetracking2.mixDuration = 0;
          }
          animationState.addEmptyAnimation(1, 0.5, 0);
          if (modelName === 'Arona') animationState.addEmptyAnimation(2, 0.5, 0);
          break;
        default:
          acceptingClick.current = true;
      }
      mouseSelect.current = -1;
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (!acceptingClick.current) return;
      acceptingClick.current = false;
      pressedMouse(event.clientX, event.clientY);
    };

    const handleMouseUp = () => releasedMouse();
    const handleMouseMove = (event: MouseEvent) => movedMouse(event.clientX, event.clientY, event.movementX, event.movementY);

    loadSpine();

    const handleResize = () => resize();

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      isCancelled = true;
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);

      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (trackerID.current !== -1) cancelAnimationFrame(trackerID.current);
      if (untrackerID.current !== -1) clearInterval(untrackerID.current);
      if (unpetID.current !== -1) clearInterval(unpetID.current);
      if (assetManager) assetManager.dispose();
    };

  }, [modelName, canvasRef, setModel, setShowSettings, decorations, setDecorations]);
};