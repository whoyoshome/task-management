import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AccessService } from '../services/access.service';

@Controller()
export class AccessController {
  constructor(private readonly service: AccessService) {}

  @MessagePattern({ cmd: 'project_member_get_role' })
  getRole(@Payload() payload: { project_id: string; user_id: string }) {
    return this.service.getMemberRole(payload.project_id, payload.user_id);
  }

  @MessagePattern({ cmd: 'access_resolve_project' })
  resolve(@Payload() payload: { resource: string; id: string }) {
    return this.service.resolveProjectId(payload.resource, payload.id);
  }
}
