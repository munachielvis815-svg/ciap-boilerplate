import { Module } from '@nestjs/common';
import { RbacPoliciesService } from './rbac-policies.service';

@Module({
  providers: [RbacPoliciesService],
  exports: [RbacPoliciesService],
})
export class RbacModule {}
