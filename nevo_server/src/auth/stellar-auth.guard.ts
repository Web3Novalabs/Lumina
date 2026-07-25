import { Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Injectable()
export class StellarAuthGuard extends JwtAuthGuard {}

