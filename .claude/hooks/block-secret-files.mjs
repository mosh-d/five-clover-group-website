// PreToolUse hook (Bash, PowerShell): stops a shell command that names a local secrets file
// (.env, .env.local, .env.production, .dev.vars, api.env …) or the project's secrets folder.
// The AI's file tools are stopped by the Read/Edit deny rules in .claude/settings.json; this
// covers shell commands too. .env.example stays allowed. Programs may still load their own
// settings; they just aren't named on the command line.
//
// Set SECRETS_FOLDER to the name of this project's secrets folder (outside the repository).
import { readFileSync } from 'node:fs';

const SECRETS_FOLDER = 'project-secrets';

const input = JSON.parse(readFileSync(0, 'utf8'));
const command = String(input.tool_input?.command ?? '');

// ".env" or ".dev.vars" as a file name (not process.env, import.meta.env or .env.example).
const secretFile =
  /(^|[^\w.-])(\.env(\.(local|development|production|test|[\w-]+\.local))?|\.dev\.vars)(?![\w.-])/i;

// Any file named <something>.env (api.env, backup.env), but not process.env or meta.env.
const namedEnvFile = /\b(?!(?:process|meta)\.env\b)[\w-]+\.env(?![\w.-])/i;

const escaped = SECRETS_FOLDER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const secretsFolder = new RegExp(escaped, 'i');

if (secretFile.test(command) || namedEnvFile.test(command) || secretsFolder.test(command)) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          'Blocked: this command names a local secrets file or the secrets folder. The owner has locked the AI out of these; ask the owner to run it, or use a value-free check script.',
      },
    }),
  );
}
