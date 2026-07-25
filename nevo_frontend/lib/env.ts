const REQUIRED_PUBLIC_ENV_VARS = [
  'NEXT_PUBLIC_API_BASE_URL',
  'NEXT_PUBLIC_STELLAR_NETWORK',
] as const;

type RequiredPublicEnvVar = (typeof REQUIRED_PUBLIC_ENV_VARS)[number];

const PUBLIC_ENV_FALLBACKS: Record<RequiredPublicEnvVar, string> = {
  NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3000',
  NEXT_PUBLIC_STELLAR_NETWORK: 'testnet',
};

function getPublicEnvVar(name: RequiredPublicEnvVar): string {
  const value = process.env[name];
  if (value) {
    return value;
  }
  return PUBLIC_ENV_FALLBACKS[name];
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
