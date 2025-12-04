import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateProjectMemberDto } from '@shared/contracts';
import { ProjectMembersService } from '../services/project-members.service';

@Controller()
export class ProjectMembersController {
  constructor(private readonly projectMembersService: ProjectMembersService) {}

  @MessagePattern({ cmd: 'project_member_add' })
  add(@Payload() dto: CreateProjectMemberDto) {
    return this.projectMembersService.add(dto);
  }

  @MessagePattern({ cmd: 'project_member_remove' })
  remove(@Payload() id: string) {
    return this.projectMembersService.remove(id);
  }
}
