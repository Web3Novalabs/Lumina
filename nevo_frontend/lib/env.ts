const REQUIRED_PUBLIC_ENV_VARS = [
  'NEXT_PUBLIC_API_BASE_URL',
  'NEXT_PUBLIC_STELLAR_NETWORK',
] as const;

type RequiredPublicEnvVar = (typeof REQUIRED_PUBLIC_ENV_VARS)[number];

const DEFAULT_PUBLIC_ENV_VALUES: Record<RequiredPublicEnvVar, string> = {
  NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3000',
  NEXT_PUBLIC_STELLAR_NETWORK: 'testnet',
};

function getPublicEnvVar(name: RequiredPublicEnvVar): string {
  return process.env[name] || DEFAULT_PUBLIC_ENV_VALUES[name];
}

export function validatePublicEnv(): void {
  REQUIRED_PUBLIC_ENV_VARS.forEach((name) => {
    getPublicEnvVar(name);
  });
}

export const env = {
  NEXT_PUBLIC_API_BASE_URL: getPublicEnvVar('NEXT_PUBLIC_API_BASE_URL'),
  NEXT_PUBLIC_STELLAR_NETWORK: getPublicEnvVar('NEXT_PUBLIC_STELLAR_NETWORK'),
} as const;
