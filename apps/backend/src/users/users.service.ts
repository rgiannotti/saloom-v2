import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import bcrypt from "bcrypt";
import { FilterQuery, Model, Types } from "mongoose";

import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User, UserDocument } from "./schemas/user.schema";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>
  ) {}

  private readonly saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...rest } = createUserDto;
    const passwordHash = password ? await bcrypt.hash(password, this.saltRounds) : undefined;
    const created = await this.userModel.create({
      ...rest,
      ...(passwordHash ? { passwordHash } : {})
    });
    const createdId =
      typeof created._id === "string" ? created._id : (created._id as Types.ObjectId).toHexString();
    return this.findOne(createdId);
  }

  findAll(filter: FilterQuery<UserDocument> = {}): Promise<User[]> {
    return this.userModel.find(filter).select(this.safeSelect()).lean().exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select(this.safeSelect()).lean().exec();
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string, includeSecrets: true): Promise<UserDocument | null>;
  async findByEmail(email: string, includeSecrets?: false): Promise<User | null>;
  async findByEmail(email: string, includeSecrets = false): Promise<UserDocument | User | null> {
    const query = this.userModel
      .findOne({ email })
      .select(includeSecrets ? "+passwordHash +refreshTokenHash" : this.safeSelect());
    return includeSecrets ? query.exec() : query.lean().exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { password, client, ...rest } = updateUserDto;
    const updateData: Partial<User> & { passwordHash?: string } = {
      ...rest,
      ...(client ? { client: new Types.ObjectId(client) } : {})
    };
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, this.saltRounds);
    }
    const updated = await this.userModel
      .findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      })
      .select(this.safeSelect())
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }

  async setRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, this.saltRounds);
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash }).exec();
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash: null }).exec();
  }

  private safeSelect() {
    return "-passwordHash -refreshTokenHash";
  }
}
