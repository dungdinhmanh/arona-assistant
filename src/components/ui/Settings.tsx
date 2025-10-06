import { Slider } from "./slider";

interface SettingsProps {
  opacity: number;
  setOpacity: (opacity: number) => void;
  onClose: () => void;
}

const Settings = ({ opacity, setOpacity, onClose }: SettingsProps) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white p-4 rounded-lg shadow-lg w-1/3" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-2 text-black">Settings</h3>
        <div className="flex items-center">
          <span className="mr-2 text-black">Opacity</span>
          <Slider
            min={0.1}
            max={1}
            step={0.1}
            value={[opacity]}
            onValueChange={(value) => setOpacity(value[0])}
          />
        </div>
      </div>
    </div>
  );
};

export default Settings;
