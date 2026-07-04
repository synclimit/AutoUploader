import React, { useState, useEffect } from 'react';
import { Sparkles, Server, Key, CheckCircle2, XCircle } from 'lucide-react';
import PreferenceSection from './PreferenceSection';
import PreferenceToggle from './PreferenceToggle';
import PreferenceDropdown from './PreferenceDropdown';
import PreferenceSlider from './PreferenceSlider';

export default function AiSettingsSection({ config, updateConfig }) {
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  
  const [apiKeyMasked, setApiKeyMasked] = useState(true);
  const [tempApiKey, setTempApiKey] = useState('');

  // Update temp state when config loads
  useEffect(() => {
    if (config?.ai_api_key && config.ai_api_key.startsWith('********')) {
      setApiKeyMasked(true);
      setTempApiKey(config.ai_api_key);
    } else {
      setApiKeyMasked(false);
      setTempApiKey(config?.ai_api_key || '');
    }
  }, [config?.ai_api_key]);

  const handleProviderChange = (v) => {
    updateConfig('ai_provider', v);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const payload = {
        provider: config.ai_provider,
        api_key: apiKeyMasked ? null : tempApiKey,
      };
      
      const res = await fetch('/api/v1/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setTestResult(data.data);
    } catch (e) {
      setTestResult({ success: false, error: 'Failed to connect to backend', authentication: 'Unknown', latency_ms: 0, endpoint: 'Unknown', provider: config.ai_provider });
    }
    setTesting(false);
  };

  const handleKeyChange = (e) => {
    setTempApiKey(e.target.value);
    updateConfig('ai_api_key', e.target.value);
  };

  const handleReplaceKey = () => {
    setApiKeyMasked(false);
    setTempApiKey('');
    updateConfig('ai_api_key', '');
  };

  return (
    <PreferenceSection id="ai" title="AI Engine Settings" icon={Sparkles} description="Choose your AI provider and authenticate to enable intelligent metadata generation.">
      
      <PreferenceToggle 
        label="Enable AI Engine" description="Master switch for AI processing."
        checked={config.ai_enabled} onChange={(v) => updateConfig('ai_enabled', v)}
      />

      {config.ai_enabled && (
        <div className="flex flex-col gap-6 pt-4 border-t border-white/[0.05]">
          
          <div className="flex flex-col gap-1">
            <PreferenceDropdown 
              label="AI Provider" description="Select the core engine provider."
              value={config.ai_provider || 'gemini'} onChange={handleProviderChange}
              options={[
                {label: 'Google Gemini', value: 'gemini'}, 
                {label: 'OpenAI', value: 'openai'}, 
                {label: 'Groq', value: 'groq'},
                {label: 'Cerebras', value: 'cerebras'},
                {label: 'SambaNova', value: 'sambanova'},
                {label: 'NVIDIA NIM', value: 'nvidia'},
                {label: 'Mistral', value: 'mistral'},
                {label: 'OpenRouter', value: 'openrouter'},
                {label: 'Cohere', value: 'cohere'},
                {label: 'Cloudflare Workers AI', value: 'cloudflare'},
                {label: 'Zhipu AI (Z.ai)', value: 'zhipu'},
                {label: 'Atomesus', value: 'atomesus'},
                {label: 'Opencode Zen', value: 'opencode'},
                {label: 'Ollama Cloud', value: 'ollama'},
                {label: 'HuggingFace Router', value: 'huggingface'}
              ]}
            />
            {(() => {
              const links = {
                gemini: 'https://aistudio.google.com/app/apikey',
                openai: 'https://platform.openai.com/api-keys',
                groq: 'https://console.groq.com/keys',
                cerebras: 'https://cloud.cerebras.ai/platform/api-keys',
                sambanova: 'https://cloud.sambanova.ai/apis',
                nvidia: 'https://build.nvidia.com/explore/discover',
                mistral: 'https://console.mistral.ai/api-keys/',
                openrouter: 'https://openrouter.ai/keys',
                cohere: 'https://dashboard.cohere.com/api-keys',
                cloudflare: 'https://dash.cloudflare.com/',
                zhipu: 'https://open.bigmodel.cn/usercenter/apikeys',
                atomesus: 'https://atomesus.com/developer/api-keys',
                opencode: 'https://opencode.zen/',
                ollama: 'https://ollama.com/',
                huggingface: 'https://huggingface.co/settings/tokens'
              };
              const url = links[config.ai_provider || 'gemini'];
              if (url) {
                return (
                  <div className="flex justify-end mt-[-10px] mb-2 pr-2">
                    <button 
                      onClick={() => fetch('/api/v1/system/open-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })}
                      className="text-[11px] font-medium text-[var(--accent-400)] hover:text-white transition-colors underline flex items-center gap-1"
                    >
                      Get API Key ↗
                    </button>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-white/80">API Key</label>
            <div className="flex items-center gap-2">
              <input 
                type="text"
                value={tempApiKey}
                onChange={handleKeyChange}
                disabled={apiKeyMasked}
                placeholder="Enter API Key"
                className="bg-black/30 border border-white/10 rounded-md px-3 py-2 text-[13px] text-white flex-1 outline-none focus:border-[var(--accent-500)]/50 disabled:opacity-50"
              />
              {apiKeyMasked && (
                <button onClick={handleReplaceKey} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-md text-[13px] transition-colors border border-white/10">
                  Replace API Key
                </button>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={testConnection} 
              disabled={testing}
              className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-md text-[13px] transition-colors border border-indigo-500/20 flex items-center gap-2"
            >
              <Server size={14} />
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            
            {testResult && (
              <div className={`mt-4 p-4 rounded-md border ${testResult.success ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <div className="flex items-start gap-3">
                  {testResult.success ? <CheckCircle2 className="text-green-500 mt-0.5" size={16} /> : <XCircle className="text-red-500 mt-0.5" size={16} />}
                  <div className="flex-1">
                    <h4 className={`text-[13px] font-medium ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                      {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                    </h4>
                    <div className="mt-2 grid grid-cols-2 gap-y-2 gap-x-4 text-[12px]">
                      <div className="text-white/50">Provider: <span className="text-white/90">{testResult.provider}</span></div>
                      <div className="text-white/50">Auth: <span className="text-white/90">{testResult.authentication}</span></div>
                      <div className="text-white/50">Latency: <span className="text-white/90">{testResult.latency_ms}ms</span></div>
                      {!testResult.success && testResult.error && (
                        <div className="text-red-400/80 col-span-2 mt-2 bg-red-500/10 p-2 rounded">
                          <span className="font-semibold block mb-1">Error Details:</span>
                          <span className="font-mono text-[10px] break-all">{testResult.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t border-white/[0.05] mt-2 pt-6 flex flex-col gap-6">
            <PreferenceSlider 
              label="AI Temperature" description="Higher values make output more creative."
              min={0} max={1} step={0.1} value={parseFloat(config.ai_temperature) || 0.7} onChange={(v) => updateConfig('ai_temperature', v.toString())}
            />
            <PreferenceSlider 
              label="Max Tokens" description="Limit for generated output length."
              min={256} max={8192} step={256} value={config.ai_max_tokens || 2048} onChange={(v) => updateConfig('ai_max_tokens', v)}
            />
          </div>
        </div>
      )}

    </PreferenceSection>
  );
}
