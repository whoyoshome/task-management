import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectRolesGuard } from './project-roles.guard';
import { PROJECT_ROLES_KEY } from './project-roles.decorator';
import {
  PROJECT_SCOPE_KEY,
  ProjectScopeOptions,
} from './project-scope.decorator';
import { RemoteAccessService } from '@libs/utils';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { ProjectRole, UserRole } from '@shared/contracts';

describe('ProjectRolesGuard', () => {
  let guard: ProjectRolesGuard;
  let accessService: jest.Mocked<RemoteAccessService>;
  let metadata: Record<string, unknown>;

  const MY_PROJECT = '11111111-1111-4111-8111-111111111111';
  const OTHER_PROJECT = '22222222-2222-4222-8222-222222222222';
  const TASK_ID = '33333333-3333-4333-8333-333333333333';
  const LABEL_ID = '44444444-4444-4444-8444-444444444444';
  const MEMBER_ID = '55555555-5555-4555-8555-555555555555';

  const user: JwtPayload = {
    sub: 'user-123',
    email: 'user@example.com',
    role: UserRole.USER,
  };

  const context = (
    request: {
      params?: object;
      body?: object;
      query?: object;
      user?: JwtPayload;
    } = {}
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params: {}, body: {}, query: {}, ...request }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  const route = (roles: ProjectRole[] | undefined, scope?: ProjectScopeOptions) => {
    metadata = { [PROJECT_ROLES_KEY]: roles, [PROJECT_SCOPE_KEY]: scope };
  };

  // Resources and the projects they belong to in the fake task-microservice.
  const owners: Record<string, string> = {
    [`project:${MY_PROJECT}`]: MY_PROJECT,
    [`project:${OTHER_PROJECT}`]: OTHER_PROJECT,
    [`task:${TASK_ID}`]: MY_PROJECT,
    [`label:${LABEL_ID}`]: OTHER_PROJECT,
    [`project_member:${MEMBER_ID}`]: OTHER_PROJECT,
  };

  beforeEach(async () => {
    metadata = {};
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectRolesGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: (key: string) => metadata[key] },
        },
        {
          provide: RemoteAccessService,
          useValue: {
            resolveProjectId: jest.fn(
              async (resource: string, id: string) =>
                owners[`${resource}:${id}`] ?? null
            ),
            getMemberRole: jest.fn(async (projectId: string) =>
              projectId === MY_PROJECT ? ProjectRole.MEMBER : null
            ),
          },
        },
      ],
    }).compile();

    guard = module.get(ProjectRolesGuard);
    accessService = module.get(RemoteAccessService);
  });

  it('allows routes without @ProjectRoles', async () => {
    route(undefined);

    await expect(guard.canActivate(context())).resolves.toBe(true);
  });

  it('fails closed when a route has roles but no @ProjectScope', async () => {
    route([ProjectRole.MEMBER]);

    await expect(guard.canActivate(context())).rejects.toThrow(
      InternalServerErrorException
    );
  });

  it('resolves the project from the referenced resource', async () => {
    route([ProjectRole.MEMBER], { resource: 'task', in: 'param', key: 'id' });

    await expect(
      guard.canActivate(context({ params: { id: TASK_ID } }))
    ).resolves.toBe(true);
    expect(accessService.resolveProjectId).toHaveBeenCalledWith('task', TASK_ID);
    expect(accessService.getMemberRole).toHaveBeenCalledWith(MY_PROJECT, user.sub);
  });

  it('rejects a malformed id with 400 and an unknown one with 404', async () => {
    route([ProjectRole.MEMBER], { resource: 'task', in: 'param', key: 'id' });

    await expect(
      guard.canActivate(context({ params: { id: 'not-a-uuid' } }))
    ).rejects.toThrow(BadRequestException);
    await expect(
      guard.canActivate(
        context({ params: { id: '99999999-9999-4999-8999-999999999999' } })
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('ignores a client project_id that points to another project (scope bypass)', async () => {
    // Member of MY_PROJECT tries to remove a member of OTHER_PROJECT by
    // claiming MY_PROJECT in the query string.
    route([ProjectRole.MEMBER], {
      resource: 'project_member',
      in: 'param',
      key: 'id',
    });

    await expect(
      guard.canActivate(
        context({ params: { id: MEMBER_ID }, query: { project_id: MY_PROJECT } })
      )
    ).rejects.toThrow(new ForbiddenException('project_id does not match the resource'));
  });

  it('denies a non-member of the resource project', async () => {
    route([ProjectRole.MEMBER], {
      resource: 'project_member',
      in: 'param',
      key: 'id',
    });

    await expect(
      guard.canActivate(context({ params: { id: MEMBER_ID } }))
    ).rejects.toThrow('Not a project member');
  });

  it('requires related resources to belong to the same project', async () => {
    route([ProjectRole.MEMBER], {
      resource: 'task',
      in: 'param',
      key: 'taskId',
      also: [{ resource: 'label', in: 'param', key: 'labelId' }],
    });

    await expect(
      guard.canActivate(
        context({ params: { taskId: TASK_ID, labelId: LABEL_ID } })
      )
    ).rejects.toThrow('labelId belongs to a different project');
  });

  it('checks the required role', async () => {
    route([ProjectRole.ADMIN], { resource: 'task', in: 'param', key: 'id' });

    await expect(
      guard.canActivate(context({ params: { id: TASK_ID } }))
    ).rejects.toThrow('Insufficient project role');
  });

  it('lets global admins through after resolving the scope', async () => {
    route([ProjectRole.ADMIN], {
      resource: 'project_member',
      in: 'param',
      key: 'id',
    });
    const admin = { ...user, role: UserRole.ADMIN };

    await expect(
      guard.canActivate(context({ user: admin, params: { id: MEMBER_ID } }))
    ).resolves.toBe(true);
    expect(accessService.getMemberRole).not.toHaveBeenCalled();
  });

  describe('search limited to own tasks', () => {
    const searchScope: ProjectScopeOptions = {
      resource: 'project',
      in: 'query',
      key: 'project_id',
      allowOwnAssignedTasks: true,
    };
    const search = (query: object) =>
      guard.canActivate(context({ query: { project_id: OTHER_PROJECT, ...query } }));

    beforeEach(() => route([ProjectRole.VIEWER], searchScope));

    it('lets a non-member search only their own assigned tasks', async () => {
      await expect(search({ assignee_ids: user.sub })).resolves.toBe(true);
      await expect(search({ assignee_ids: [user.sub] })).resolves.toBe(true);
    });

    it('rejects when other assignees are included', async () => {
      await expect(
        search({ assignee_ids: [user.sub, 'other-user'] })
      ).rejects.toThrow('Not a project member');
    });

    it('ignores "assignee_ids[]", which the search DTO drops (filter bypass)', async () => {
      await expect(search({ 'assignee_ids[]': user.sub })).rejects.toThrow(
        'Not a project member'
      );
    });

    it('does not apply to routes without allowOwnAssignedTasks', async () => {
      route([ProjectRole.VIEWER], { ...searchScope, allowOwnAssignedTasks: false });

      await expect(search({ assignee_ids: user.sub })).rejects.toThrow(
        'Not a project member'
      );
    });
  });
});
