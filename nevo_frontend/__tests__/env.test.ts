describe('public env configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_STELLAR_NETWORK;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('env object', () => {
    it('falls back to default values when public env vars are missing', async () => {
      const { env } = await import('../lib/env');

      expect(env.NEXT_PUBLIC_API_BASE_URL).toBe('http://localhost:3000');
      expect(env.NEXT_PUBLIC_STELLAR_NETWORK).toBe('testnet');
    });

    it('uses process.env values when they are set', async () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com';
      process.env.NEXT_PUBLIC_STELLAR_NETWORK = 'public';

      const { env } = await import('../lib/env');

      expect(env.NEXT_PUBLIC_API_BASE_URL).toBe('https://api.example.com');
      expect(env.NEXT_PUBLIC_STELLAR_NETWORK).toBe('public');
    });
  });

  describe('validatePublicEnv', () => {
    it('completes without throwing when all required vars are present', async () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com';
      process.env.NEXT_PUBLIC_STELLAR_NETWORK = 'public';

      const { validatePublicEnv } = await import('../lib/env');

      expect(() => validatePublicEnv()).not.toThrow();
    });

    it('completes without throwing when vars are missing (falls back to defaults)', async () => {
      const { validatePublicEnv } = await import('../lib/env');

      expect(() => validatePublicEnv()).not.toThrow();
    });
  });
});
