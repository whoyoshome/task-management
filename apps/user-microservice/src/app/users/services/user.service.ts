import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '@shared/contracts';
import { UserRepository } from '../repositories/user.repository';

// bcrypt hash of a random string, used only to equalize timing.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  randomBytes(16).toString('hex'),
  10
);

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.update(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.delete(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async validateCredentials(
    email: string,
    password: string
  ): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    // Compare against a dummy hash when the user is missing so response
    // time does not reveal whether the email exists.
    const hash = user?.password ?? DUMMY_PASSWORD_HASH;
    const matches = await bcrypt.compare(password, hash);
    if (!user || !matches || !user.is_active) return null;
    return user;
  }
}
