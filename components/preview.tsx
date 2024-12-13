import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult, ExecutionResultSandbox } from '@/lib/types'
import { DeepPartial } from 'ai'
import { cn } from '@/lib/utils'

interface PreviewProps {
  apiKey?: string
  selectedTab: 'code' | 'fragment'
  onSelectedTabChange: (tab: 'code' | 'fragment') => void
  isChatLoading: boolean
  isPreviewLoading: boolean
  fragment: DeepPartial<FragmentSchema>
  result: ExecutionResult | undefined
  onClose: () => void
}

export function Preview({
  apiKey,
  selectedTab,
  onSelectedTabChange,
  isChatLoading,
  isPreviewLoading,
  fragment,
  result,
  onClose,
}: PreviewProps) {
  const isSandbox = result?.type === 'sandbox'

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <Tabs value={selectedTab} onValueChange={(v) => onSelectedTabChange(v as 'code' | 'fragment')}>
          <TabsList>
            <TabsTrigger value="code" disabled={!fragment?.code}>Kód</TabsTrigger>
            <TabsTrigger value="fragment" disabled={!result}>Fragment</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <TabsContent value="code" className="mt-0">
          {isPreviewLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          ) : fragment?.code ? (
            <div className="relative">
              <pre className={cn(
                "p-4 rounded-lg bg-muted overflow-x-auto",
                "text-sm font-mono"
              )}>
                {fragment.code}
              </pre>
              {fragment.file_path && (
                <div className="absolute top-2 right-2 text-xs text-muted-foreground">
                  {fragment.file_path}
                </div>
              )}
            </div>
          ) : null}
        </TabsContent>
        <TabsContent value="fragment" className="mt-0">
          {isPreviewLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          ) : result ? (
            <div className="space-y-4">
              {isSandbox && (result as ExecutionResultSandbox).url && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm font-medium">URL:</p>
                  <a 
                    href={(result as ExecutionResultSandbox).url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline break-all"
                  >
                    {(result as ExecutionResultSandbox).url}
                  </a>
                </div>
              )}
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm font-medium mb-2">Výsledek:</p>
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </TabsContent>
      </div>
    </div>
  )
}
