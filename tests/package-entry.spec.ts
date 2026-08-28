import { describe, expect, it } from 'vitest';

describe('package entry', () => {
    it('exports something', async () => {
        const mod = await import('../lib/index.js');
        expect(Object.keys(mod).length).toBeGreaterThan(0);
    });

    it('exports the OIDC module and services', async () => {
        const mod = await import('../lib/index.js');
        expect(mod.OidcModule).toBeDefined();
        expect(mod.OidcService).toBeDefined();
        expect(mod.OidcAuthService).toBeDefined();
        expect(mod.OIDC_ACCOUNT_SERVICE).toBe('NESTJS:OIDC_ACCOUNT_SERVICE');
    });
});
