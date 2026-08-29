import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePoolDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  contractPoolId: string;

  @IsString()
  @IsNotEmpty()
  creatorWallet: string;

  @IsString()
  @IsNotEmpty()
  goal: string;

  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsString()
  description?: string;

  @IsString()
  imageUrl?: string;
}
