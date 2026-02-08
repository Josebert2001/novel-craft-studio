import { useState } from "react";
import { X, Check, AlertCircle } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  initialApiKey?: string;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onSave,
  initialApiKey = "",
}: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey);
      setTestResult(null);
      setTestError(null);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestError("Please enter an API key first");
      return;
    }

    setTestLoading(true);
    setTestError(null);
    setTestResult(null);

    try {
      // Dynamic import to avoid issues if @google/generative-ai isn't available
      const { GoogleGenerativeAI } = await import(
        "@google/generative-ai"
      );

      const client = new GoogleGenerativeAI(apiKey);
      const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Make a simple test call
      await model.generateContent("Say 'OK' in one word");

      setTestResult("Connection successful! ✓");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("API key")) {
        setTestError("Invalid API key. Please check and try again.");
      } else {
        setTestError("Connection failed. " + errorMessage);
      }
    } finally {
      setTestLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg max-w-sm w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* API Key Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key..."
              className="w-full px-3 py-2 border border-border rounded bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              Get your free API key at{" "}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                makersuite.google.com/app/apikey
              </a>
            </p>
          </div>

          {/* Test Result Messages */}
          {testResult && (
            <div className="p-3 bg-green-50 border border-green-200 rounded flex items-start gap-2">
              <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-700">{testResult}</p>
            </div>
          )}

          {testError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{testError}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleTestConnection}
              disabled={testLoading || !apiKey.trim()}
              className="flex-1 px-4 py-2 border border-border rounded font-medium text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testLoading ? "Testing..." : "Test Connection"}
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
