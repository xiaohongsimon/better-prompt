'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { JudgeResult } from '@/types';

interface OptimizedCardProps {
  result: JudgeResult;
  optimizedPrompt: string;
  rank: number;
}

const rankStyles = [
  {
    border: 'border-yellow-400',
    badge: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    icon: '👑',
  },
  {
    border: 'border-slate-300',
    badge: 'bg-gradient-to-r from-slate-300 to-slate-400',
    icon: '🥈',
  },
  {
    border: 'border-amber-600',
    badge: 'bg-gradient-to-r from-amber-600 to-amber-700',
    icon: '🥉',
  },
];

export function OptimizedCard({ result, optimizedPrompt, rank }: OptimizedCardProps) {
  const style = rankStyles[rank - 1] || { border: 'border-gray-200', badge: 'bg-gray-500', icon: '' };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(optimizedPrompt);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
    >
      <Card className={`border-2 ${style.border} shadow-lg hover:shadow-xl transition-shadow`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Badge className={`${style.badge} text-white font-bold`}>
              #{rank} {style.icon && <span className="ml-1">{style.icon}</span>}
            </Badge>
            <span className="text-lg font-semibold">{result.modelName || result.model}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg font-bold">
              {result.score}分
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-sm"
            >
              📋 复制
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4 mb-3">
            <p className="text-sm whitespace-pre-wrap">{optimizedPrompt}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">评分理由：</span>
            {result.reason}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}