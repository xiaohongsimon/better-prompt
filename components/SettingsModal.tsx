'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface ApiKeys {
  anthropic: string;
  openai: string;
  google: string;
  zhipu: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (keys: ApiKeys) => void;
  initialKeys: ApiKeys;
}

export function SettingsModal({ isOpen, onClose, onSave, initialKeys }: SettingsModalProps) {
  const [keys, setKeys] = useState<ApiKeys>(initialKeys);

  useEffect(() => {
    setKeys(initialKeys);
  }, [initialKeys]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(keys);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>API Keys 配置</span>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-xl"
            >
              ×
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Anthropic (Claude)</label>
            <Textarea
              placeholder="sk-ant-..."
              value={keys.anthropic}
              onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })}
              className="min-h-[40px] h-10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">OpenAI (GPT-4)</label>
            <Textarea
              placeholder="sk-..."
              value={keys.openai}
              onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
              className="min-h-[40px] h-10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Google (Gemini)</label>
            <Textarea
              placeholder="AIza..."
              value={keys.google}
              onChange={(e) => setKeys({ ...keys, google: e.target.value })}
              className="min-h-[40px] h-10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">智谱 AI (GLM-5 裁判)</label>
            <Textarea
              placeholder="..."
              value={keys.zhipu}
              onChange={(e) => setKeys({ ...keys, zhipu: e.target.value })}
              className="min-h-[40px] h-10"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            * API Keys 仅存储在本地浏览器，不会上传到服务器
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              取消
            </Button>
            <Button onClick={handleSave} className="flex-1">
              保存
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}