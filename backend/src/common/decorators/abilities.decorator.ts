import { SetMetadata } from '@nestjs/common';
import { InvalidEnumException } from '@common/exceptions';
import { ABILITY_VALUES, type AppAbility } from '@constants/abilities.constant';

export const ABILITIES_KEY = 'abilities';

const ABILITY_SET: ReadonlySet<string> = new Set(ABILITY_VALUES);

export const RequireAbilities = (...abilities: AppAbility[]) => {
  const invalidValues = abilities.filter(
    (ability) => !ABILITY_SET.has(ability),
  );

  if (invalidValues.length > 0) {
    throw new InvalidEnumException('abilities', [...ABILITY_VALUES], {
      invalidValues,
    });
  }

  return SetMetadata(ABILITIES_KEY, abilities);
};
