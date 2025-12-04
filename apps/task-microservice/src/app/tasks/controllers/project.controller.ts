import { Controller, NotFoundException } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { CreateProjectDto, UpdateProjectDto } from '@shared/contracts';
import { ProjectService } from '../services/project.service';

@Controller()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @MessagePattern({ cmd: 'project_create' })
  async create(@Payload() dto: CreateProjectDto) {
    try {
      return await this.projectService.create(dto);
    } catch (error: any) {
      if (error instanceof RpcException) {
        throw error;
      }

      console.error('Error in project_create:', error);

      if (error.message?.includes('value too long') || error.code === '22001') {
        throw new RpcException({
          statusCode: 400,
          message: `Project key is too long. Maximum length is 20 characters.`,
        });
      }

      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        throw new RpcException({
          statusCode: 409,
          message: `Project with key '${dto.key}' already exists`,
        });
      }

      if (
        error.code === '22P02' ||
        error.message?.includes('invalid input syntax for type uuid')
      ) {
        throw new RpcException({
          statusCode: 400,
          message: `Invalid UUID format: ${error.message}`,
        });
      }

      if (
        error.message?.includes('key is required') ||
        error.message?.includes('Project key')
      ) {
        throw new RpcException({
          statusCode: 400,
          message: error.message || 'Project key is required',
        });
      }

      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Failed to create project',
      });
    }
  }
  @MessagePattern({ cmd: 'project_update' })
  update(@Payload() { id, data }: { id: string; data: UpdateProjectDto }) {
    return this.projectService.update(id, data);
  }

  @MessagePattern({ cmd: 'project_find_all' })
  findAll() {
    return this.projectService.findAll();
  }

  @MessagePattern({ cmd: 'project_find_one' })
  async findOne(@Payload() id: string) {
    try {
      return await this.projectService.findOne(id);
    } catch (error: any) {
      if (error instanceof RpcException) {
        throw error;
      }

      if (
        error.code === '22P02' ||
        error.message?.includes('invalid input syntax for type uuid')
      ) {
        throw new RpcException({
          statusCode: 400,
          message: `Invalid project_id format: ${id}`,
        });
      }

      if (error instanceof NotFoundException || error.statusCode === 404) {
        throw new RpcException({
          statusCode: 404,
          message: 'Project not found',
        });
      }

      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Failed to find project',
      });
    }
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
