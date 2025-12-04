import { Injectable, BadRequestException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { UserTcpClient } from '@shared/clients';

@Injectable()
export class RemoteUserValidatorService {
  constructor(private readonly userTcpClient: UserTcpClient) {}

  async validateUserExists(userId: string, label: string): Promise<void> {
    try {
      await firstValueFrom(
        this.userTcpClient.getClient().send({ cmd: 'get_user_by_id' }, userId)
      );
    } catch {
      throw new BadRequestException(`The user in '${label}' does not exist.`);
    }
  }

  async validateUserIsAdmin(userId: string): Promise<void> {
    const user = await firstValueFrom(
      this.userTcpClient.getClient().send({ cmd: 'get_user_by_id' }, userId)
    );

    if (user.role !== 'admin') {
      throw new BadRequestException('Only admin users can create a project.');
    }
  }
}
