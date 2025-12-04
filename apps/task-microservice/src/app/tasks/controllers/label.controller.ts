import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AssignLabelDto, CreateLabelDto, RemoveLabelDto, UpdateLabelDto } from '@shared/contracts';
import { LabelService } from '../services/label.service';

@Controller()
export class LabelController {
  constructor(private readonly labelService: LabelService) {}

  @MessagePattern({ cmd: 'label_create' })
  create(@Payload() dto: CreateLabelDto) {
    return this.labelService.create(dto);
  }

  @MessagePattern({ cmd: 'label_update' })
  update(@Payload() dto: UpdateLabelDto) {
    return this.labelService.update(dto);
  }

  @MessagePattern({ cmd: 'label_delete' })
  delete(@Payload() id: string) {
    return this.labelService.delete(id);
  }

  @MessagePattern({ cmd: 'label_list_by_project' })
  listByProject(@Payload() project_id: string) {
    return this.labelService.listByProject(project_id);
  }

  @MessagePattern({ cmd: 'label_assign_to_task' })
  assign(@Payload() dto: AssignLabelDto) {
    return this.labelService.assign(dto);
  }

  @MessagePattern({ cmd: 'label_remove_from_task' })
  remove(@Payload() dto: RemoveLabelDto) {
    return this.labelService.remove(dto);
  }
}
