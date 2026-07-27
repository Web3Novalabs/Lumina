import { Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';

/**
 * @deprecated Use {@link JwtAuthGuard} directly. Kept as an alias so existing
 * imports keep working after the guards were consolidated onto Passport's JWT strategy.
 */
@Injectable()
export class StellarAuthGuard extends JwtAuthGuard {}
