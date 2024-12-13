import { TemplateId } from './templates'
import { ExecutionError, Result } from '@e2b/code-interpreter'

export interface ExecutionResultBase {
  url?: string
  sbxId?: string
}

export interface ExecutionResultInterpreter extends ExecutionResultBase {
  type: 'interpreter'
  output: string
  error?: string
}

export interface ExecutionResultSandbox extends ExecutionResultBase {
  type: 'sandbox'
  url: string
  sbxId: string
}

export type ExecutionResult = ExecutionResultInterpreter | ExecutionResultSandbox
