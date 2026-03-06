'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AVAILABLE_MODELS } from '@/types';
import type { ApiConfig } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ApiConfig) => void;
  initialConfig: ApiConfig;
}

export function SettingsModal({ isOpen, onClose, onSave, initialConfig }: SettingsModalProps) {
  const [config, setConfig] = useState<ApiConfig>(initialConfig);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  if (!isOpen) return null;

  const handleToggleModel = (modelId: string) => {
    const newModels = config.optimizerModels.includes(modelId)
      ? config.optimizerModels.filter(id => id !== modelId)
      : [...config.optimizerModels, modelId];
    setConfig({ ...config, optimizerModels: newModels });
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>API 配置</span>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-xl"
            >
              ×
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API 配置 */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">基础配置</h3>
            <div>
              <label className="block text-sm font-medium mb-1">API Base URL</label>
              <input
                type="text"
                placeholder="https://coding.dashscope.aliyuncs.com/v1"
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <input
                type="password"
                placeholder="sk-..."
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>

          {/* 优化模型选择 */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">优化模型（选择多个）</h3>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_MODELS.map((model) => (
                <label
                  key={model.id}
                  className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                    config.optimizerModels.includes(model.id)
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={config.optimizerModels.includes(model.id)}
                    onChange={() => handleToggleModel(model.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{model.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 裁判模型选择 */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">评分模型（选择一个）</h3>
            <select
              value={config.judgeModel}
              onChange={(e) => setConfig({ ...config, judgeModel: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">请选择...</option>
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            <p>💡 配置说明：</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Base URL 和 API Key 仅存储在本地浏览器</li>
              <li>优化模型可选择多个并行优化</li>
              <li>评分模型用于对优化结果排序</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              取消
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={!config.baseUrl || !config.apiKey || config.optimizerModels.length === 0 || !config.judgeModel}
            >
              保存
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}