import { Model, DataTypes } from '@sequelize/core';


export default function defineLogs(sequelize){
    class Logs extends Model{}
    Logs.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          unique: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: { notEmpty: true, len: [2, 20] },
        },
      },
      {
        sequelize,
        modelName: 'Logs',
        timestamps: true,
        updatedAt:false,
      }
    );
    
    return Logs;
}
 
