import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreatePoolDto {
  @ApiProperty({ description: 'Pool id assigned by the contract on-chain.' })
  @IsString()
  @IsNotEmpty()
  contractPoolId: string;

  @ApiProperty({ description: 'Stellar public key (G...) of the creator.' })
  @IsString()
  @IsNotEmpty()
  creatorWallet: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @ApiProperty({
    description: 'Fundraising target, as a numeric string in stroops.',
    example: '1000000000',
  })
  @IsNumberString()
  goal: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @IsUrl()
  imageUrl?: string | null;
}
