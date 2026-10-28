import { Test, TestingModule } from '@nestjs/testing';
import { LabelService } from './label.service';
import { TaskTcpClient } from '@shared/clients';
import { RemoteProjectValidatorService } from '@libs/utils';
import { LabelResponseDto } from '@shared/contracts';
import { of } from 'rxjs';

describe('LabelService (API Gateway)', () => {
  let service: LabelService;

  const mockLabel: LabelResponseDto = {
    id: 'label-1',
    project_id: 'project-1',
    name: 'Bug',
    color: '#ff0000',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };

  const mockSend = jest.fn();
  const mockTcpClient = {
    getClient: jest.fn().mockReturnValue({
      send: mockSend,
    }),
  };

  const mockProjectValidator = {
    validateProjectExists: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LabelService,
        { provide: TaskTcpClient, useValue: mockTcpClient },
        {
          provide: RemoteProjectValidatorService,
          useValue: mockProjectValidator,
        },
      ],
    }).compile();

    service = module.get<LabelService>(LabelService);
    jest.clearAllMocks();
  });

  it('should list labels by project', async () => {
    mockSend.mockReturnValue(of([mockLabel]));

    const result = await service.listByProject('project-1');

    expect(mockProjectValidator.validateProjectExists).toHaveBeenCalledWith(
      'project-1'
    );
    expect(mockSend).toHaveBeenCalledWith(
      { cmd: 'label_list_by_project' },
      'project-1'
    );
    expect(result).toEqual([mockLabel]);
  });

  it('should list labels by task', async () => {
    mockSend.mockReturnValue(of([mockLabel]));

    const result = await service.listByTask('task-1');

    expect(mockSend).toHaveBeenCalledWith(
      { cmd: 'label_list_by_task' },
      'task-1'
    );
    expect(result).toEqual([mockLabel]);
  });
});
