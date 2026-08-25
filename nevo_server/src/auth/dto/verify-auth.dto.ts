import { IsHexadecimal, IsNotEmpty, IsString, Matches } from 'class-validator';

/** Stellar Ed25519 public keys are base32, start with `G`, and are 56 chars long. */
const STELLAR_PUBLIC_KEY = /^G[A-Z2-7]{55}$/;

/**
 * Body of `POST /auth/verify`: the wallet's answer to the challenge issued by
 * `GET /auth/challenge`.
 *
 * This is a class rather than an interface on purpose — the global
 * ValidationPipe (`whitelist`/`forbidNonWhitelisted`/`transform`) reads the
 * runtime metatype, so an interface here would be erased at runtime and the
 * body would go entirely unvalidated.
 */
export class VerifyAuthDto {
  /** Stellar public key (G...) of the wallet signing in. */
  @IsString()
  @IsNotEmpty()
  @Matches(STELLAR_PUBLIC_KEY, {
    message: 'publicKey must be a valid Stellar public key (G...)',
  })
  publicKey: string;

  /** Hex-encoded Ed25519 signature over `message`. */
  @IsString()
  @IsNotEmpty()
  @IsHexadecimal({ message: 'signature must be hex-encoded' })
  signature: string;

  /** The nonce previously returned by `GET /auth/challenge`. */
  @IsString()
  @IsNotEmpty()
  message: string;
}
