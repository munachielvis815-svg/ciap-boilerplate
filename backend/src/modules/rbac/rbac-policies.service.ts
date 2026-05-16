import { Injectable } from '@nestjs/common';
import { ROLE_ABILITIES } from '@constants/abilities.constant';
import type { AppAbility } from '@constants/abilities.constant';
import type { AppRole } from '@constants/roles.constant';

@Injectable()
export class RbacPoliciesService {
  getAbilitiesForRole(role: AppRole): AppAbility[] {
    return ROLE_ABILITIES[role] || [];
  }

  hasAnyAbility(role: AppRole, requiredAbilities: AppAbility[]): boolean {
    const abilities = this.getAbilitiesForRole(role);
    return requiredAbilities.some((ability) => abilities.includes(ability));
  }
}
