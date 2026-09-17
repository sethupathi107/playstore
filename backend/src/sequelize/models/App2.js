import { Model, DataTypes } from '@sequelize/core';
import {
  Attribute,
  Table,
  PrimaryKey,
  Default,
  NotNull,
  Unique,
  ValidateAttribute,
} from '@sequelize/core/decorators-legacy';

@Table({ modelName: 'User', paranoid: true, timestamps: true })
export class User extends Model {
  @Attribute(DataTypes.UUID)
  @Default(DataTypes.UUIDV4)
  @PrimaryKey
  @NotNull
  id;

  @Attribute(DataTypes.STRING)
  @NotNull
  @ValidateAttribute({ notEmpty: true, len: [2, 50] })
  username;

  @Attribute(DataTypes.STRING)
  @NotNull
  @Unique
  @ValidateAttribute({ isEmail: true, notEmpty: true })
  email;

  @Attribute(DataTypes.STRING)
  @NotNull
  @ValidateAttribute({ notEmpty: true, len: [60, 60] })
  passward;

  static associate(models) {
    
  }
}

export default User;