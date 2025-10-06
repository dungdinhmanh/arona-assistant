import { useState, useEffect, useRef } from "react";
import "./App.css";
import SpineModel from "./features/live2d-viewer/SpineModel";
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { User, Settings as SettingsIcon, Lock, Unlock } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu.tsx";
import Settings from "./components/ui/Settings";

function App() {
  const [model, setModel] = useState<'Arona' | 'Plana'>('Arona');
  const [isLocked, setIsLocked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [decorations, setDecorations] = useState(true);
  const appWindow = useRef<WebviewWindow | null>(null);

  useEffect(() => {
    if (window.__TAURI__) {
      appWindow.current = WebviewWindow.getCurrent();
    }
  }, []);



  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className="container"
            data-tauri-drag-region={!isLocked}
            style={{ opacity }}
          >
            <SpineModel
              modelName={model}
              setModel={setModel}
              setShowSettings={setShowSettings}
              decorations={decorations}
              setDecorations={setDecorations}
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setModel(model === 'Arona' ? 'Plana' : 'Arona')}>
            <User className="mr-2 h-4 w-4" />
            <span>Switch to {model === 'Arona' ? 'Plana' : 'Arona'}</span>
          </ContextMenuItem>
          <ContextMenuCheckboxItem checked={isLocked} onCheckedChange={setIsLocked}>
            {isLocked ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
            <span>Lock Position</span>
          </ContextMenuCheckboxItem>
          <ContextMenuItem onClick={() => setShowSettings(true)}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => {
            const newDecorations = !decorations;
            setDecorations(newDecorations);
            appWindow.current?.setDecorations(newDecorations);
            setIsLocked(!newDecorations);
          }}>
            <span>{decorations ? 'Hide' : 'Show'} Decorations</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {showSettings && (
        <Settings
          opacity={opacity}
          setOpacity={setOpacity}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}

export default App;
