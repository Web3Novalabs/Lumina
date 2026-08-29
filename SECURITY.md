# Security Policy

The Nevo team and community take the security of our application, backend services, and smart contracts very seriously. We appreciate responsible security research and disclosure.

## Supported Versions

We actively support and maintain the latest release of Nevo on the `main` branch. Security fixes will be applied to the current active components:

| Component | Directory | Supported | Notes |
| --- | --- | --- | --- |
| Frontend | `nevo_frontend/` | :white_check_mark: | Next.js frontend application |
| Backend Server | `nevo_server/` | :white_check_mark: | NestJS API backend |
| Smart Contract | `nevo_contract/` | :white_check_mark: | Soroban smart contracts on Stellar |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in Nevo (including frontend, backend authentication/authorization, or Soroban smart contracts), please disclose it responsibly using one of the following private methods:

### 1. GitHub Private Vulnerability Reporting (Preferred)
Submit a private security advisory directly via GitHub:
1. Navigate to the repository's **Security** tab.
2. Select **Advisories** and click **Report a vulnerability**.
3. Fill out the details including proof of concept, impact, and steps to reproduce.

### 2. Contact Maintainers
If GitHub Private Vulnerability Reporting is unavailable, please reach out directly to the maintainers:
- Contact Maintainer: [@Akshola00](https://github.com/Akshola00)

## What to Include in a Security Report

To help us evaluate and address the issue efficiently, please include as much of the following as possible:

- **Type of issue**: (e.g. smart contract reentrancy/logic flaw, backend auth bypass, XSS, API key leakage, etc.)
- **Affected component(s)**: (`nevo_frontend`, `nevo_server`, or `nevo_contract`)
- **Detailed steps to reproduce** or a minimal Proof of Concept (PoC)
- **Potential impact** of the vulnerability
- Any suggested fixes or mitigations (optional)

## Disclosure & Remediation Policy

1. **Acknowledgment**: We aim to acknowledge receipt of your vulnerability report within 48 hours.
2. **Assessment**: Our maintainers will investigate and verify the report.
3. **Fix & Patching**: We will work on a patch and notify you when a fix is ready for testing/verification.
4. **Public Release**: Once the patch is merged and deployed, we will coordinate public disclosure if appropriate and give proper credit to the reporter (unless anonymity is requested).

Thank you for helping keep Nevo and the Stellar ecosystem safe!
