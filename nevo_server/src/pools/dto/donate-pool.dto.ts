import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString } from 'class-validator';

export class DonatePoolDto {
  @ApiProperty({
    description: 'Donation amount, as a numeric string in stroops.',
    example: '10000000',
  })
  @IsNumberString()
  @IsNotEmpty()
  amount: string;
}
