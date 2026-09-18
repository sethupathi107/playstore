import { Category } from "../sequelize/config/database.js";
import { logger } from "../utils/logger.js";
import client from "../utils/redisClient.js";
const EXP = process.env.EXP;

async function getAllCategories(req, res) {

    const cacheKey = "category:all";
    try{
        const cached = await client.get(cacheKey);
        if(cached){
            return res.status(200).json(JSON.parse(cached))
        }
    } catch(error){
        logger.error("Redis GET failed, falling back to DB: ",error.message)
    }

    try {
        const categories = await Category.findAll();
        try{
            await client.set(cacheKey,JSON.stringify(categories), {EX:EXP});
        } catch(error) {
            logger.error("Redis GET failed, falling back to DB: ",error.message)
        }
        res.json(categories);
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function createCategory(req, res) {
    try {
        const { name } = req.body;

        const existingCategory = await Category.findOne({ where: { name } });

        if (existingCategory) {
            return res.status(409).json({ message: "Category already exists" });
        }

        const newCategory = await Category.create({ name });

        try{
            await client.del("category:all");
        }catch(error){
            logger.error("Redis DEL failed: ", error.message);
        }

        logger.info(`User ${req.user.id} created category ${newCategory.id} (${newCategory.name})`);

        res.status(201).json(newCategory);
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function deleteCategory(req, res) {
    try {
        const { id } = req.body;

        const category = await Category.findOne({ where: { id } });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        await category.destroy();

        try{
            await client.del("category:all");
        }catch(error){
            logger.error("Redis DEL failed: ", error.message);
        }

        logger.info(`User ${req.user.id} deleted category ${category.id} (${category.name})`);

        res.json({ message: "Category deleted", category });
    } catch (error) {
        logger.error(error.stack || error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default {
    getAllCategories,
    createCategory,
    deleteCategory
};
