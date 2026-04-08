import { SetMetadata } from '@nestjs/common';
import type { AppAbility } from '@constants/abilities.constant';

export const ABILITIES_KEY = 'abilities';
export const RequireAbilities = (...abilities: AppAbility[]) =>
  SetMetadata(ABILITIES_KEY, abilities);
