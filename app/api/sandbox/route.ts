import { FragmentSchema } from '@/lib/schema'
import { ExecutionResultInterpreter, ExecutionResultSandbox } from '@/lib/types'
import { Sandbox } from '@e2b/code-interpreter'

const sandboxTimeout = 10 * 60 * 1000 // 10 minute in ms

export const maxDuration = 60

export async function POST(req: Request) {
  const {
    fragment,
    userID,
    apiKey,
  }: { fragment: FragmentSchema; userID: string; apiKey?: string } =
    await req.json()
  console.log('fragment', fragment)
  console.log('userID', userID)

  // Create a interpreter or a sandbox
  const sbx = await Sandbox.create(fragment.template, {
    metadata: { template: fragment.template, userID: userID },
    timeoutMs: sandboxTimeout,
    apiKey,
  })

  // Install packages
  if (fragment.has_additional_dependencies) {
    await sbx.commands.run(fragment.install_dependencies_command)
    console.log(
      `Installed dependencies: ${fragment.additional_dependencies.join(', ')} in sandbox ${sbx.sandboxId}`,
    )
  }

  // Copy code to fs
  if (fragment.code && Array.isArray(fragment.code)) {
    for (const file of fragment.code) {
      await sbx.files.write(file.file_path, file.file_content)
      console.log(`Copied file to ${file.file_path} in ${sbx.sandboxId}`)
    }
  } else if (fragment.code) {
    await sbx.files.write(fragment.file_path, fragment.code)
    console.log(`Copied file to ${fragment.file_path} in ${sbx.sandboxId}`)
  }

  // Execute code or return a URL to the running sandbox
  if (fragment.template === 'code-interpreter-v1') {
    const { logs, error, results } = await sbx.runCode(fragment.code || '')
    const output = logs ? `${logs.stdout || ''}${logs.stderr || ''}` : ''

    return new Response(
      JSON.stringify({
        type: 'interpreter',
        sbxId: sbx?.sandboxId,
        output,
        error: error,
      } as ExecutionResultInterpreter),
    )
  }

  return new Response(
    JSON.stringify({
      type: 'sandbox',
      sbxId: sbx?.sandboxId,
      url: `https://${sbx?.getHost(fragment.port || 80)}`,
    } as ExecutionResultSandbox),
  )
}
