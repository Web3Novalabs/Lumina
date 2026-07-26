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

  it('falls back to default values when public env vars are missing', async () => {
    const { env } = await import('../lib/env');

    expect(env.NEXT_PUBLIC_API_BASE_URL).toBe('http://localhost:3000');
    expect(env.NEXT_PUBLIC_STELLAR_NETWORK).toBe('testnet');
  });
});
