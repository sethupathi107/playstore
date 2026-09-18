import { Model, DataTypes } from '@sequelize/core';

export default function defineApplication(sequelize, { User, Category }) {
class Application extends Model {
    static associate(models){
        Application.belongsTo(models.Category, {
            foreignKey: {
                name: 'categoryId',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            as: 'category',
        })
        Application.belongsTo(models.User, {
            foreignKey: {
                name: "userId",
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            as: 'user',
        })
        Application.hasMany(models.Installed, {
            foreignKey: {
                name: 'applicationId',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            as: 'installed',
        })
        Application.hasMany(models.Image, {
            foreignKey: {
                name: 'applicationId',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            as: 'images',
        })
    }
}
  Application.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: User,
          key: 'id',
        },
        validate: { notEmpty: true },
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: Category,
          key: 'id',
        },
        validate: { notEmpty: true },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true, len: [2, 50] },
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true, len: [2, 50] },
      },
      applicationURL: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true, len: [2, 50] },
      },
    },
    {
      sequelize,
      modelName: 'Application',
      timestamps: true,
    }
  );

  Application.addHook("afterDestroy",async(instance, options)=>{
    const {Image,Installed}=instance.sequelize.models;
    await Image.destroy({
      where:{
        applicationId:instance.id
      },
      transaction:options.transaction
    })

    await Installed.destroy({
      where:{
        applicationId: instance.id
      },
      transaction:options.transaction
    })
  })

  return Application;
}
