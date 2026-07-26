import { IsString, Length } from 'class-validator';

export class UpdateDisplayNameDto {
  @IsString()
  @Length(1, 50)
  displayName: string;
}
