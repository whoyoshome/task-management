import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateProjectDto, UpdateProjectDto } from '@shared/contracts';
import { ProjectService } from '../services/project.service';

// Errors are converted to the shared RPC error format by
// AllRpcExceptionsFilter.
@Controller()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @MessagePattern({ cmd: 'project_create' })
  create(@Payload() dto: CreateProjectDto) {
    return this.projectService.create(dto);
  }

  @MessagePattern({ cmd: 'project_update' })
  update(@Payload() { id, data }: { id: string; data: UpdateProjectDto }) {
    return this.projectService.update(id, data);
  }

  @MessagePattern({ cmd: 'project_find_all' })
  findAll(
    @Payload()
    { user_id, all_projects }: { user_id: string; all_projects: boolean }
  ) {
    return this.projectService.findVisibleTo(user_id, all_projects);
  }

  @MessagePattern({ cmd: 'project_find_one' })
  findOne(@Payload() id: string) {
    return this.projectService.findOne(id);
  }

  @MessagePattern({ cmd: 'project_delete' })
  remove(@Payload() id: string) {
    return this.projectService.remove(id);
  }

  @MessagePattern({ cmd: 'project_find_one_with_members' })
  findOneWithMembers(@Payload() id: string) {
    return this.projectService.findOneWithMembers(id);
  }
}
