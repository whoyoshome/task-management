import { Injectable } from '@nestjs/common';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
} from '@shared/contracts';
import { firstValueFrom } from 'rxjs';
import { UserTcpClient } from '@shared/clients';

@Injectable()
export class UserService {
  constructor(private readonly userTcpClient: UserTcpClient) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    return firstValueFrom(
      this.userTcpClient.getClient().send({ cmd: 'create_user' }, dto)
    );
  }

  async findAll(): Promise<UserResponseDto[]> {
    return firstValueFrom(
      this.userTcpClient.getClient().send({ cmd: 'get_all_users' }, {})
    );
  }

  async findOne(id: string): Promise<UserResponseDto> {
    return firstValueFrom(
      this.userTcpClient.getClient().send({ cmd: 'get_user_by_id' }, id)
    );
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    return firstValueFrom(
      this.userTcpClient.getClient().send({ cmd: 'update_user' }, { id, dto })
    );
  }

  async remove(id: string): Promise<void> {
    return firstValueFrom(
      this.userTcpClient.getClient().send({ cmd: 'delete_user' }, id)
    );
  }

  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    return firstValueFrom(
      this.userTcpClient.getClient().send({ cmd: 'get_current_user' }, userId)
    );
  }
}
