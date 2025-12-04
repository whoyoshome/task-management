import { Controller, NotFoundException } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '@shared/contracts';
import { UserService } from '../services/user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  private excludePassword(user: User): Omit<User, 'password'> {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @MessagePattern({ cmd: 'create_user' })
  async create(@Payload() dto: CreateUserDto) {
    try {
      const user = await this.userService.create(dto);
      return this.excludePassword(user);
    } catch (error: any) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Failed to create user',
      });
    }
  }

  @MessagePattern({ cmd: 'get_all_users' })
  async findAll() {
    try {
      const users = await this.userService.findAll();
      return users.map((user) => this.excludePassword(user));
    } catch (error: any) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Failed to get users',
      });
    }
  }

  @MessagePattern({ cmd: 'get_user_by_id' })
  async findOne(@Payload() id: string) {
    try {
      const user = await this.userService.findOne(id);
      return this.excludePassword(user);
    } catch (error: any) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof NotFoundException || error.statusCode === 404) {
        throw new RpcException({
          statusCode: 404,
          message: 'User not found',
        });
      }
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Failed to get user',
      });
    }
  }

  @MessagePattern({ cmd: 'update_user' })
  async update(@Payload() data: { id: string; dto: UpdateUserDto }) {
    try {
      const user = await this.userService.update(data.id, data.dto);
      return this.excludePassword(user);
    } catch (error: any) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof NotFoundException || error.statusCode === 404) {
        throw new RpcException({
          statusCode: 404,
          message: 'User not found',
        });
      }
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Failed to update user',
      });
    }
  }

  @MessagePattern({ cmd: 'delete_user' })
  async remove(@Payload() id: string) {
    try {
      await this.userService.remove(id);
    } catch (error: any) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof NotFoundException || error.statusCode === 404) {
        throw new RpcException({
          statusCode: 404,
          message: 'User not found',
        });
      }
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Failed to delete user',
      });
    }
  }

  @MessagePattern({ cmd: 'get_user_by_email' })
  async getUserByEmail(@Payload() email: string) {
    try {
      const user = await this.userService.findByEmail(email);
      if (!user) {
        return null;
      }
      return user;
    } catch (error: any) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Failed to get user by email',
      });
    }
  }

  @MessagePattern({ cmd: 'get_current_user' })
  async getCurrentUser(@Payload() id: string) {
    try {
      const user = await this.userService.findOne(id);
      return this.excludePassword(user);
    } catch (error: any) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (error instanceof NotFoundException || error.statusCode === 404) {
        throw new RpcException({
          statusCode: 404,
          message: 'User not found',
        });
      }
      throw new RpcException({
        statusCode: 500,
        message: error.message || 'Failed to get current user',
      });
    }
  }
}
